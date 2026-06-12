import type { ReactNode } from "react";

type AuthPageHeadingProps = {
  title: string;
  description?: ReactNode;
};

export function AuthPageHeading({ title, description }: AuthPageHeadingProps) {
  return (
    <header className="mb-8 space-y-2">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
