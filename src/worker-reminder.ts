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

// Reminder process handler
const worker = zbc.createWorker({
  taskType: "zalora-reminder",
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
      return await job.error("INVALID_USER", "Invalid user");
    }

    await transport.sendMail({
      from: env.SMTP_USER,
      to: user.email,
      subject: `Reminder for invoice ${parsed.data.invoice}`,
      text: `Your invoice for ${parsed.data.invoice} with total ${parsed.data.total} dollar(s) is not paid yet`,
    });

    worker.log(
      `Reminder to ${user.email} for invoice ${parsed.data.invoice} with total ${parsed.data.total} dollar(s) is sent`,
    );

    return await job.complete();
  },
});
