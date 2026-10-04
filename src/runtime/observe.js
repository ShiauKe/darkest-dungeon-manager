import fs from "node:fs/promises";
import path from "node:path";
import { buildObservation, publishObservation } from "./local-channel.js";

const observation = await buildObservation();
const output = path.resolve("runtime/local-observation.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(observation, null, 2) + "\n");
console.log(JSON.stringify(observation, null, 2));

if (process.argv.includes("--publish")) publishObservation();
