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

// Reminder process handler
const worker = zbc.createWorker({
  taskType: "zalora-reminder",
  taskHandler: async (job) => {
    // TODO: Implement reminder email sending
    worker.log("Reminder called");

    return await job.complete();
  },
});
