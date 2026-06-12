import { createAuthClient } from "better-auth/react";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { organization as organizationPlugin } from "better-auth/plugins/organization";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
  plugins: [adminPlugin(), organizationPlugin()],
});
