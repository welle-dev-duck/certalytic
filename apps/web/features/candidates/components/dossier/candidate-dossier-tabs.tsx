"use client";

import {
  AlertCircle,
  BarChart2,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  Globe,
  Mic,
  Rss,
  Scissors,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { SupplementaryAnalysisPanel } from "@/features/candidates/components/supplementary-analysis-panel";
import { DecisionSupportDisclaimer } from "@/features/candidates/components/dossier/decision-support-disclaimer";
import { DossierPanel } from "@/features/candidates/components/dossier/panel";
import { InfoRow } from "@/features/candidates/components/dossier/info-row";
import { MetricBar } from "@/features/candidates/components/dossier/metric-bar";
import type { CandidateDetail, CandidateReport } from "@/features/candidates/types";
import { cn } from "@/lib/utils";

const TABS = [
  "CV Analysis",
  "Platform Cross-Ref",
  "Behaviour Analysis",
  "Personality Analysis",
  "Interview Analysis",
  "Signal Summary",
] as const;

type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  "CV Analysis": <FileText size={13} />,
  "Platform Cross-Ref": <Globe size={13} />,
  "Interview Analysis": <Mic size={13} />,
  "Behaviour Analysis": <Users size={13} />,
  "Personality Analysis": <Sparkles size={13} />,
  "Signal Summary": <BarChart2 size={13} />,
};

export function CandidateDossierTabs({
  candidate,
  report,
}: {
  candidate: CandidateDetail;
  report: CandidateReport;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Signal Summary");

  return (
    <>

      <div>
        <div className="flex gap-0 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {TAB_ICONS[tab]}
              {tab}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === "CV Analysis" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <DossierPanel title="AI Text Detection Analysis">
                  <div className="space-y-4">
                    <MetricBar
                      label="Overall AI-generated text probability"
                      value={report.aiTextPercent}
                      invert
                    />
                    <MetricBar
                      label="Executive summary authenticity"
                      value={report.subScores.s_cv}
                    />
                    <MetricBar
                      label="Work experience narrative"
                      value={Math.max(0, report.subScores.s_cv - 6)}
                    />
                    <MetricBar
                      label="Skills section authenticity"
                      value={Math.min(100, report.subScores.s_cv + 8)}
                    />
                  </div>
                  <div className="mt-4 rounded bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    <span className="text-[10px] font-bold text-chart-2">
                      PARSER OUTPUT
                    </span>
                    <span className="text-[10px]"> → certalytic-nlp-classifier</span>
                    <br />
                    {report.componentSummaries.s_cv ||
                      "CV authorship analysis pending."}
                    {report.componentIndicators.s_cv.length > 0 && (
                      <>
                        <br />
                        <br />
                        {report.componentIndicators.s_cv.map((indicator) => (
                          <span key={indicator}>
                            • {indicator}
                            <br />
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </DossierPanel>
              </div>
              <div className="space-y-4">
                <DossierPanel title="CV Metrics">
                  <InfoRow
                    label="AI Text Probability"
                    value={`${report.aiTextPercent}%`}
                    mono
                  />
                  <InfoRow
                    label="CV Authorship Score"
                    value={report.subScores.s_cv}
                    mono
                  />
                  <InfoRow
                    label="Formatting Origin"
                    value={
                      report.aiTextPercent > 40 ? "Template (AI)" : "Manual"
                    }
                  />
                  <InfoRow
                    label="Language Model Match"
                    value={
                      report.aiTextPercent > 40
                        ? "GPT-class / Claude"
                        : "None"
                    }
                  />
                </DossierPanel>
                <DossierPanel title="Risk Vectors">
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart
                      data={report.riskVectors}
                      layout="vertical"
                      margin={{ left: 0, right: 10 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        width={65}
                      />
                      <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                        {report.riskVectors.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.value > 60
                                ? "#EF4444"
                                : entry.value > 30
                                  ? "#F59E0B"
                                  : "#10B981"
                            }
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </DossierPanel>
              </div>
            </div>
          )}

          {activeTab === "Platform Cross-Ref" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <DossierPanel title="Platform Consistency Matrix">
                  <div className="space-y-4">
                    <MetricBar
                      label="LinkedIn ↔ CV employment match"
                      value={report.platformMatrix.linkedin_cv_match.score}
                      explanation={
                        report.platformMatrix.linkedin_cv_match.explanation
                      }
                    />
                    <MetricBar
                      label="GitHub activity ↔ claimed experience"
                      value={report.platformMatrix.github_experience_match.score}
                      explanation={
                        report.platformMatrix.github_experience_match.explanation
                      }
                    />
                    <MetricBar
                      label="Cross-platform name/date consistency"
                      value={
                        report.platformMatrix.cross_platform_consistency.score
                      }
                      explanation={
                        report.platformMatrix.cross_platform_consistency
                          .explanation
                      }
                    />
                  </div>
                  {report.componentSummaries.s_cross && (
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                      {report.componentSummaries.s_cross}
                    </p>
                  )}
                </DossierPanel>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DossierPanel
                    title="LinkedIn Analysis"
                    icon={<Rss size={14} className="text-primary" />}
                  >
                    {report.linkedin.provided ? (
                      <>
                        <InfoRow label="Profile" value="Provided" />
                        <InfoRow
                          label="CV Consistency"
                          value={
                            report.platformConsistency !== null
                              ? `${report.platformConsistency}%`
                              : "Not evaluated"
                          }
                          mono
                        />
                        {candidate.linkedinUrl && (
                          <a
                            href={candidate.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block truncate text-[11px] text-primary hover:underline"
                          >
                            {candidate.linkedinUrl}
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="py-2 text-xs text-muted-foreground">
                        No LinkedIn profile provided for cross-ref.
                      </p>
                    )}
                    <div className="mt-3">
                      <PlatformStatusBadge analysis={report.linkedin} />
                    </div>
                  </DossierPanel>
                  <DossierPanel
                    title="GitHub Analysis"
                    icon={<Code2 size={14} />}
                  >
                    {report.github.provided ? (
                      <>
                        <InfoRow
                          label="Username"
                          value={report.github.handle ?? "—"}
                          mono
                        />
                        <InfoRow
                          label="Activity ↔ Experience"
                          value={
                            report.subScores.s_cross !== null
                              ? `${report.subScores.s_cross}%`
                              : "Not evaluated"
                          }
                          mono
                        />
                        {report.github.handle && (
                          <a
                            href={`https://github.com/${report.github.handle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block truncate text-[11px] text-primary hover:underline"
                          >
                            github.com/{report.github.handle}
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="py-2 text-xs text-muted-foreground">
                        No GitHub username provided for cross-ref.
                      </p>
                    )}
                    <div className="mt-3">
                      <PlatformStatusBadge analysis={report.github} />
                    </div>
                  </DossierPanel>
                </div>
              </div>
              <DossierPanel title="Platform Summary">
                <InfoRow
                  label="Overall Consistency"
                  value={
                    report.platformConsistency !== null
                      ? `${report.platformConsistency}%`
                      : "Not evaluated"
                  }
                  mono
                />
                <InfoRow
                  label="Sources Cross-Checked"
                  value={
                    (report.linkedin.provided ? 1 : 0) +
                    (report.github.provided ? 1 : 0)
                  }
                  mono
                />
                <InfoRow
                  label="LinkedIn"
                  value={report.linkedin.provided ? "Checked" : "Not provided"}
                />
                <InfoRow
                  label="GitHub"
                  value={report.github.provided ? "Checked" : "Not provided"}
                />
              </DossierPanel>
            </div>
          )}

          {activeTab === "Behaviour Analysis" && (
            <SupplementaryAnalysisPanel
              title="Candidate behaviour analysis"
              analysis={report.behaviourAnalysis}
              indicatorLabel="Collaboration indicators"
            />
          )}

          {activeTab === "Personality Analysis" && (
            <SupplementaryAnalysisPanel
              title="Candidate personality analysis"
              analysis={report.personalityAnalysis}
              indicatorLabel="Culture fit indicators"
              showMotivation
            />
          )}

          {activeTab === "Interview Analysis" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {report.rounds.length === 0 ? (
                  <DossierPanel title="Interview Insights">
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No interview transcript recorded for this candidate.
                    </p>
                  </DossierPanel>
                ) : (
                  report.rounds.map((round) => (
                    <DossierPanel
                      key={round.roundNumber}
                      title={`Round ${round.roundNumber} - What the analysis noticed`}
                      icon={<Mic size={14} className="text-primary" />}
                    >
                      <div className="mb-3 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Interview
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.sInt ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Identity
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.sId ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Variance Δ
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.varianceDelta ?? "—"}
                          </p>
                        </div>
                      </div>
                      {round.wasTruncated && (
                        <span className="mb-2 inline-flex items-center gap-1 rounded bg-amber-500/12 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                          <Scissors size={9} />
                          TRUNCATED
                        </span>
                      )}
                      <ul className="space-y-1.5">
                        {round.observations.map((obs, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                          >
                            <span className="text-primary">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                      {round.deepDivePrompts.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                          <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                            SUGGESTED DEEP-DIVE PROMPTS
                          </p>
                          {round.deepDivePrompts.map((prompt, index) => (
                            <p
                              key={index}
                              className="text-xs leading-relaxed text-muted-foreground"
                            >
                              {prompt}
                            </p>
                          ))}
                        </div>
                      )}
                    </DossierPanel>
                  ))
                )}
              </div>
              <DossierPanel title="Interview Metrics">
                <InfoRow
                  label="Rounds Recorded"
                  value={report.rounds.length}
                  mono
                />
                <InfoRow
                  label="Truncated Rounds"
                  value={report.rounds.filter((r) => r.wasTruncated).length}
                  mono
                />
                <InfoRow
                  label="Confidence Variance"
                  value={`${report.interviewVariance}%`}
                  mono
                />
                <InfoRow
                  label="Prompt Injection Risk"
                  value={report.interviewVariance > 40 ? "Elevated" : "Low"}
                />
              </DossierPanel>
            </div>
          )}

          {activeTab === "Signal Summary" && (
            <div className="space-y-4">
              <DecisionSupportDisclaimer className="max-w-xl" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DossierPanel
                  title="Certalytic Intelligence Summary"
                  icon={<Brain size={14} className="text-chart-2" />}
                >
                  <div className="rounded bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    <p
                      className="text-xs font-bold"
                      style={{
                        color:
                          report.level === "high"
                            ? "#10B981"
                            : report.level === "medium"
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {report.verdict.title}
                    </p>
                    <p className="mt-2">{report.verdict.body}</p>
                  </div>
                </DossierPanel>
                <div className="space-y-4">
                  <DossierPanel title="Signal Vector Scores">
                    <div className="space-y-3">
                      {report.radar.map(({ subject, value }) => (
                        <MetricBar key={subject} label={subject} value={value} />
                      ))}
                    </div>
                  </DossierPanel>
                  <DossierPanel title="Suggested Follow-ups">
                    <div className="space-y-2">
                      {report.recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2">
                          {report.level === "high" ? (
                            <CheckCircle2
                              size={12}
                              className="mt-0.5 shrink-0 text-emerald-500"
                            />
                          ) : report.level === "medium" ? (
                            <AlertCircle
                              size={12}
                              className="mt-0.5 shrink-0 text-amber-500"
                            />
                          ) : (
                            <XCircle
                              size={12}
                              className="mt-0.5 shrink-0 text-destructive"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </DossierPanel>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PlatformStatusBadge({
  analysis,
}: {
  analysis: CandidateReport["linkedin"];
}) {
  const authentic = analysis.status === "authentic";
  return (
    <span
      className="rounded px-2 py-1 text-[10px] font-bold"
      style={{
        background: authentic ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
        color: authentic ? "#10B981" : "#EF4444",
      }}
    >
      {analysis.statusLabel}
    </span>
  );
}
