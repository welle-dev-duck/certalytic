export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  language?: string | null;
  createdAt?: Date;
  logo?: string | null;
};

export type OrganizationMember = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type OrganizationInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organizationId: string;
};
