import { Config, ConfigProvider, Layer } from "effect";
import { inject } from "vitest";
// import { userApplication } from "../../../alchemy.run";

export const AppConfig = Config.all({
  betterAuthUrl: Config.string("BETTER_AUTH_URL"),
  betterAuthSecret: Config.redacted("BETTER_AUTH_SECRET"),
  dbConnectionUri: Config.redacted("DB_CONNECTION_URI"),
  googleClientId: Config.string("GOOGLE_CLIENT_ID"),
  googleClientSecret: Config.redacted("GOOGLE_CLIENT_SECRET"),
});

// const AppConfigProdProvider = ConfigProvider.fromMap(
//   new Map(Object.entries({
//     BETTER_AUTH_URL: userApplication.Env.BETTER_AUTH_URL,
//     BETTER_AUTH_SECRET: userApplication.Env.BETTER_AUTH_SECRET,
//     DB_CONNECTION_URI: userApplication.Env.DB_CONNECTION_URI,
//     GOOGLE_CLIENT_ID: userApplication.Env.GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET: userApplication.Env.GOOGLE_CLIENT_SECRET,
//   })),
// );

const AppConfigTestProvider = ConfigProvider.fromMap(
  new Map(Object.entries({
    BETTER_AUTH_URL: inject("betterAuthUrl"),
    BETTER_AUTH_SECRET: inject("betterAuthSecret"),
    DB_CONNECTION_URI: inject("dbConnectionUri"),
    GOOGLE_CLIENT_ID: inject("googleClientId"),
    GOOGLE_CLIENT_SECRET: inject("googleClientSecret"),
  })),
);

// export const AppConfigProdLayer = Layer.setConfigProvider(AppConfigProdProvider);
export const AppConfigTestLayer = Layer.setConfigProvider(AppConfigTestProvider);
