import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { NeonBranch, NeonProjectRef } from "alchemy/neon";
import { CloudflareStateStore } from "alchemy/state";
import * as dotenv from "dotenv";

dotenv.config();

/* *
* Alchemy State, Stage, and App Configuration
*/
type StageType = "PERSONAL" | "TEST" | "PULL_REQUEST" | "PRODUCTION";

function getStageType(stage: string): StageType {
  if (stage === "prod")
    return "PRODUCTION";
  if (/^pr-\d+$/.test(stage))
    return "PULL_REQUEST";
  if (stage.startsWith("test-"))
    return "TEST";
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

export const app = await alchemy("from-juice", {
  stage: stageName,
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: stageType === "PERSONAL"
    ? undefined
    : scope => new CloudflareStateStore(scope, { forceUpdate: true }),
});

/* *
* Neon Configuration
*/
const neonApiKey = alchemy.secret(process.env.NEON_API_KEY);

const neonProject = await NeonProjectRef({
  name: "From Juice",
  apiKey: neonApiKey,
  default_branch_name: "production",
  delete: false,
});

let dbConnectionUri: ReturnType<typeof alchemy.secret<string>>;

if (stageType === "PRODUCTION") {
  console.log("Using production Neon Branch");
  const productionDatabaseConnectionUri = process.env.PRODUCTION_DATABASE_URI;

  if (!productionDatabaseConnectionUri) {
    throw new Error("You forgot to add the database uri for production you silly goose");
  }

  dbConnectionUri = alchemy.secret(productionDatabaseConnectionUri);
}
else {
  const neonBranch = await NeonBranch(`neon-branch-${stageName}`, {
    name: `${stageType}/${stageName}`,
    project: neonProject.id,
    apiKey: neonApiKey,
    endpoints: [
      {
        type: "read_write",
      },
    ],
  });

  dbConnectionUri = neonBranch.connectionUris[0].connection_uri;

  console.log(`${stageType} branch ready`);
  console.log(`Branch name: ${neonBranch.name}`);
}

export { dbConnectionUri };

/* *
* Better Auth Secrets
*/

const betterAuthUrl = alchemy.secret(process.env.BETTER_AUTH_URL);
const betterAuthSecret = alchemy.secret(process.env.BETTER_AUTH_SECRET);

/* *
* User Application Config
*/
if (stageType !== "TEST") {
  const userApplication = await TanStackStart("app", {
    bindings: {
      BETTER_AUTH_URL: betterAuthUrl,
      BETTER_AUTH_SECRET: betterAuthSecret,
      DB_CONNECTION_URI: dbConnectionUri,
    },
  });

  console.log({
    url: userApplication.url,
  });

  if (stageType === "PULL_REQUEST") {
    await GitHubComment("preview-comment", {
      owner: "StephenODea54",
      repository: "from-juice",
      issueNumber: Number(process.env.PULL_REQUEST),
      body: `## 🍊 Deployment Preview

Your changes have been deployed to a preview environment:

**🌐 URL:** ${userApplication.url}

Built from commit \`${process.env.GITHUB_SHA?.slice(0, 7)}\`

---
<sub>This comment updates automatically with each push.</sub>`,
    });
  }
}

if (stageType !== "TEST") {
  await app.finalize();
}
