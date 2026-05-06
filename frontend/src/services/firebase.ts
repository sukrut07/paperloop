import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredConfig = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
] as const;

const missingConfig = requiredConfig
  .filter(([, value]) => !value || value.startsWith('replace_with'))
  .map(([key]) => key);

export const firebaseConfigError = missingConfig.length
  ? `Firebase is not configured. Add ${missingConfig.join(', ')} to frontend/.env.local and restart Next.js.`
  : null;

const app = firebaseConfigError ? null : getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = app ? getAuth(app) : null;
