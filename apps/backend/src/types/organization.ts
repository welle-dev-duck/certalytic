export const ORG_MEMBER_ROLE = 'member';
export const ORG_ADMIN_ROLE = 'admin';
export const ORG_OWNER_ROLE = 'owner';

export const ORG_ROLES = [
  ORG_MEMBER_ROLE,
  ORG_ADMIN_ROLE,
  ORG_OWNER_ROLE,
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
};
