import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

let initialized = false;

function projectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function serviceAccountFromEnv() {
  const project_id = projectId();
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  const private_key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!project_id || !client_email || !private_key) return null;

  return {
    projectId: project_id,
    clientEmail: client_email,
    privateKey: private_key,
  };
}

export function getFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(__dirname, '../..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : undefined;
  const explicitProjectId = projectId();
  const explicitServiceAccount = serviceAccountFromEnv();

  if (inlineJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(inlineJson)),
    });
  } else if (explicitServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(explicitServiceAccount),
      projectId: explicitProjectId,
    });
  } else if (filePath && fs.existsSync(filePath)) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(fs.readFileSync(filePath, 'utf8'))),
      projectId: explicitProjectId,
    });
  } else {
    admin.initializeApp({
      projectId: explicitProjectId,
    });
  }

  initialized = true;
  return admin;
}
