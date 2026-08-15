"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ThemePreference = "system" | "light" | "dark";
type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
};

type MeResponse = {
  id: number;
  username: string;
  email: string;
  profile: {
    full_name: string;
    avatar: string | null;
    appearance: ThemePreference;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system"
    ? getSystemTheme()
    : preference;
}

function isThemePreference(
  value: unknown
): value is ThemePreference {
  return (
    value === "system" ||
    value === "light" ||
    value === "dark"
  );
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * Stable values during SSR/hydration.
   *
   * Do not read localStorage, matchMedia, or the API during render.
   */
  const [preference, setPreference] =
    useState<ThemePreference>("system");

  const [theme, setThemeState] =
    useState<Theme>("light");

  /*
   * Apply the resolved theme to <html>.
   */
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  /*
   * Load the authenticated user's saved appearance
   * from the backend.
   */
  useEffect(() => {
    const loadUserTheme = async () => {
      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        setPreference("system");
        setThemeState(getSystemTheme());
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load user profile: ${response.status}`
          );
        }

        const data: MeResponse = await response.json();

        const savedAppearance =
          data.profile?.appearance;

        if (isThemePreference(savedAppearance)) {
          setPreference(savedAppearance);
          setThemeState(
            resolveTheme(savedAppearance)
          );
        } else {
          setPreference("system");
          setThemeState(getSystemTheme());
        }
      } catch (error) {
        console.error(
          "Unable to load saved appearance:",
          error
        );

        /*
         * If the API cannot be reached, fall back to
         * the user's system preference.
         */
        setPreference("system");
        setThemeState(getSystemTheme());
      }
    };

    loadUserTheme();
  }, []);

  /*
   * React to login events.
   *
   * This allows the provider to reload the newly
   * authenticated user's appearance if necessary.
   */
  useEffect(() => {
    const handleUsernameChanged = async () => {
      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data: MeResponse = await response.json();

        const savedAppearance =
          data.profile?.appearance;

        if (isThemePreference(savedAppearance)) {
          setPreference(savedAppearance);
          setThemeState(
            resolveTheme(savedAppearance)
          );
        }
      } catch (error) {
        console.error(
          "Unable to reload user appearance:",
          error
        );
      }
    };

    window.addEventListener(
      "username-changed",
      handleUsernameChanged
    );

    return () => {
      window.removeEventListener(
        "username-changed",
        handleUsernameChanged
      );
    };
  }, []);

  /*
   * Follow the operating system when
   * "system" is selected.
   */
  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = (
      event: MediaQueryListEvent
    ) => {
      setThemeState(
        event.matches ? "dark" : "light"
      );
    };

    setThemeState(
      mediaQuery.matches ? "dark" : "light"
    );

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, [preference]);

  /*
   * Change the UI immediately, then persist the
   * preference through the backend.
   */
  const setTheme = (
    newPreference: ThemePreference
  ) => {
    const previousPreference = preference;
    const previousTheme = theme;

    /*
     * Optimistic UI update.
     * The interface changes immediately.
     */
    setPreference(newPreference);
    setThemeState(
      resolveTheme(newPreference)
    );

    const accessToken =
      localStorage.getItem("access_token");

    if (!accessToken) {
      return;
    }

    /*
     * Persist the preference in the background.
     */
    fetch(`${API_URL}/api/auth/me/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: {
          appearance: newPreference,
        },
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.text();

          throw new Error(
            `Failed to save appearance: ${response.status} ${errorData}`
          );
        }
      })
      .catch((error) => {
        console.error(
          "Unable to save appearance:",
          error
        );

        /*
         * Roll back the UI if the backend update fails.
         */
        setPreference(previousPreference);
        setThemeState(previousTheme);
      });
  };

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
    throw new Error(
      "useTheme must be used inside a ThemeProvider"
    );
  }

  return context;
}