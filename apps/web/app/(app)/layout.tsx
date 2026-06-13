import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/app-layout";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
