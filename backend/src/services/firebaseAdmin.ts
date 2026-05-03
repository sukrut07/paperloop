import admin from 'firebase-admin';
import fs from 'node:fs';

let initialized = false;

export function getFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (inlineJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(inlineJson)),
    });
  } else if (filePath && fs.existsSync(filePath)) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(fs.readFileSync(filePath, 'utf8'))),
    });
  } else {
    admin.initializeApp();
  }

  initialized = true;
  return admin;
}
