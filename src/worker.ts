// Use module-alias to import module from root directory
import "module-alias/register";

// Import internal dependencies
import { env } from "@environment/server";

// Import external dependencies
import { Duration, ZBClient } from "zeebe-node";
import { match } from "ts-pattern";
import { z } from "zod";

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Checkout process handler
const worker = zbc.createWorker({
  taskType: "zalora-invoice",
  taskHandler: async (job) => {
    // Create variable schema
    const schema = z.object({
      clothes: z.string(),
      name: z.string(),
    });

    // Do schema parsing
    const parsed = schema.safeParse(job.variables);

    // Check if schema parsing is successful
    if (!parsed.success) {
      return await job.error("INVALID_VARIABLES", "Invalid variables");
    }

    // TODO: Ubah ini jadi akses ke database
    const price = match(job.variables.clothes)
      .with("T-Shirt", () => 10)
      .with("Jacket", () => 20)
      .with("Trouser", () => 30)
      .otherwise(() => 0);

    worker.log(`Invoice for ${parsed.data.name} is ${price}`);

    return await job.complete({
      price,
    });
  },
});
