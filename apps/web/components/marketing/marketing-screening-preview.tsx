"use client";

import { AlertCircle } from "lucide-react";

import { IntegrityRadarChart } from "@/components/certalytic/integrity-radar-chart";
import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  FlagBadge,
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { DecisionSupportDisclaimer } from "@/features/candidates/components/dossier/decision-support-disclaimer";
import { marketingMockReport } from "@/lib/marketing-mock-report";

const componentLabels = {
  s_cv: "CV authenticity",
  s_int: "Interview behavioral",
  s_cross: "Cross-source consistency",
  s_id: "Identity confidence",
} as const;

function MetricRow({
  label,
  value,
  summary,
}: {
  label: string;
  value: number;
  summary: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-bold text-foreground">
          {value}/100
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{summary}</p>
    </div>
  );
}

export function MarketingScreeningPreview() {
  const report = marketingMockReport;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/20 px-5 py-4">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          Sample integrity dossier
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mocked candidate data — identical UI and PDF export to production.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <DecisionSupportDisclaimer variant="subtle" />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center">
                <ScoreRing
                  score={report.score}
                  size={120}
                  strokeWidth={8}
                  labelSize="lg"
                />
                <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-muted-foreground">
                  HIRING INTEGRITY
                  <br />
                  SCORE
                </p>
                <div className="mt-3">
                  <IntegrityBadge level={report.level} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Alex Müller
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Senior Backend Engineer
                    </p>
                  </div>
                  <StatusBadge status="complete" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded bg-muted p-2.5">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Flags raised
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {report.flags.length}
                    </p>
                  </div>
                  <div className="rounded bg-muted p-2.5">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Interview rounds
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {report.rounds.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-5">
            <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground">
              SIGNAL PROFILE
            </p>
            <IntegrityRadarChart data={report.radar} height={220} />
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={14} style={{ color: "#EF4444" }} />
            <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>
              {report.flags.length} active flags detected
            </p>
          </div>
          <div className="space-y-2">
            {report.flags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded bg-muted/50 p-2.5 dark:bg-black/20"
              >
                <FlagBadge flag={flag} />
                <p className="flex-1 text-xs text-foreground">
                  {flag.description}
                </p>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                  style={{
                    background:
                      "color-mix(in oklch, var(--chart-2) 15%, transparent)",
                    color: "var(--c-violet)",
                  }}
                >
                  {Math.round(flag.confidence * 100)}% conf.
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-5">
            <h4 className="text-sm font-semibold text-foreground">
              Metric analysis
            </h4>
            <div className="mt-4 space-y-4">
              {(Object.keys(componentLabels) as Array<keyof typeof componentLabels>).map(
                (key) => {
                  const value = report.subScores[key];
                  if (value === null) return null;

                  return (
                    <MetricRow
                      key={key}
                      label={componentLabels[key]}
                      value={value}
                      summary={report.componentSummaries[key]}
                    />
                  );
                },
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-5">
              <h4 className="text-sm font-semibold text-foreground">
                Behaviour & personality insights
              </h4>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Supplementary context only — excluded from the integrity score.
              </p>
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">
                    Behaviour:
                  </span>{" "}
                  {report.behaviourAnalysis.summary}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Personality:
                  </span>{" "}
                  {report.personalityAnalysis.summary}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-5">
              <h4 className="text-sm font-semibold text-foreground">
                AI verdict
              </h4>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {report.verdict.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {report.verdict.body}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-5">
              <h4 className="text-sm font-semibold text-foreground">
                Recommended follow-ups
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                {report.recommendedActions.map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
