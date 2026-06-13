"use client";

import {
  Briefcase,
  FileText,
  Fingerprint,
  Globe2,
  Layers,
  Mic,
  Scale,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useTranslations } from "@/lib/i18n/client";

type SignalConfig = {
  id: "cv" | "interview" | "crossSource" | "identity";
  icon: LucideIcon;
  weight: string;
};

type FeatureConfig = {
  id:
    | "compositeScore"
    | "speakerTranscripts"
    | "roleProfiles"
    | "teamWorkspaces"
    | "signalSummary"
    | "behaviourAnalysis"
    | "personalityAnalysis";
  icon: LucideIcon;
};

const signals: SignalConfig[] = [
  { id: "cv", icon: FileText, weight: "25%" },
  { id: "interview", icon: Mic, weight: "50%" },
  { id: "crossSource", icon: Globe2, weight: "15%" },
  { id: "identity", icon: Fingerprint, weight: "10%" },
];

const features: FeatureConfig[] = [
  { id: "compositeScore", icon: Scale },
  { id: "speakerTranscripts", icon: Mic },
  { id: "roleProfiles", icon: Briefcase },
  { id: "teamWorkspaces", icon: Users },
  { id: "signalSummary", icon: Layers },
  { id: "behaviourAnalysis", icon: Users },
  { id: "personalityAnalysis", icon: Sparkles },
];

export function MarketingFeaturesBento() {
  const t = useTranslations("marketing");

  return (
    <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-3 md:grid-cols-12">
      <div className="border border-border bg-card p-6 md:col-span-7 md:row-span-2">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          {t("featuresBento.signalsEyebrow")}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-foreground">
          {t("featuresBento.signalsTitle")}
        </h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("featuresBento.signalsDescription")}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="border border-border bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <signal.icon size={16} className="shrink-0 text-primary" />
                <span className="font-mono text-xs text-primary">
                  {signal.weight}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {t(`featuresBento.signals.${signal.id}.title`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(`featuresBento.signals.${signal.id}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {features.slice(0, 2).map((feature, index) => (
        <div
          key={feature.id}
          className={`border border-border p-6 md:col-span-5 ${index === 0 ? "bg-primary/5" : "bg-card"}`}
        >
          <feature.icon size={18} className="text-primary" />
          <h3 className="mt-4 font-semibold text-foreground">
            {t(`featuresBento.features.${feature.id}.title`)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(`featuresBento.features.${feature.id}.description`)}
          </p>
        </div>
      ))}

      {features.slice(2).map((feature) => (
        <div
          key={feature.id}
          className="border border-border bg-card p-6 md:col-span-4"
        >
          <feature.icon size={18} className="text-primary" />
          <h3 className="mt-4 font-semibold text-foreground">
            {t(`featuresBento.features.${feature.id}.title`)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(`featuresBento.features.${feature.id}.description`)}
          </p>
        </div>
      ))}
    </div>
  );
}
