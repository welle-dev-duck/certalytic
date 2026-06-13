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
import { useMemo, useState } from "react";
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
import { useTranslations } from "@/lib/i18n/client";
import {
  getAuthenticityStyle,
  getIntegrityColor,
  getRiskVectorColor,
} from "@/lib/integrity";
import { cn } from "@/lib/utils";

const TAB_IDS = [
  "cvAnalysis",
  "platformCrossRef",
  "behaviourAnalysis",
  "personalityAnalysis",
  "interviewAnalysis",
  "signalSummary",
] as const;

type TabId = (typeof TAB_IDS)[number];

const TAB_LABEL_KEYS: Record<TabId, string> = {
  cvAnalysis: "dossier.tabs.cvAnalysis",
  platformCrossRef: "dossier.tabs.platformCrossRef",
  behaviourAnalysis: "dossier.tabs.behaviourAnalysis",
  personalityAnalysis: "dossier.tabs.personalityAnalysis",
  interviewAnalysis: "dossier.tabs.interviewAnalysis",
  signalSummary: "dossier.tabs.signalSummary",
};

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  cvAnalysis: <FileText size={13} />,
  platformCrossRef: <Globe size={13} />,
  interviewAnalysis: <Mic size={13} />,
  behaviourAnalysis: <Users size={13} />,
  personalityAnalysis: <Sparkles size={13} />,
  signalSummary: <BarChart2 size={13} />,
};

export function CandidateDossierTabs({
  candidate,
  report,
}: {
  candidate: CandidateDetail;
  report: CandidateReport;
}) {
  const t = useTranslations("app");
  const [activeTab, setActiveTab] = useState<TabId>("signalSummary");
  const tabs = useMemo(
    () => TAB_IDS.map((id) => ({ id, label: t(TAB_LABEL_KEYS[id]) })),
    [t],
  );

  return (
    <>
      <div>
        <div className="flex gap-0 overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === "cvAnalysis" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <DossierPanel title={t("dossier.cvAnalysis.aiTextDetection")}>
                  <div className="space-y-4">
                    <MetricBar
                      label={t("dossier.cvAnalysis.overallAiProbability")}
                      value={report.aiTextPercent}
                      invert
                    />
                    <MetricBar
                      label={t("dossier.cvAnalysis.executiveSummaryAuthenticity")}
                      value={report.subScores.s_cv}
                    />
                    <MetricBar
                      label={t("dossier.cvAnalysis.workExperienceNarrative")}
                      value={Math.max(0, report.subScores.s_cv - 6)}
                    />
                    <MetricBar
                      label={t("dossier.cvAnalysis.skillsAuthenticity")}
                      value={Math.min(100, report.subScores.s_cv + 8)}
                    />
                  </div>
                  <div className="mt-4 rounded bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    <span className="text-[10px] font-bold text-chart-2">
                      {t("dossier.cvAnalysis.parserOutput")}
                    </span>
                    <span className="text-[10px]">
                      {" "}
                      → {t("dossier.cvAnalysis.parserTarget")}
                    </span>
                    <br />
                    {report.componentSummaries.s_cv ||
                      t("dossier.cvAnalysis.pending")}
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
                <DossierPanel title={t("dossier.cvAnalysis.metrics")}>
                  <InfoRow
                    label={t("dossier.cvAnalysis.aiTextProbability")}
                    value={`${report.aiTextPercent}%`}
                    mono
                  />
                  <InfoRow
                    label={t("dossier.cvAnalysis.cvAuthorshipScore")}
                    value={report.subScores.s_cv}
                    mono
                  />
                  <InfoRow
                    label={t("dossier.cvAnalysis.formattingOrigin")}
                    value={
                      report.aiTextPercent > 40
                        ? t("dossier.cvAnalysis.formattingTemplate")
                        : t("dossier.cvAnalysis.formattingManual")
                    }
                  />
                  <InfoRow
                    label={t("dossier.cvAnalysis.languageModelMatch")}
                    value={
                      report.aiTextPercent > 40
                        ? t("dossier.cvAnalysis.languageModelGpt")
                        : t("dossier.cvAnalysis.languageModelNone")
                    }
                  />
                </DossierPanel>
                <DossierPanel title={t("dossier.cvAnalysis.riskVectors")}>
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
                            fill={getRiskVectorColor(entry.value)}
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

          {activeTab === "platformCrossRef" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <DossierPanel title={t("dossier.platformCrossRef.consistencyMatrix")}>
                  <div className="space-y-4">
                    <MetricBar
                      label={t("dossier.platformCrossRef.linkedinCvMatch")}
                      value={report.platformMatrix.linkedin_cv_match.score}
                      explanation={
                        report.platformMatrix.linkedin_cv_match.explanation
                      }
                    />
                    <MetricBar
                      label={t("dossier.platformCrossRef.githubExperienceMatch")}
                      value={report.platformMatrix.github_experience_match.score}
                      explanation={
                        report.platformMatrix.github_experience_match.explanation
                      }
                    />
                    <MetricBar
                      label={t("dossier.platformCrossRef.crossPlatformConsistency")}
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
                    title={t("dossier.platformCrossRef.linkedinAnalysis")}
                    icon={<Rss size={14} className="text-primary" />}
                  >
                    {report.linkedin.provided ? (
                      <>
                        <InfoRow
                          label={t("dossier.platformCrossRef.profile")}
                          value={t("dossier.platformCrossRef.provided")}
                        />
                        <InfoRow
                          label={t("dossier.platformCrossRef.cvConsistency")}
                          value={
                            report.platformConsistency !== null
                              ? `${report.platformConsistency}%`
                              : t("dossier.platformCrossRef.notEvaluated")
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
                        {t("dossier.platformCrossRef.noLinkedin")}
                      </p>
                    )}
                    <div className="mt-3">
                      <PlatformStatusBadge analysis={report.linkedin} />
                    </div>
                  </DossierPanel>
                  <DossierPanel
                    title={t("dossier.platformCrossRef.githubAnalysis")}
                    icon={<Code2 size={14} />}
                  >
                    {report.github.provided ? (
                      <>
                        <InfoRow
                          label={t("dossier.platformCrossRef.username")}
                          value={report.github.handle ?? "-"}
                          mono
                        />
                        <InfoRow
                          label={t("dossier.platformCrossRef.githubExperienceMatch")}
                          value={
                            report.subScores.s_cross !== null
                              ? `${report.subScores.s_cross}%`
                              : t("dossier.platformCrossRef.notEvaluated")
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
                        {t("dossier.platformCrossRef.noGithub")}
                      </p>
                    )}
                    <div className="mt-3">
                      <PlatformStatusBadge analysis={report.github} />
                    </div>
                  </DossierPanel>
                </div>
              </div>
              <DossierPanel title={t("dossier.platformCrossRef.platformSummary")}>
                <InfoRow
                  label={t("dossier.platformCrossRef.overallConsistency")}
                  value={
                    report.platformConsistency !== null
                      ? `${report.platformConsistency}%`
                      : t("dossier.platformCrossRef.notEvaluated")
                  }
                  mono
                />
                <InfoRow
                  label={t("dossier.platformCrossRef.sourcesCrossChecked")}
                  value={
                    (report.linkedin.provided ? 1 : 0) +
                    (report.github.provided ? 1 : 0)
                  }
                  mono
                />
                <InfoRow
                  label={t("dossier.platformCrossRef.linkedin")}
                  value={
                    report.linkedin.provided
                      ? t("dossier.platformCrossRef.checked")
                      : t("dossier.platformCrossRef.notProvided")
                  }
                />
                <InfoRow
                  label={t("dossier.platformCrossRef.github")}
                  value={
                    report.github.provided
                      ? t("dossier.platformCrossRef.checked")
                      : t("dossier.platformCrossRef.notProvided")
                  }
                />
              </DossierPanel>
            </div>
          )}

          {activeTab === "behaviourAnalysis" && (
            <SupplementaryAnalysisPanel
              title={t("dossier.behaviourAnalysis.title")}
              analysis={report.behaviourAnalysis}
              indicatorLabel={t("dossier.behaviourAnalysis.indicatorLabel")}
            />
          )}

          {activeTab === "personalityAnalysis" && (
            <SupplementaryAnalysisPanel
              title={t("dossier.personalityAnalysis.title")}
              analysis={report.personalityAnalysis}
              indicatorLabel={t("dossier.personalityAnalysis.indicatorLabel")}
              showMotivation
            />
          )}

          {activeTab === "interviewAnalysis" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {report.rounds.length === 0 ? (
                  <DossierPanel title={t("dossier.interviewAnalysis.insights")}>
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t("dossier.interviewAnalysis.noTranscript")}
                    </p>
                  </DossierPanel>
                ) : (
                  report.rounds.map((round) => (
                    <DossierPanel
                      key={round.roundNumber}
                      title={t("dossier.interviewAnalysis.roundTitle", {
                        number: round.roundNumber,
                      })}
                      icon={<Mic size={14} className="text-primary" />}
                    >
                      <div className="mb-3 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {t("dossier.interviewAnalysis.interview")}
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.sInt ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {t("dossier.interviewAnalysis.identity")}
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.sId ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {t("dossier.interviewAnalysis.varianceDelta")}
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {round.varianceDelta ?? "-"}
                          </p>
                        </div>
                      </div>
                      {round.wasTruncated && (
                        <span className="mb-2 inline-flex items-center gap-1 rounded bg-amber-500/12 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                          <Scissors size={9} />
                          {t("dossier.interviewAnalysis.truncated")}
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
                            {t("dossier.interviewAnalysis.deepDivePrompts")}
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
              <DossierPanel title={t("dossier.interviewAnalysis.metrics")}>
                <InfoRow
                  label={t("dossier.interviewAnalysis.roundsRecorded")}
                  value={report.rounds.length}
                  mono
                />
                <InfoRow
                  label={t("dossier.interviewAnalysis.truncatedRounds")}
                  value={report.rounds.filter((r) => r.wasTruncated).length}
                  mono
                />
                <InfoRow
                  label={t("dossier.interviewAnalysis.confidenceVariance")}
                  value={`${report.interviewVariance}%`}
                  mono
                />
                <InfoRow
                  label={t("dossier.interviewAnalysis.promptInjectionRisk")}
                  value={
                    report.interviewVariance > 40
                      ? t("dossier.interviewAnalysis.riskElevated")
                      : t("dossier.interviewAnalysis.riskLow")
                  }
                />
              </DossierPanel>
            </div>
          )}

          {activeTab === "signalSummary" && (
            <div className="space-y-4">
              <DecisionSupportDisclaimer className="max-w-xl" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DossierPanel
                  title={t("dossier.signalSummary.intelligenceSummary")}
                  icon={<Brain size={14} className="text-chart-2" />}
                >
                  <div className="rounded bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    <p
                      className="text-xs font-bold"
                      style={{ color: getIntegrityColor(report.level) }}
                    >
                      {report.verdict.title}
                    </p>
                    <p className="mt-2">{report.verdict.body}</p>
                  </div>
                </DossierPanel>
                <div className="space-y-4">
                  <DossierPanel title={t("dossier.signalSummary.signalVectorScores")}>
                    <div className="space-y-3">
                      {report.radar.map(({ subject, value }) => (
                        <MetricBar key={subject} label={subject} value={value} />
                      ))}
                    </div>
                  </DossierPanel>
                  <DossierPanel title={t("dossier.signalSummary.suggestedFollowUps")}>
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
  const style = getAuthenticityStyle(authentic);
  return (
    <span
      className="rounded px-2 py-1 text-[10px] font-bold"
      style={style}
    >
      {analysis.statusLabel}
    </span>
  );
}
