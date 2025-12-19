import http from '../api/http';

export type Role = 'admin' | 'staff' | string;
export interface Me {
  authenticated: boolean;
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  pictureUrl?: string;
  roles?: Role[];
  status?: string;
  cpr?: string;
  phone?: string;
  address?: string;
  bankReg?: string;
  bankNumber?: string;
  documents?: any[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'me';
let me: Me | null = null;
let initPromise: Promise<Me | null> | null = null;

// Read cached state immediately to avoid refresh clear
(function getFromSession(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) me = JSON.parse(raw);
  } catch {}
})();

function persist(): void {
  if (me?.authenticated) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(me));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

// Call once on startup
export async function initAuth(force = false): Promise<Me | null> {
  if (!force && initPromise) return initPromise; // reuse
  initPromise = (async (): Promise<Me | null> => {
    try {
      const data: Me = await http.get<Me, Me>('/me'); // returns JSON body
      me = data?.authenticated ? data : null;
    } catch {
      me = null;
    } finally {
      persist(); // save to session storage
    }
    return me;
  })();
  return initPromise;
}

// Helpers for UI
export function isAuthenticated() {
  return !!me?.authenticated;
}
export function isAdmin() {
  return !!me?.roles?.includes('admin');
}
export function userId() {
  return me?.id ?? null;
}
export function getMe() {
  console.log('getMe called, me:', me);
  return me;
}
export function getDisplayName() {
  return me?.displayName ?? null;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('authToken');
}

// For logout
export function clearAuth() {
  me = null;
  persist();
}

// Keeps multiple tabs in sync
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    try {
      me = e.newValue ? JSON.parse(e.newValue) : null;
    } catch {}
  }
});
