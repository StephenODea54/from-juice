import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  process.env.STAGE = `test-${process.env.USER}`;

  const {
    app,
    betterAuthSecret,
    betterAuthUrl,
    dbConnectionUri,
    googleClientId,
    googleClientSecret,
    postmarkApiKey,
  } = await import("./alchemy.run.ts");

  provide("betterAuthSecret", betterAuthSecret.unencrypted);
  provide("betterAuthUrl", betterAuthUrl.unencrypted);
  provide("dbConnectionUri", dbConnectionUri.unencrypted);
  provide("googleClientId", googleClientId.unencrypted);
  provide("googleClientSecret", googleClientSecret.unencrypted);
  provide("postmarkApiKey", postmarkApiKey.unencrypted);

  return async () => {
    await app.cleanup();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    betterAuthSecret: string;
    betterAuthUrl: string;
    dbConnectionUri: string;
    googleClientId: string;
    googleClientSecret: string;
    postmarkApiKey: string;
  }
}

export {};
