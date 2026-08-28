import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { TaskFloSDK } from "../sdk/index";
import { User, AuthTokens } from "../sdk/types";
import { defaultSecureStorage, secureStorageKeys, ISecureStorage } from "../security/secureStorage";
import { defaultOfflineCache } from "../offline/cacheManager";

export interface AuthContextType {
  isInitializing: boolean;
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  sdk: TaskFloSDK;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserLocally: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  storage?: ISecureStorage;
  customSdk?: TaskFloSDK;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  storage = defaultSecureStorage,
  customSdk,
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const sdk = useMemo(() => {
    if (customSdk) return customSdk;
    return new TaskFloSDK({
      getRefreshToken: async () => {
        return storage.getItem(secureStorageKeys.REFRESH_TOKEN);
      },
      onTokensRefreshed: async (newTokens) => {
        await storage.setItem(secureStorageKeys.ACCESS_TOKEN, newTokens.access);
        await storage.setItem(secureStorageKeys.REFRESH_TOKEN, newTokens.refresh);
        setTokens(newTokens);
      },
      onSessionExpired: async () => {
        await storage.clear();
        defaultOfflineCache.clearUserSessionCache();
        setTokens(null);
        setUser(null);
      },
    });
  }, [customSdk, storage]);

  // Restore authenticated session on boot
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const storedAccess = await storage.getItem(secureStorageKeys.ACCESS_TOKEN);
        const storedRefresh = await storage.getItem(secureStorageKeys.REFRESH_TOKEN);

        if (storedAccess && storedRefresh) {
          sdk.client.setAccessToken(storedAccess);
          setTokens({ access: storedAccess, refresh: storedRefresh });

          try {
            const me = await sdk.profile.getMe();
            if (isMounted) {
              setUser(me);
            }
          } catch {
            // Access token might be expired, attempt refresh
            try {
              const newAccess = await sdk.client.refreshTokenFlow();
              if (newAccess) {
                const me = await sdk.profile.getMe();
                if (isMounted) setUser(me);
              }
            } catch {
              // Refresh failed, purge session
              await storage.clear();
              sdk.client.setAccessToken(null);
              if (isMounted) {
                setUser(null);
                setTokens(null);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore mobile auth session:", err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [sdk, storage]);

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      const authTokens = await sdk.auth.login({
        username,
        password,
      });

      await storage.setItem(secureStorageKeys.ACCESS_TOKEN, authTokens.access);
      await storage.setItem(secureStorageKeys.REFRESH_TOKEN, authTokens.refresh);
      setTokens(authTokens);

      const userProfile = await sdk.profile.getMe();
      await storage.setItem(secureStorageKeys.USER_CACHE, JSON.stringify(userProfile));
      setUser(userProfile);
      return userProfile;
    },
    [sdk, storage]
  );

  const register = useCallback(
    async (username: string, email: string, password: string, passwordConfirm: string): Promise<User> => {
      const newUser = await sdk.auth.register({
        username,
        email,
        password,
        password_confirm: passwordConfirm,
      });
      // Auto-login post registration
      await login(username, password);
      return newUser;
    },
    [sdk, login]
  );

  const logout = useCallback(async (): Promise<void> => {
    sdk.auth.logout();
    await storage.clear();
    defaultOfflineCache.clearUserSessionCache();
    setTokens(null);
    setUser(null);
  }, [sdk, storage]);

  const refreshSession = useCallback(async (): Promise<void> => {
    const me = await sdk.profile.getMe();
    setUser(me);
  }, [sdk]);

  const updateUserLocally = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isInitializing,
      isAuthenticated: Boolean(user && tokens),
      user,
      tokens,
      sdk,
      login,
      register,
      logout,
      refreshSession,
      updateUserLocally,
    }),
    [isInitializing, user, tokens, sdk, login, register, logout, refreshSession, updateUserLocally]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
