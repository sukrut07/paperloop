'use client';

import {
  GoogleAuthProvider,
  User as FirebaseUser,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, firebaseConfigError } from '@/services/firebase';
import { getPrimaryLocalRoom, setLocalRole } from './localStore';
import type { Role, UserProfile } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const TOKEN_KEY = 'paperloop.jwt';
const USER_KEY = 'paperloop.user';
const LOCAL_ACCOUNTS_KEY = 'paperloop.localAuth.accounts';
const LOCAL_GOOGLE_PROFILES_KEY = 'paperloop.localAuth.googleProfiles';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signup: (input: SignupInput) => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<UserProfile>;
  loginWithGoogle: (role: Role | undefined, remember: boolean, organizationName?: string) => Promise<UserProfile>;
  updateProfile: (input: ProfileInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
}

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  remember: boolean;
  organizationName?: string;
}

interface ProfileInput {
  name: string;
  role: Role;
  organizationName?: string;
  phone?: string;
}

async function authRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(`Backend API is not reachable at ${API_BASE}. Start the backend or continue in local demo mode.`);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Authentication request failed';
    try {
      const payload = JSON.parse(text) as { error?: string; message?: string };
      message = payload.error || payload.message || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function requireFirebaseAuth() {
  if (!auth) {
    throw new Error(firebaseConfigError || 'Firebase authentication is unavailable.');
  }
  return auth;
}

type LocalAccount = UserProfile & { password: string };

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readLocalAccounts() {
  return readJson<LocalAccount[]>(LOCAL_ACCOUNTS_KEY, []);
}

function writeLocalAccounts(accounts: LocalAccount[]) {
  writeJson(LOCAL_ACCOUNTS_KEY, accounts);
}

function readLocalGoogleProfiles() {
  return readJson<UserProfile[]>(LOCAL_GOOGLE_PROFILES_KEY, []);
}

function writeLocalGoogleProfile(user: UserProfile) {
  const profiles = readLocalGoogleProfiles();
  writeJson(LOCAL_GOOGLE_PROFILES_KEY, [user, ...profiles.filter((profile) => profile.email !== user.email)]);
}

function writeLocalAccountProfile(user: UserProfile) {
  const accounts = readLocalAccounts();
  writeLocalAccounts(accounts.map((account) => (account.email === user.email ? { ...account, ...user, password: account.password } : account)));
}

function persistCurrentSession(nextToken: string, nextUser: UserProfile) {
  const sessionHasToken = typeof window !== 'undefined' && Boolean(sessionStorage.getItem(TOKEN_KEY));
  const storage = sessionHasToken ? sessionStorage : localStorage;
  storage.setItem(TOKEN_KEY, nextToken);
  storage.setItem(USER_KEY, JSON.stringify(nextUser));
  if (sessionHasToken) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
  setLocalRole(nextUser.role);
  window.dispatchEvent(new CustomEvent('paperloop-auth-change', { detail: nextUser }));
}

function updateLocalProfiles(nextUser: UserProfile) {
  writeLocalAccountProfile(nextUser);
  writeLocalGoogleProfile(nextUser);
}

function localAuthPayload(user: UserProfile) {
  return {
    token: `local-demo-token-${user.uid}`,
    user,
  };
}

function isBackendUnreachable(error: unknown) {
  return error instanceof Error && error.message.includes('Backend API is not reachable');
}

function firebaseFallbackPayload(firebaseUser: FirebaseUser, role?: Role, organizationName?: string) {
  const email = firebaseUser.email?.trim().toLowerCase() || `${firebaseUser.uid}@firebase.local`;
  const existingGoogleProfile = readLocalGoogleProfiles().find((profile) => profile.email === email);
  const existingLocalAccount = readLocalAccounts().find((account) => account.email === email);
  const resolvedRole = role || existingGoogleProfile?.role || existingLocalAccount?.role || 'institution';
  const resolvedOrganizationName =
    organizationName ||
    existingGoogleProfile?.organizationName ||
    existingGoogleProfile?.institutionName ||
    existingLocalAccount?.organizationName ||
    existingLocalAccount?.institutionName;
  const name = firebaseUser.displayName || email.split('@')[0];
  const user: UserProfile = {
    id: `firebase-local-${firebaseUser.uid}`,
    uid: firebaseUser.uid,
    name,
    email,
    role: resolvedRole,
    isVerified: firebaseUser.emailVerified,
    institutionName: resolvedOrganizationName,
    organizationName: resolvedOrganizationName,
    createdAt: new Date().toISOString(),
  };
  writeLocalGoogleProfile(user);
  setLocalRole(resolvedRole);
  return localAuthPayload(user);
}

function createLocalAuthUser(input: SignupInput) {
  const accounts = readLocalAccounts();
  const email = input.email.trim().toLowerCase();
  if (accounts.some((account) => account.email === email)) {
    throw new Error('A local demo account already exists for this email. Try logging in instead.');
  }

  const user: UserProfile = {
    id: `local-${Date.now()}`,
    uid: `local-${crypto.randomUUID()}`,
    name: input.name.trim(),
    email,
    role: input.role,
    isVerified: true,
    institutionName: input.organizationName,
    organizationName: input.organizationName,
    createdAt: new Date().toISOString(),
  };
  writeLocalAccounts([...accounts, { ...user, password: input.password }]);
  setLocalRole(input.role);
  return localAuthPayload(user);
}

function loginLocalAuthUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const account = readLocalAccounts().find((item) => item.email === email);
  if (!account || account.password !== password) {
    throw new Error('No local demo account matches that email and password.');
  }

  const user: UserProfile = {
    id: account.id,
    uid: account.uid,
    name: account.name,
    email: account.email,
    role: account.role,
    isVerified: account.isVerified,
    institutionName: account.institutionName,
    organizationName: account.organizationName || account.institutionName,
    phone: account.phone,
    createdAt: account.createdAt,
  };
  setLocalRole(user.role);
  return localAuthPayload(user);
}

function persistFallbackSession(remember: boolean, payload: { token: string; user: UserProfile }) {
  if (!remember) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.setItem(TOKEN_KEY, payload.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    window.dispatchEvent(new CustomEvent('paperloop-auth-change', { detail: payload.user }));
    return;
  }

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  persistSession(payload.token, payload.user);
}

function ensureInstitutionRoom(user: UserProfile) {
  if (user.role === 'institution') getPrimaryLocalRoom(user);
}

function authError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return new Error(fallback);
  const code = 'code' in error ? String((error as { code?: unknown }).code) : '';
  const messages: Record<string, string> = {
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'Firebase API key is invalid. Update frontend/.env.local with your Firebase web app config.',
    'auth/api-key-not-valid': 'Firebase API key is invalid. Update frontend/.env.local with your Firebase web app config.',
    'auth/invalid-api-key': 'Firebase API key is invalid. Update frontend/.env.local with your Firebase web app config.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-not-found': 'No account exists for this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account already exists for this email. Try logging in instead.',
    'auth/weak-password': 'Use a stronger password with at least 8 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication. Add localhost to authorized domains.',
  };

  return new Error(messages[code] || error.message || fallback);
}

function persistSession(nextToken: string, nextUser: UserProfile) {
  localStorage.setItem(TOKEN_KEY, nextToken);
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  window.dispatchEvent(new CustomEvent('paperloop-auth-change', { detail: nextUser }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('paperloop-auth-change', { detail: null }));
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((payload: { token: string; user: UserProfile }) => {
    setToken(payload.token);
    setUser(payload.user);
    ensureInstitutionRoom(payload.user);
    persistSession(payload.token, payload.user);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    let nextUser: UserProfile | null = null;
    if (storedUser) {
      try {
        nextUser = JSON.parse(storedUser) as UserProfile;
      } catch {
        sessionStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    queueMicrotask(() => {
      if (storedToken) setToken(storedToken);
      if (nextUser) setUser(nextUser);
      if (!auth) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = useCallback(
    async ({ name, email, password, role, remember, organizationName }: SignupInput) => {
      try {
        if (!auth) {
          let payload: { token: string; user: UserProfile };
          try {
            payload = await authRequest<{ token: string; user: UserProfile }>('/auth/signup', {
              method: 'POST',
              body: JSON.stringify({ name, email, password, role, institutionName: organizationName }),
            });
          } catch (error) {
            if (error instanceof Error && !error.message.includes('Backend API is not reachable')) throw error;
            payload = createLocalAuthUser({ name, email, password, role, remember, organizationName });
          }
          setToken(payload.token);
          setUser(payload.user);
          ensureInstitutionRoom(payload.user);
          persistFallbackSession(remember, payload);
          return;
        }

        const firebaseAuth = requireFirebaseAuth();
        await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateFirebaseProfile(credential.user, { displayName: name });
        const idToken = await credential.user.getIdToken(true);
        let payload: { token: string; user: UserProfile };
        try {
          payload = await authRequest<{ token: string; user: UserProfile }>('/auth/firebase', {
            method: 'POST',
            body: JSON.stringify({ idToken, name, role, institutionName: organizationName }),
          });
          applyAuth(payload);
        } catch (error) {
          if (!isBackendUnreachable(error)) throw error;
          payload = firebaseFallbackPayload(credential.user, role, organizationName);
          setToken(payload.token);
          setUser(payload.user);
          ensureInstitutionRoom(payload.user);
          persistFallbackSession(remember, payload);
        }
      } catch (error) {
        throw authError(error, 'Signup failed');
      }
    },
    [applyAuth]
  );

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      try {
        if (!auth) {
          let payload: { token: string; user: UserProfile };
          try {
            payload = await authRequest<{ token: string; user: UserProfile }>('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email, password }),
            });
          } catch (error) {
            if (error instanceof Error && !error.message.includes('Backend API is not reachable')) throw error;
            payload = loginLocalAuthUser(email, password);
          }
          setToken(payload.token);
          setUser(payload.user);
          ensureInstitutionRoom(payload.user);
          persistFallbackSession(remember, payload);
          return payload.user;
        }

        const firebaseAuth = requireFirebaseAuth();
        await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await credential.user.getIdToken(true);
        let payload: { token: string; user: UserProfile };
        try {
          payload = await authRequest<{ token: string; user: UserProfile }>('/auth/firebase', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          });
          applyAuth(payload);
        } catch (error) {
          if (!isBackendUnreachable(error)) throw error;
          payload = firebaseFallbackPayload(credential.user);
          setToken(payload.token);
          setUser(payload.user);
          ensureInstitutionRoom(payload.user);
          persistFallbackSession(remember, payload);
        }
        return payload.user;
      } catch (error) {
        throw authError(error, 'Login failed');
      }
    },
    [applyAuth]
  );

  const loginWithGoogle = useCallback(
    async (role: Role | undefined, remember: boolean, organizationName?: string) => {
      try {
        const firebaseAuth = requireFirebaseAuth();
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithPopup(firebaseAuth, provider);
        const idToken = await credential.user.getIdToken(true);
        let payload: { token: string; user: UserProfile };
        try {
          payload = await authRequest<{ token: string; user: UserProfile }>('/auth/firebase', {
            method: 'POST',
            body: JSON.stringify({ idToken, role, institutionName: organizationName }),
          });
          applyAuth(payload);
        } catch (error) {
          if (!isBackendUnreachable(error)) throw error;
          payload = firebaseFallbackPayload(credential.user, role, organizationName);
          setToken(payload.token);
          setUser(payload.user);
          ensureInstitutionRoom(payload.user);
          persistFallbackSession(remember, payload);
        }
        return payload.user;
      } catch (error) {
        throw authError(error, 'Google login failed');
      }
    },
    [applyAuth]
  );

  const updateProfile = useCallback(
    async ({ name, role, organizationName, phone }: ProfileInput) => {
      if (!user || !token) throw new Error('You must be logged in to save your profile.');
      const nextUser: UserProfile = {
        ...user,
        name: name.trim(),
        role,
        institutionName: organizationName?.trim(),
        organizationName: organizationName?.trim(),
        phone: phone?.trim(),
      };

      try {
        if (!token.startsWith('local-demo-token-')) {
          const payload = await authRequest<{ token: string; user: UserProfile }>('/users/profile', {
            method: 'POST',
            body: JSON.stringify({
              name: nextUser.name,
              role,
              institutionName: nextUser.organizationName,
              phone: nextUser.phone,
            }),
          }, token);
          setToken(payload.token);
          setUser(payload.user);
          persistCurrentSession(payload.token, payload.user);
          updateLocalProfiles(payload.user);
          ensureInstitutionRoom(payload.user);
          return payload.user;
        }
      } catch (error) {
        if (!isBackendUnreachable(error)) throw authError(error, 'Could not save profile');
      }

      setToken(token);
      setUser(nextUser);
      persistCurrentSession(token, nextUser);
      updateLocalProfiles(nextUser);
      ensureInstitutionRoom(nextUser);
      return nextUser;
    },
    [token, user]
  );

  const logout = useCallback(async () => {
    if (auth) await signOut(auth).catch(() => undefined);
    setToken(null);
    setUser(null);
    clearSession();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }, []);

  const resetPassword = useCallback((email: string) => sendPasswordResetEmail(requireFirebaseAuth(), email), []);

  const refreshEmailVerification = useCallback(async () => {
    if (!auth?.currentUser || !token) return;
    await auth.currentUser.reload();
    const idToken = await auth.currentUser.getIdToken(true);
    const payload = await authRequest<{ token: string; user: UserProfile }>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken, role: user?.role }),
    });
    applyAuth(payload);
  }, [applyAuth, token, user?.role]);

  const value = useMemo(
    () => ({ user, token, loading, signup, login, loginWithGoogle, updateProfile, logout, resetPassword, refreshEmailVerification }),
    [user, token, loading, signup, login, loginWithGoogle, updateProfile, logout, resetPassword, refreshEmailVerification]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function useRequireAuth(allowedRoles?: Role[]) {
  const authValue = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authValue.loading) return;
    if (!authValue.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles?.length && !allowedRoles.includes(authValue.user.role)) {
      router.replace('/login');
    }
  }, [allowedRoles, authValue.loading, authValue.user, pathname, router]);

  return authValue;
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}
