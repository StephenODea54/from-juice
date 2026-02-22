import alchemy from "alchemy";
import { CloudflareStateStore } from "alchemy/state";
import * as dotenv from "dotenv";

dotenv.config();

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
  stateStore: stageType === "PRODUCTION"
    ? (scope) => new CloudflareStateStore(scope)
    : undefined
});
