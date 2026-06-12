"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";

export function AuthTopBar() {
  const pathname = usePathname();
  const isSignUp = pathname?.includes("/sign-up");
  const isSignIn = pathname?.includes("/sign-in");

  if (isSignUp) {
    return (
      <p className="text-sm text-muted-foreground">
        Already have an account?
        <Link
          href="/auth/sign-in"
          className="font-semibold text-[#1264A3] hover:underline"
        >
          Sign in
        </Link>
      </p>
    );
  }

  if (isSignIn) {
    return (
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?
        <Link
          href="/auth/sign-up"
          className="font-semibold text-[#1264A3] hover:underline"
        >
          Sign up
        </Link>
      </p>
    );
  }

  return null;
}
