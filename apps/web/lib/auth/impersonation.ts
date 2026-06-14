const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Better Auth Dash uses its own admin ids; in-app admin impersonation uses local UUIDs. */
export function isDashImpersonation(impersonatedBy: string): boolean {
  return !UUID_PATTERN.test(impersonatedBy);
}
