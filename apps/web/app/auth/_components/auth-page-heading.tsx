"use client";

type Props = {
  title: string;
  description?: string;
};

/** Slack-style centered auth headings */
export function AuthPageHeading({ title, description }: Props) {
  return (
    <header className="mb-8 space-y-2 text-center">
      <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight sm:text-[2rem] text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="text-base font-normal leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
