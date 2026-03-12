import type { userApplication } from "../alchemy.run";

export type UserApplicationEnv = typeof userApplication.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends UserApplicationEnv {}
  }
}
