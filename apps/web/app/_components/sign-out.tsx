"use client";

import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/providers/auth-provider";

export function SignOut() {
  const auth = useAuth();
  console.log(auth.session)
  return <button onClick={() => authClient.signOut()}>Sign out</button>;
}
