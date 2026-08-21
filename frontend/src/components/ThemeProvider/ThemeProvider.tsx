"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useUserProfile } from "@/components/UserProfileContext";
import { authFetch } from "@/lib/api";

export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export type ThemeContextType = {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system" ? getSystemTheme() : preference;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [theme, setThemeState] = useState<Theme>("light");

  // Consume canonical profile appearance from UserProfileContext
  let userProfileContext: ReturnType<typeof useUserProfile> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    userProfileContext = useUserProfile();
  } catch {
    // Fallback if rendered outside UserProfileProvider
    userProfileContext = null;
  }

  const contextAppearance = userProfileContext?.user?.profile?.appearance;

  /*
   * Sync preference whenever UserProfileContext hydrates or updates.
   * Eliminates duplicate independent /api/auth/me/ calls.
   */
  useEffect(() => {
    if (contextAppearance && isThemePreference(contextAppearance)) {
      setPreference(contextAppearance);
      setThemeState(resolveTheme(contextAppearance));
    }
  }, [contextAppearance]);

  /*
   * Apply the resolved theme class to <html>.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  /*
   * Follow operating system theme changes when "system" is selected.
   */
  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };

    setThemeState(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [preference]);

  /*
   * Change UI immediately (optimistic), then persist via UserProfileContext / backend.
   */
  const setTheme = useCallback(
    async (newPreference: ThemePreference) => {
      const previousPreference = preference;
      const previousTheme = theme;

      // Optimistic UI update
      setPreference(newPreference);
      setThemeState(resolveTheme(newPreference));

      try {
        if (userProfileContext?.updateUser) {
          const res = await userProfileContext.updateUser({
            profile: { appearance: newPreference },
          });
          if (!res.success) {
            throw new Error(res.error || "Failed to persist appearance");
          }
        } else {
          // Direct fallback using authFetch
          const response = await authFetch("/api/auth/me/", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              profile: { appearance: newPreference },
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save appearance: ${response.status}`);
          }
        }
      } catch (error) {
        console.error("Unable to save appearance:", error);
        // Roll back on failure
        setPreference(previousPreference);
        setThemeState(previousTheme);
      }
    },
    [preference, theme, userProfileContext]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        preference,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }

  return context;
}