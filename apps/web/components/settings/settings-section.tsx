import type { ReactNode } from "react";

type SettingsSectionProps = {
  label: string;
  children: ReactNode;
};

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}
