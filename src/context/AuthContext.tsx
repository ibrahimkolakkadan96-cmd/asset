import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { getSupabaseClient, getStoredSupabaseConfig } from '../lib/supabase';

interface AuthContextType {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  authMode: 'supabase' | 'directory' | null;
  login: (usernameOrEmail: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPasswordRequest: (emailOrUsername: string) => Promise<{ success: boolean; message: string }>;
  sessionTimeRemaining: number | null; // seconds
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH_USER = 'premier_it_tracker_auth_user_v1';
const STORAGE_KEY_REMEMBER_ME = 'premier_it_tracker_remember_me_v1';
const STORAGE_KEY_SESSION_EXPIRY = 'premier_it_tracker_session_expiry_v1';
const STORAGE_KEY_AUTH_MODE = 'premier_it_tracker_auth_mode_v1';

// Pre-registered official Premier Auto Parts LLC directory accounts
export const PREMIER_REGISTERED_USERS: Array<AppUser & { passwordHash: string; securityNote: string }> = [
  {
    id: 'usr_admin_01',
    email: 'admin@premierautoparts.ae',
    username: 'admin',
    displayName: 'IT Administrator (Super Admin)',
    role: 'admin',
    assignedBranch: null, // Full access to all 22 branches & backup/restore
    department: 'Enterprise IT & Infrastructure',
    passwordHash: 'Admin@Premier2026',
    securityNote: 'Full Administrative Privileges (All 22 Branches, Backup, Restore, User Controls)',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_sec_admin',
    email: 'ibrahimtirur6@gmail.com',
    username: 'ibrahim.admin',
    displayName: 'Ibrahim (Senior IT Director)',
    role: 'admin',
    assignedBranch: null,
    department: 'Corporate IT Management',
    passwordHash: 'PremierIT#2026',
    securityNote: 'Master IT Director Profile',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_mgr_br01',
    email: 'manager.br01@premierautoparts.ae',
    username: 'manager.br01',
    displayName: 'Branch 01 Store Manager',
    role: 'branch_manager',
    assignedBranch: 1,
    department: 'Branch 01 Operations',
    passwordHash: 'Branch01@2026',
    securityNote: 'Branch 01 Inventory & Movement Manager',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_viewer_auditor',
    email: 'audit@premierautoparts.ae',
    username: 'auditor',
    displayName: 'Internal IT Auditor',
    role: 'viewer',
    assignedBranch: null,
    department: 'Internal Quality Audit',
    passwordHash: 'Audit@Premier2026',
    securityNote: 'Read-only access across Branch 1-22 assets',
    lastLoginAt: new Date().toISOString(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authMode, setAuthMode] = useState<'supabase' | 'directory' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Load existing session on initial mount (prioritizing live Supabase Auth session)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (!cancelled && sessionData?.session?.user) {
          const u = sessionData.session.user;
          const userMeta = u.user_metadata || {};
          const role: UserRole =
            userMeta.role === 'branch_manager' || userMeta.role === 'viewer'
              ? userMeta.role
              : 'admin';
          const hydrated: AppUser = {
            id: u.id,
            email: u.email || '',
            username: (u.email || 'admin').split('@')[0],
            displayName: userMeta.full_name || u.email || 'Premier IT Administrator',
            role,
            assignedBranch: userMeta.assigned_branch ?? null,
            department: userMeta.department || 'Enterprise IT & Infrastructure',
            lastLoginAt: new Date().toISOString(),
          };
          setCurrentUser(hydrated);
          setAuthMode('supabase');
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Supabase session probe notice:', e);
      }

      try {
        const storedUser = localStorage.getItem(STORAGE_KEY_AUTH_USER);
        const rememberMe = localStorage.getItem(STORAGE_KEY_REMEMBER_ME) === 'true';
        const storedExpiry = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);
        const storedMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE) as 'supabase' | 'directory' | null;

        if (storedUser && !cancelled) {
          const parsedUser: AppUser = JSON.parse(storedUser);
          const expiryTime = storedExpiry ? parseInt(storedExpiry, 10) : 0;
          const now = Date.now();

          if (!rememberMe && expiryTime && now > expiryTime) {
            localStorage.removeItem(STORAGE_KEY_AUTH_USER);
            localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRY);
            localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
            setCurrentUser(null);
            setAuthMode(null);
          } else {
            setCurrentUser(parsedUser);
            setAuthMode(storedMode || 'directory');
            setSessionExpiry(expiryTime);
          }
        }
      } catch (e) {
        console.warn('Could not read stored authentication state', e);
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Periodic session timeout watcher
  useEffect(() => {
    if (!currentUser || !sessionExpiry) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now > sessionExpiry) {
        logout();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser, sessionExpiry]);

  // Login handler
  const login = async (
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    // Map username aliases to registered email for Supabase Auth attempt
    const directoryMatch = PREMIER_REGISTERED_USERS.find(
      (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );
    const emailCandidate = cleanIdentifier.includes('@')
      ? cleanIdentifier
      : directoryMatch?.email || '';

    // 1. Attempt live Supabase Auth first
    if (emailCandidate) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password: cleanPassword,
        });

        if (!error && data.user) {
          const userMeta = data.user.user_metadata || {};
          const matchedRole: UserRole =
            userMeta.role === 'branch_manager' || userMeta.role === 'viewer'
              ? userMeta.role
              : directoryMatch?.role || 'admin';
          const authenticatedUser: AppUser = {
            id: data.user.id,
            email: data.user.email || emailCandidate,
            username: cleanIdentifier.split('@')[0],
            displayName: userMeta.full_name || directoryMatch?.displayName || data.user.email || 'Premier IT Administrator',
            role: matchedRole,
            assignedBranch: userMeta.assigned_branch ?? directoryMatch?.assignedBranch ?? null,
            department: userMeta.department || directoryMatch?.department || 'Enterprise IT & Infrastructure',
            lastLoginAt: new Date().toISOString(),
          };

          saveSession(authenticatedUser, rememberMe, 'supabase');
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase Auth probe notice:', err);
      }
    }

    // Verify against corporate registered credentials directory
    const matchedAccount = PREMIER_REGISTERED_USERS.find(
      (u) =>
        u.username.toLowerCase() === cleanIdentifier ||
        u.email.toLowerCase() === cleanIdentifier
    );

    if (!matchedAccount) {
      return {
        success: false,
        error: 'Invalid credentials. User not found in Premier Auto Parts LLC directory.',
      };
    }

    if (matchedAccount.passwordHash !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    // Successful credentials verification
    const authenticatedUser: AppUser = {
      id: matchedAccount.id,
      email: matchedAccount.email,
      username: matchedAccount.username,
      displayName: matchedAccount.displayName,
      role: matchedAccount.role,
      assignedBranch: matchedAccount.assignedBranch,
      department: matchedAccount.department,
      lastLoginAt: new Date().toISOString(),
    };

    saveSession(authenticatedUser, rememberMe, 'directory');
    return { success: true };
  };

  const saveSession = (user: AppUser, rememberMe: boolean, mode: 'supabase' | 'directory') => {
    setCurrentUser(user);
    setAuthMode(mode);
    // 24 hours if remember me, 2 hours if standard corporate session
    const durationMs = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const expiryTime = Date.now() + durationMs;
    setSessionExpiry(expiryTime);

    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_REMEMBER_ME, rememberMe ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEY_SESSION_EXPIRY, expiryTime.toString());
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, mode);
    } catch (e) {
      console.warn('Could not save auth session to localStorage', e);
    }
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {}

    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRY);
      localStorage.removeItem(STORAGE_KEY_REMEMBER_ME);
      localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
    } catch (e) {}

    setCurrentUser(null);
    setAuthMode(null);
    setSessionExpiry(null);
  };

  const resetPasswordRequest = async (emailOrUsername: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = emailOrUsername.trim().toLowerCase();
    const matched = PREMIER_REGISTERED_USERS.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    const emailToReset = cleanId.includes('@') ? cleanId : matched?.email;
    if (!emailToReset) {
      return {
        success: false,
        message: 'No account registered under this username/email at Premier Auto Parts LLC.',
      };
    }

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.resetPasswordForEmail(emailToReset).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      message: `Password reset authorization link has been dispatched to ${emailToReset}. Please consult corporate IT helpdesk if you need immediate override.`,
    };
  };

  const timeRemainingSeconds = sessionExpiry ? Math.max(0, Math.floor((sessionExpiry - Date.now()) / 1000)) : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        isAdmin: currentUser?.role === 'admin',
        authMode,
        login,
        logout,
        resetPasswordRequest,
        sessionTimeRemaining: timeRemainingSeconds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
