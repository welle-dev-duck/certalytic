import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import { COMPANY } from "@/lib/company";

export function AppLogo() {
  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-sidebar-primary shadow-sm">
        <AppLogoIcon className="size-[18px] text-sidebar-primary-foreground" />
      </div>
      <div className="ml-2 grid flex-1 text-left leading-none">
        <span className="font-display truncate text-sm font-semibold tracking-tight">
          {COMPANY.name}
        </span>
        <span className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Integrity screening
        </span>
      </div>
    </>
  );
}
