export const testUser = {
  id: '01932f5a-7b2a-7000-8000-000000000001',
  email: 'user@example.com',
  name: 'Test User',
};

export const testOrganization = {
  id: '01932f5a-7b2a-7000-8000-000000000002',
  name: 'Acme Inc',
};

export const testInvitation = {
  id: '01932f5a-7b2a-7000-8000-000000000003',
};

export const resetPasswordJob = {
  type: 'reset-password' as const,
  user: testUser,
  url: 'https://app.example.com/reset?token=abc',
};

export const verificationJob = {
  type: 'verification' as const,
  user: testUser,
  url: 'https://app.example.com/verify?token=abc',
};

export const invitationJob = {
  type: 'invitation' as const,
  email: 'invitee@example.com',
  organization: testOrganization,
  inviter: testUser,
  invitation: testInvitation,
};
