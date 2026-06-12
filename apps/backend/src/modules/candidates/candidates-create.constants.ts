import { limits } from '../../config/env';

export const ALLOWED_CV_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'md',
  'markdown',
  'txt',
]);

export const ALLOWED_TRANSCRIPT_FILE_EXTENSIONS = new Set(['vtt', 'docx']);

export const CV_UPLOAD_MAX_BYTES =
  limits.cvMaxKilobytes * 1024;

export const TRANSCRIPT_FILE_MAX_BYTES =
  limits.transcriptFileMaxKilobytes * 1024;

export const CANDIDATE_CREATE_UPLOAD_MAX_BYTES = Math.max(
  CV_UPLOAD_MAX_BYTES,
  TRANSCRIPT_FILE_MAX_BYTES,
);
