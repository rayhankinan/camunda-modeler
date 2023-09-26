// Use module-alias to import module from root directory
import "module-alias/register";

// Import internal dependencies
import { env } from "@environment/server";

// Import external dependencies
import { Duration, ZBClient } from "zeebe-node";
import { match } from "ts-pattern";

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
    // Do existence checking
    if (!job.variables.clothes || !job.variables.name) {
      return await job.error("NO_CLOTHES", "No clothes in order");
    }

    // Do type checking
    if (
      typeof job.variables.clothes !== "string" ||
      typeof job.variables.name !== "string"
    ) {
      return await job.error("INVALID_CLOTHES", "Invalid clothes in order");
    }

    // TODO: Lakukan checking ke database
    const name = job.variables.name;

    // TODO: Ubah ini jadi akses ke database
    const price = match(job.variables.clothes)
      .with("T-Shirt", () => 10)
      .with("Jacket", () => 20)
      .with("Trouser", () => 30)
      .otherwise(() => 0);

    worker.log(`Invoice for ${name} is ${price}`);

    return await job.complete({
      price,
    });
  },
});
