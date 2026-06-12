import { describe, expect, it } from 'vitest';

import type { CandidateReportDto } from '../candidates/candidates.dto';
import { PdfDocumentBuilder } from './pdf-document-builder';

const sampleReport: CandidateReportDto = {
  score: 72,
  level: 'medium',
  subScores: { s_cv: 68, s_int: 74, s_cross: 70, s_id: 65 },
  crossSourceEvaluated: true,
  componentSummaries: {
    s_cv: 'CV narrative shows moderate AI-generation patterns.',
    s_int: 'Interview responses were mostly consistent.',
    s_cross: 'LinkedIn dates align with CV employment history.',
    s_id: 'Identity provenance is acceptable.',
  },
  componentIndicators: {
    s_cv: ['Repeated phrasing in experience section'],
    s_int: ['Round 2 variance elevated'],
    s_cross: ['Title mismatch on earliest role'],
    s_id: ['Recently created profile'],
  },
  aiTextPercent: 32,
  platformConsistency: 70,
  platformMatrix: {
    linkedin_cv_match: {
      score: 72,
      explanation: 'Employment dates largely match.',
    },
    github_experience_match: {
      score: 64,
      explanation: 'Repository activity supports mid-level claims.',
    },
    cross_platform_consistency: {
      score: 68,
      explanation: 'Name and location are consistent.',
    },
  },
  interviewVariance: 28,
  responseScore: 76,
  radar: [
    { subject: 'CV Auth.', value: 68 },
    { subject: 'Platform', value: 70 },
    { subject: 'Credentials', value: 65 },
    { subject: 'Interview', value: 74 },
    { subject: 'Response', value: 76 },
  ],
  riskVectors: [
    { name: 'AI Text', value: 32 },
    { name: 'Platform', value: 30 },
    { name: 'Confidence', value: 26 },
  ],
  flags: [
    {
      type: 'interview_prompt',
      severity: 'warning',
      description: 'Round 2 showed elevated response latency.',
      confidence: 0.82,
    },
  ],
  linkedin: {
    provided: true,
    handle: 'https://linkedin.com/in/jane',
    status: 'authentic',
    statusLabel: 'AUTHENTIC PROFILE',
  },
  github: {
    provided: true,
    handle: 'jane-dev',
    status: 'authentic',
    statusLabel: 'AUTHENTIC PROFILE',
  },
  verdict: {
    level: 'medium',
    title: 'SIGNAL ASSESSMENT: Mixed integrity signals',
    body: 'Some indicators warrant follow-up before final decision.',
  },
  recommendedActions: [
    'Run a live technical assessment.',
    'Validate earliest employment dates manually.',
  ],
  rounds: [
    {
      roundNumber: 1,
      sInt: 78,
      sId: 70,
      varianceDelta: 0,
      wasTruncated: false,
      observations: ['Strong spontaneous reasoning on system design.'],
      deepDivePrompts: ['Ask for trade-offs in the caching layer.'],
    },
  ],
  behaviourAnalysis: {
    summary: 'Collaborative communicator with structured answers.',
    traits: ['Calm under pressure'],
    detailLabel: 'Communication style',
    detail: 'Direct and concise.',
    indicators: ['Explains trade-offs clearly'],
    motivationSignals: [],
    concerns: [],
  },
  personalityAnalysis: {
    summary: 'Shows curiosity and ownership.',
    traits: ['Detail-oriented'],
    detailLabel: 'Work style',
    detail: 'Prefers async collaboration.',
    indicators: ['Culture fit indicators present'],
    motivationSignals: ['Motivated by technical challenge'],
    concerns: ['May need support in stakeholder communication'],
  },
};

describe('PdfDocumentBuilder', () => {
  it('builds a multi-section candidate dossier PDF', async () => {
    const builder = await PdfDocumentBuilder.create({ watermarked: false });

    builder.addCoverHeader('Senior Engineer', '2026-06-12 12:00 UTC', {
      candidatesScreened: 3,
    });
    builder.addRoleOverview(
      'Build scalable backend services and mentor junior engineers.',
      {
        avgIntegrity: 72,
        scored: 3,
        completedCount: 3,
        distribution: { high: 1, medium: 1, low: 1 },
      },
    );
    builder.startCandidatePage();
    builder.addCandidateReport('Jane Doe', sampleReport, {
      email: 'jane@example.com',
      linkedinUrl: 'https://linkedin.com/in/jane',
      githubUsername: 'jane-dev',
      followUpSuggested: ['Verify reference for earliest role'],
    });
    builder.addClosingPage('https://certalytic.com');

    const buffer = await builder.build();

    expect(buffer.byteLength).toBeGreaterThan(2_000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
