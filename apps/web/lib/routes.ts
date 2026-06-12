export const routes = {
  home: () => "/",
  signIn: () => "/auth/sign-in",
  signUp: () => "/auth/sign-up",
  verifyEmail: () => "/auth/verify-email",
  forgotPassword: () => "/auth/forgot-password",
  resetPassword: () => "/auth/reset-password",
  twoFactor: () => "/auth/two-factor",
  confirmPassword: () => "/auth/confirm-password",
  dashboard: () => "/dashboard",
  candidates: () => "/candidates",
  candidateCreate: () => "/candidates/create",
  candidateImport: () => "/candidates/import",
  candidate: (id: string) => `/candidates/${id}`,
  roles: () => "/roles",
  role: (id: string) => `/roles/${id}`,
  billing: () => "/billing",
  settingsProfile: () => "/settings/profile",
  settingsSecurity: () => "/settings/security",
  settingsAppearance: () => "/settings/appearance",
  settingsOrganization: () => "/settings/organization",
  invitation: (id?: string) =>
    id ? `/invitation?id=${encodeURIComponent(id)}` : "/invitation",
  settingsTeams: () => "/settings/teams",
  settingsTeam: (teamId: string) => `/settings/teams/${teamId}`,
  legal: {
    privacy: () => "/legal/privacy",
    terms: () => "/legal/terms",
    dpa: () => "/legal/dpa",
    cookies: () => "/legal/cookies",
    imprint: () => "/legal/imprint",
  },
} as const;

export type BreadcrumbItem = {
  title: string;
  href: string;
};
