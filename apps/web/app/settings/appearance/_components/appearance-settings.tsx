"use client";

import { AppearanceToggle } from "@/components/settings/appearance-toggle";

export function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Appearance</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update the appearance settings for your account
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">Theme</p>
        <AppearanceToggle />
      </div>
    </div>
  );
}
