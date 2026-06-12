const PLAN_FEATURES = {
  free: { crossSource: false, crossSourceManual: false },
  starter: { crossSource: false, crossSourceManual: true },
  growth: { crossSource: true, crossSourceManual: true },
  scale: { crossSource: true, crossSourceManual: true },
  enterprise: { crossSource: true, crossSourceManual: true },
} as const;

export function getPlanFeatures(plan: string | undefined) {
  const key = plan?.toLowerCase() as keyof typeof PLAN_FEATURES;
  return PLAN_FEATURES[key] ?? PLAN_FEATURES.free;
}
