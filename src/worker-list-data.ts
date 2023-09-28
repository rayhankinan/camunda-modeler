// Get modules
import { registerModule } from "./register-module";

// Register module
registerModule();

// Import internal dependencies
import { env } from "@environment/server";

// Import external dependencies
import { Duration, ZBClient } from "zeebe-node";
import { PrismaClient } from "@prisma/client";

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Instantiate PrismaClient
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// List data handler
const worker = zbc.createWorker({
  taskType: "zalora-list-data",
  taskHandler: async (job) => {
    // Get items
    const items = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Map items to fit the camunda form
    const itemData = items.map((item) => ({
      label: item.name,
      value: item.id,
    }));

    // Log item data
    worker.log(`List data: ${JSON.stringify(itemData)}`);

    return await job.complete({
      itemData,
    });
  },
});
