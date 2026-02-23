import alchemy from "alchemy";
import { NeonBranch, NeonProject } from "alchemy/neon";
import { CloudflareStateStore } from "alchemy/state";
import * as dotenv from "dotenv";

dotenv.config();

/* *
* Alchemy State, Stage, and App Configuration
*/
type StageType = "PERSONAL" | "PULL_REQUEST" | "PRODUCTION";

function getStageType(stage: string): StageType {
  if (stage === "production") return "PRODUCTION";
  if (/^pr-\d+$/.test(stage)) return "PULL_REQUEST";
  return "PERSONAL";
}

export function resolveStage(): { stageName: string; stageType: StageType } {
  const stage = process.env.STAGE ?? process.env.USER;

  if (!stage) {
    throw new Error("STAGE environment variable must be set");
  }

  return {
    stageName: stage,
    stageType: getStageType(stage),
  };
}

const { stageName, stageType } = resolveStage();

await alchemy("from-juice", {
  stage: stageName,
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: stageType === "PRODUCTION"
    ? (scope) => new CloudflareStateStore(scope)
    : undefined
});

/* *
* Neon Configuration
*/
const neonApiKey = alchemy.secret(process.env.NEON_API_KEY);

const neonProject = await NeonProject("from-juice-neon-project", {
  name: "From Juice",
  apiKey: neonApiKey,
});

if (stageType === "PRODUCTION") {
  console.log("Using production Neon Branch")
} else {
  const neonBranch = await NeonBranch(`neon-branch-${stageName}`, {
    name: `${stageType}/${stageName}`,
    project: neonProject.id,
    apiKey: neonApiKey,
    endpoints: [
      {
        type: "read_only"
      },
      {
        type: "read_write"
      }
    ],
  });

  console.log(`${stageType} branch ready`);
  console.log(`Branch name: ${neonBranch.name}`);
}
