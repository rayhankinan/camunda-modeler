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
import { compare } from "bcrypt";

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Instantiate PrismaClient
const prisma = new PrismaClient();

// Payment process handler
const worker = zbc.createWorker({
  taskType: "zalora-payment",
  taskHandler: async (job) => {
    const schema = z.object({
      userId: z.string(),
      paymentId: z.string(),
      password: z.string(),
    });

    // Do schema parsing
    const parsed = schema.safeParse(job.variables);

    // Check if schema parsing is successful
    if (!parsed.success) {
      return await job.error("INVALID_VARIABLES", "Invalid variables");
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: parsed.data.userId,
        },
        select: {
          passwordHash: true,
        },
      });

      const status =
        user !== null &&
        (await compare(parsed.data.password, user.passwordHash));

      if (status) {
        await tx.payment.update({
          where: {
            id: parsed.data.paymentId,
          },
          data: {
            isPaid: true,
          },
        });
      }

      return {
        status,
      };
    });

    worker.log(`Payment with id "${parsed.data.paymentId}" is paid`);

    return await job.complete(result);
  },
});
