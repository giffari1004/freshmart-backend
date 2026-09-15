import { z } from "zod";

export class SocialLoginValidation {
  static readonly OAUTH_REDIRECT = z.object({
    query: z.object({
      ref: z.string().trim().optional(),
    }),
  });

  static readonly OAUTH_CALLBACK = z.object({
    query: z.object({
      code: z.string().min(1, "Authorization code is required"),
      state: z.string().min(1, "OAuth state is required"),
    }),
  });
}

export type oauthRedirectSchema = z.infer<
  typeof SocialLoginValidation.OAUTH_REDIRECT
>;
export type oauthCallbackSchema = z.infer<
  typeof SocialLoginValidation.OAUTH_CALLBACK
>;
