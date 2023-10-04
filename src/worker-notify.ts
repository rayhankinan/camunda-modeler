// Get modules
import { registerModule } from "./register-module";

// Register module
registerModule();

// Import internal dependencies
import { env } from "@environment/server";

// Import external dependencies
import { Duration, ZBClient } from "zeebe-node";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { createTransport } from "nodemailer";

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Instantiate PrismaClient
const prisma = new PrismaClient();

// Instantiate nodemailer transport
const transport = createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Notify process handler
const worker = zbc.createWorker({
  taskType: "zalora-notify",
  taskHandler: async (job) => {
    const schema = z.object({
      userId: z.string(),
      invoice: z.string(),
      total: z.number(),
    });

    const parsed = schema.safeParse(job.variables);

    if (!parsed.success) {
      return await job.error("INVALID_VARIABLES", "Invalid variables");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parsed.data.userId,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return await job.error("USER_NOT_FOUND", "User not found");
    }

    await transport.sendMail({
      from: env.SMTP_USER,
      to: user.email,
      subject: "Zalora Invoice",
      text: `Your invoice for ${parsed.data.invoice} with total ${parsed.data.total} dollar(s) has been paid`,
    });

    worker.log(
      `Notified user ${user.email} for invoice ${parsed.data.invoice} with total ${parsed.data.total} dollar(s)`,
    );

    return await job.complete();
  },
});
