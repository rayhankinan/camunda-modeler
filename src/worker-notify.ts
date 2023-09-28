// Get modules
import { registerModule } from "./register-module";

// Register module
registerModule();

// Import internal dependencies
import { env } from "@environment/server";

// Import external dependencies
import { Duration, ZBClient } from "zeebe-node";

// Instantiate ZBClient
const zbc = new ZBClient(env.ZEEBE_GATEWAY_ADDRESS, {
  loglevel: "INFO",
  retry: true,
  maxRetries: -1,
  maxRetryTimeout: Duration.seconds.of(5),
});

// Notify process handler
const worker = zbc.createWorker({
  taskType: "zalora-notify",
  taskHandler: async (job) => {
    // TODO: Implement notify email sending
    worker.log("Notify called");

    return await job.complete();
  },
});
