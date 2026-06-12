import type { Auth } from './auth';

export type AuthInstance = Auth['instance'];

export type AuthSession = Awaited<
  ReturnType<AuthInstance['api']['getSession']>
>;
