"use client";

import { AppearanceToggle } from "@/components/settings/appearance-toggle";

export function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update the appearance settings for your account
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Theme</p>
        <AppearanceToggle />
      </div>
    </div>
  );
}
