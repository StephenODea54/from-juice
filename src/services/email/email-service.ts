import { Context, Data, Effect, Layer } from "effect";
import postmark from "postmark";
import { BindingsService } from "@/services/bindings/bindings-service";

class EmailError extends Data.TaggedError("EmailError")<{
  message?: string;
  readonly cause: unknown;
}> {};

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    readonly sendEmail: (toAddress: string, subject: string, body: string) => Effect.Effect<postmark.Models.MessageSendingResponse, EmailError>;
  }
>() {};

export const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const { postmarkApiKey } = yield* BindingsService;
    const serverClient = new postmark.ServerClient(postmarkApiKey);

    return {
      sendEmail: (toAddress: string, subject: string, body: string) =>
        Effect.tryPromise({
          try: () => serverClient.sendEmail({
            To: toAddress,
            From: "no-reply@from-juice.com",
            Subject: subject,
            TextBody: body,
          }),
          catch: cause => new EmailError({ message: "Unable to send email", cause }),
        }),
    };
  }),
);
