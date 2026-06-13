import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
  plugins: [
    adminClient(),
    organizationClient({
      schema: {
        organization: {
          additionalFields: {
            country: {
              type: "string",
            },
            language: {
              type: "string",
            },
          },
        },
      },
    }),
    stripeClient({ subscription: true }),
  ],
});
