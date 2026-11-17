import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, setAuthToken } from "@/api/client";
import type { User } from "@/api/types";

interface AuthValue {
  ready: boolean;
  user: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(KEY);
      if (token) {
        setAuthToken(token);
        try {
          setUser((await api.me()).user);
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            await AsyncStorage.removeItem(KEY);
            setAuthToken(null);
          }
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (token: string, u: User) => {
    await AsyncStorage.setItem(KEY, token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ ready, user, signIn, signOut, setUser }), [ready, user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
