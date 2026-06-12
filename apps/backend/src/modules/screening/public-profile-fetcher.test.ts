import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpPublicProfileFetcher } from './public-profile-fetcher';

describe('HttpPublicProfileFetcher', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches github profile text from the public api', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          login: 'octocat',
          name: 'The Octocat',
          bio: 'GitHub mascot',
          company: '@github',
          location: 'San Francisco',
          public_repos: 8,
          followers: 9000,
          created_at: '2011-01-25T18:44:36Z',
        }),
      }),
    );

    const result = await new HttpPublicProfileFetcher().fetch(null, 'octocat');

    expect(result.github_text).toContain('octocat');
    expect(result.github_text).toContain('The Octocat');
    expect(result.linkedin_text).toBeNull();
  });

  it('returns null for linkedin without fabricating profile text', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await new HttpPublicProfileFetcher().fetch(
      'https://linkedin.com/in/jane-doe',
      null,
    );

    expect(result.linkedin_text).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
