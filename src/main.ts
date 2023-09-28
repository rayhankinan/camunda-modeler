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

// Main program
void (async () => {
  // Start program
  console.log("Starting Zalora checkout program...");

  // Deploy process
  const res = await zbc.deployProcess("./process/zalora.bpmn");

  // Display deployment result
  console.log("Deployed process:", JSON.stringify(res, null, 2));

  // Create workflow instance
  const result = await zbc.createProcessInstance("zalora_checkout", {
    userId: "afe16982-7696-4280-a13a-5dd93ff89cb0",
  });

  // Display workflow instance result
  console.log("Process result:", JSON.stringify(result, null, 2));
})();
