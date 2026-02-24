declare module "vitest" {
  export interface ProvidedContext {
    dbConnectionUri: string;
  }
}

export {};
