import { MedplumClient } from '@medplum/core';

// Check environment variables or fall back to defaults
const baseUrl = import.meta.env.VITE_MEDPLUM_BASE_URL || 'https://api.medplum.com/';
const clientId = import.meta.env.VITE_MEDPLUM_CLIENT_ID || '';

export const medplum = new MedplumClient({
  baseUrl,
  // We can pass storage or other config if needed. Medplum uses window.localStorage by default.
});

export { clientId };
