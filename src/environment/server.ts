// Import external dependencies
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ZEEBE_GATEWAY_ADDRESS: z.string().url(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.preprocess(
      // If SMTP_PORTL is not set, set it to 587
      (str) => (str ? +str : 587),
      // SMTP_PORTL must be a positive integer
      z.number().int().positive(),
    ),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
  },
  runtimeEnv: process.env,
});
