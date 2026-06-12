import { logger } from '../../lib/logger';

export type FetchedPublicProfileText = {
  linkedin_text: string | null;
  github_text: string | null;
};

export interface PublicProfileFetcher {
  fetch(
    linkedinUrl: string | null | undefined,
    githubUsername: string | null | undefined,
  ): Promise<FetchedPublicProfileText>;
}

export class HttpPublicProfileFetcher implements PublicProfileFetcher {
  async fetch(
    linkedinUrl: string | null | undefined,
    githubUsername: string | null | undefined,
  ): Promise<FetchedPublicProfileText> {
    return {
      linkedin_text: this.fetchLinkedIn(linkedinUrl),
      github_text: await this.fetchGitHub(githubUsername),
    };
  }

  private fetchLinkedIn(linkedinUrl: string | null | undefined): string | null {
    if (typeof linkedinUrl !== 'string' || linkedinUrl.trim() === '') {
      return null;
    }

    logger.info(
      { linkedinUrl },
      'LinkedIn profile text could not be fetched automatically; URL will be passed to evaluation',
    );

    return null;
  }

  private async fetchGitHub(
    githubUsername: string | null | undefined,
  ): Promise<string | null> {
    if (typeof githubUsername !== 'string' || githubUsername.trim() === '') {
      return null;
    }

    const username = githubUsername.trim();

    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Certalytic',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        logger.warn(
          { githubUsername: username, status: response.status },
          'GitHub profile fetch failed',
        );

        return null;
      }

      const profile = (await response.json()) as Record<string, unknown>;

      return this.formatGitHubProfile(username, profile);
    } catch (error) {
      logger.warn(
        {
          err: error,
          githubUsername: username,
        },
        'GitHub profile fetch request failed',
      );

      return null;
    }
  }

  private formatGitHubProfile(
    username: string,
    profile: Record<string, unknown>,
  ): string {
    const name =
      typeof profile.name === 'string' && profile.name !== ''
        ? profile.name
        : username;
    const bio =
      typeof profile.bio === 'string' && profile.bio !== ''
        ? profile.bio
        : 'No bio provided.';
    const publicRepos =
      typeof profile.public_repos === 'number' ? profile.public_repos : 0;
    const followers =
      typeof profile.followers === 'number' ? profile.followers : 0;
    const company =
      typeof profile.company === 'string' && profile.company !== ''
        ? profile.company
        : 'Not listed';
    const location =
      typeof profile.location === 'string' && profile.location !== ''
        ? profile.location
        : 'Not listed';
    const createdAt =
      typeof profile.created_at === 'string' ? profile.created_at : 'unknown';

    return [
      `GitHub user: ${username}`,
      `Display name: ${name}`,
      `Bio: ${bio}`,
      `Company: ${company}`,
      `Location: ${location}`,
      `Public repositories: ${publicRepos}`,
      `Followers: ${followers}`,
      `Account created: ${createdAt}`,
    ].join('\n');
  }
}
