import { medplum } from '../medplum';

const projectId = import.meta.env.VITE_MEDPLUM_PROJECT_ID as string;
export const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const clientId = import.meta.env.VITE_MEDPLUM_CLIENT_ID as string;

/**
 * Registers a new patient and immediately signs them in.
 * Flow: startNewUser (creates user) -> startNewPatient (creates Patient resource linked to project) -> processCode (logs in).
 */
export async function registerPatient(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  recaptchaToken: string
): Promise<void> {
  const response = await medplum.startNewUser({
    firstName,
    lastName,
    email,
    password,
    recaptchaToken,
    ...(recaptchaSiteKey ? { recaptchaSiteKey } : {}),
    projectId,
    clientId,
  });

  const patientResponse = await medplum.startNewPatient({
    login: response.login,
    projectId,
  });

  if (!patientResponse.code) {
    throw new Error('Registration completed but no session code was returned. Please try signing in.');
  }

  await medplum.processCode(patientResponse.code);
}

/**
 * Signs an existing patient in.
 */
export async function loginPatient(email: string, password: string): Promise<void> {
  const loginResponse = await medplum.startLogin({
    email,
    password,
    projectId,
    clientId,
  });

  if (!loginResponse.code) {
    throw new Error('Login failed: no authorization code returned.');
  }

  await medplum.processCode(loginResponse.code);
}

/**
 * Signs the current user out.
 */
export async function logoutPatient(): Promise<void> {
  await medplum.signOut();
}
