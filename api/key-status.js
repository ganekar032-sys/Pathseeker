// Vercel serverless endpoint: GET /api/key-status
// Reports whether shared demo access is configured and how much of today's
// free pool remains — without exposing the key and without burning quota.

import { handleKeyStatus } from './_handler.js';

export default function handler(request) {
  return handleKeyStatus(request);
}
