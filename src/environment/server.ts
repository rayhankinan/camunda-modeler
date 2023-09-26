// Import external dependencies
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ZEEBE_GATEWAY_ADDRESS: z.string().url(),
  },
  runtimeEnv: process.env,
});
