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

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Instantiate PrismaClient
const prisma = new PrismaClient();

// Checkout process handler
const worker = zbc.createWorker({
  taskType: "zalora-invoice",
  taskHandler: async (job) => {
    // Create variable schema
    const schema = z.object({
      userId: z.string(),
      selectedItemIds: z.array(z.string()),
    });

    // Do schema parsing
    const parsed = schema.safeParse(job.variables);

    // Check if schema parsing is successful
    if (!parsed.success) {
      return await job.error("INVALID_VARIABLES", "Invalid variables");
    }

    // Do transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate total
      const sumAggregate = await tx.item.aggregate({
        _sum: {
          price: true,
        },
        where: {
          id: {
            in: parsed.data.selectedItemIds,
          },
        },
      });
      const total = sumAggregate._sum.price || 0;

      // Create payment
      const payment = await tx.payment.create({
        data: {
          userId: parsed.data.userId,
          total,
        },
        select: {
          id: true,
        },
      });

      // Create bought items
      for (const itemId of parsed.data.selectedItemIds) {
        await tx.boughtItem.create({
          data: {
            paymentId: payment.id,
            itemId,
          },
        });
      }

      // Get items that are bought
      const items = await tx.item.findMany({
        where: {
          id: {
            in: parsed.data.selectedItemIds,
          },
        },
        select: {
          name: true,
        },
      });

      // Format items to be included in the invoice
      const itemNames = items.map((item) => item.name);
      const formatter = new Intl.ListFormat("en", {
        style: "long",
        type: "conjunction",
      });
      const invoice = formatter.format(itemNames);

      return {
        invoice,
        total,
        paymentId: payment.id,
      };
    });

    worker.log(
      `User with id "${parsed.data.userId}" buys ${result.invoice} with total ${result.total} dollar(s)`,
    );

    return await job.complete(result);
  },
});
