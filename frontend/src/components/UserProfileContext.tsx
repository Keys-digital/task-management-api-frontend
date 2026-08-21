"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { authFetch, API_URL } from "@/lib/api";

export type UserProfileData = {
  full_name: string;
  bio: string;
  avatar: string | null;
  appearance: "system" | "light" | "dark";
  timezone: string;
  language: string;
  date_format: string;
  time_format: string;
  week_start: string;
  default_task_priority: string;
  default_task_view: string;
  default_task_sort: string;
  show_completed_tasks: boolean;
  notify_due_date: boolean;
  notify_overdue: boolean;
  notify_project_activity: boolean;
  notify_email_digest: boolean;
  notify_in_app: boolean;
};

export type UserData = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  profile: UserProfileData;
};

type UserProfileContextType = {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  initials: string;
  avatarUrl: string | null;
  updateUser: (
    data: {
      first_name?: string;
      last_name?: string;
      profile?: Partial<UserProfileData>;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  /** Update local context state without hitting the API.
   * Use when another layer (e.g. ThemeProvider) already owns the API call
   * and you only need context to reflect the confirmed value. */
  patchLocalProfile: (profile: Partial<UserProfileData>) => void;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  removeAvatar: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export function getInitials(
  firstName?: string,
  lastName?: string,
  fullName?: string,
  username?: string
): string {
  const f = firstName?.trim() || "";
  const l = lastName?.trim() || "";
  if (f && l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }

  const full = fullName?.trim() || "";
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return full.charAt(0).toUpperCase();
  }

  if (f) return f.charAt(0).toUpperCase();
  if (l) return l.charAt(0).toUpperCase();

  const u = username?.trim() || "";
  if (u) return u.charAt(0).toUpperCase();

  return "U";
}

export function formatAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanApiUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanApiUrl}${cleanPath}`;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;

    if (!token && !refreshToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch("/api/auth/me/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
        }
        throw new Error(`Failed to load profile (${response.status})`);
      }

      const data: UserData = await response.json();
      setUser(data);
      if (data.username) {
        localStorage.setItem("username", data.username);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const initials = useMemo(() => {
    if (!user) return "U";
    return getInitials(
      user.first_name,
      user.last_name,
      user.profile?.full_name,
      user.username
    );
  }, [user]);

  const avatarUrl = useMemo(() => {
    return formatAvatarUrl(user?.profile?.avatar);
  }, [user?.profile?.avatar]);

  const updateUser = useCallback(
    async (data: {
      first_name?: string;
      last_name?: string;
      profile?: Partial<UserProfileData>;
    }) => {
      const token = localStorage.getItem("access_token");
      if (!token) return { success: false, error: "Not authenticated" };

      // Optimistically update local state
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...(data.first_name !== undefined ? { first_name: data.first_name } : {}),
          ...(data.last_name !== undefined ? { last_name: data.last_name } : {}),
          profile: {
            ...prev.profile,
            ...(data.profile || {}),
          },
        };
      });

      try {
        const response = await authFetch("/api/auth/me/", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg =
            Object.values(errData).flat().join(" ") ||
            `Failed to save (${response.status})`;
          // Re-fetch accurate state
          fetchUserProfile();
          return { success: false, error: errMsg };
        }

        const updated: UserData = await response.json();
        setUser(updated);
        return { success: true };
      } catch (err) {
        fetchUserProfile();
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [fetchUserProfile]
  );

  const patchLocalProfile = useCallback(
    (profile: Partial<UserProfileData>) => {
      setUser((prev) => {
        if (!prev) return null;
        return { ...prev, profile: { ...prev.profile, ...profile } };
      });
    },
    []
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      const token = localStorage.getItem("access_token");
      if (!token) return { success: false, error: "Not authenticated" };

      // Immediate client-side validation
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Please select a valid image file." };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: "Image file size cannot exceed 5MB." };
      }

      // Temporary local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            avatar: localPreviewUrl,
          },
        };
      });

      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const response = await authFetch("/api/auth/me/", {
          method: "PATCH",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg =
            errData.avatar?.[0] ||
            errData.profile?.avatar?.[0] ||
            `Avatar upload failed (${response.status})`;
          fetchUserProfile();
          return { success: false, error: errMsg };
        }

        const updated: UserData = await response.json();
        setUser(updated);
        return { success: true };
      } catch (err) {
        fetchUserProfile();
        return {
          success: false,
          error: err instanceof Error ? err.message : "Upload error",
        };
      }
    },
    [fetchUserProfile]
  );

  const removeAvatar = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return { success: false, error: "Not authenticated" };

    // Optimistically remove avatar
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          avatar: null,
        },
      };
    });

    try {
      const response = await authFetch("/api/auth/me/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remove_avatar: true }),
      });

      if (!response.ok) {
        fetchUserProfile();
        return { success: false, error: "Failed to remove avatar." };
      }

      const updated: UserData = await response.json();
      setUser(updated);
      return { success: true };
    } catch (err) {
      fetchUserProfile();
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  }, [fetchUserProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        user,
        loading,
        error,
        initials,
        avatarUrl,
        updateUser,
        patchLocalProfile,
        uploadAvatar,
        removeAvatar,
        refreshUser: fetchUserProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
