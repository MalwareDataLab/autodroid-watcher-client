import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { z } from "zod";

import AppInfo from "@/package.json";
import { logger } from "@shared/utils/logger";

const argv = yargs(hideBin(process.argv))
  .scriptName(AppInfo.name)
  .option("token", {
    type: "string",
    alias: "t",
    demandOption: true,
    description: "Authentication token for worker",
  })
  .option("url", {
    type: "string",
    alias: "u",
    demandOption: true,
    description: "The server URL (required for client mode)",
  })
  .option("name", {
    type: "string",
    alias: "n",
    demandOption: true,
    description: "Name of the worker",
  })
  .help()
  .parseSync();

const paramsSchema = z.object({
  token: z.string(),
  url: z.string().url(),
  name: z.string(),
});

type Params = z.infer<typeof paramsSchema>;

const params = {
  token: argv.token as string,
  url: argv.url as string,
  name: argv.name as string,
} as Params;

const parsedConfig = paramsSchema.safeParse(params);

if (!parsedConfig.success) {
  const formattedErrors = parsedConfig.error.errors
    .map(err => `${err.path.join(".")}`)
    .join(", ");
  logger.error(`❌ Invalid configuration: ${formattedErrors}`);
  process.exit(1);
}

import("@modules/client");

export type { Params };
export { params };
