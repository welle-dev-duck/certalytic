export const routes = {
  home: () => "/",
  signIn: () => "/auth/sign-in",
  signUp: () => "/auth/sign-up",
  verifyEmail: () => "/auth/verify-email",
  forgotPassword: () => "/auth/forgot-password",
  resetPassword: () => "/auth/reset-password",
  dashboard: () => "/dashboard",
  candidates: () => "/candidates",
  candidate: (id: string) => `/candidates/${id}`,
  roles: () => "/roles",
  role: (id: string) => `/roles/${id}`,
  billing: () => "/billing",
  settingsProfile: () => "/settings/profile",
  settingsSecurity: () => "/settings/security",
  settingsAppearance: () => "/settings/appearance",
  settingsLanguage: () => "/settings/language",
  settingsOrganization: () => "/settings/organization",
  invitation: (id?: string) =>
    id ? `/invitation?id=${encodeURIComponent(id)}` : "/invitation",
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
