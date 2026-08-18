import { z } from "zod";

export class SocialLoginValidation {
  static readonly OAUTH_CALLBACK = z.object({
    query: z.object({
      code: z.string().min(1, "Authorization code is required"),
    }),
  });
}

export type oauthCallbackSchema = z.infer<
  typeof SocialLoginValidation.OAUTH_CALLBACK
>;
