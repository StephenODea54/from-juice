/// <reference types="vitest" />

import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  process.env.STAGE = `test-${process.env.USER}`;

  const { app, dbConnectionUri } = await import("./alchemy.run.ts");

  provide("dbConnectionUri", dbConnectionUri.unencrypted);

  return async () => {
    await app.cleanup();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    dbConnectionUri: string;
  }
}
