import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { User, ThemeAppearance } from "../sdk/types";
import { Colors, Radii, Space, Typography } from "../theme";

export interface TaskFloHeaderProps {
  user: User | null;
  activeTabTitle?: string;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export const TaskFloHeader: React.FC<TaskFloHeaderProps> = ({
  user,
  activeTabTitle = "Workspace",
  onNavigateToProfile,
  onNavigateToSettings,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const profile = user?.profile;
  const initials = (
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    "U"
  ).toUpperCase();
  const displayName =
    profile?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    "User";

  return (
    <View style={styles.headerContainer}>
      {/* Brand Title */}
      <View>
        <Text style={styles.brandTitle} accessibilityRole="header">
          TaskFlo
        </Text>
        <Text style={styles.subTitle}>{activeTabTitle}</Text>
      </View>

      {/* User Avatar Action Button */}
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open user menu"
      >
        {profile?.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.initialsText}>{initials}</Text>
        )}
      </TouchableOpacity>

      {/* User Menu Modal (Action Sheet / Dropdown) */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            {/* User Info Header */}
            <View style={styles.userSection}>
              <View style={styles.menuAvatar}>
                {profile?.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.menuInitials}>{initials}</Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userHandle} numberOfLines={1}>
                  @{user?.username || "user"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Navigation Options */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onNavigateToProfile();
              }}
              accessibilityRole="menuitem"
            >
              <Text style={styles.menuItemText}>👤 Profile & Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onNavigateToSettings();
              }}
              accessibilityRole="menuitem"
            >
              <Text style={styles.menuItemText}>⚙ Workspace Settings</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Logout Option */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                setMenuOpen(false);
                onLogout();
              }}
              accessibilityRole="menuitem"
            >
              <Text style={styles.logoutText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryText,
    letterSpacing: -0.5,
  },
  subTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryFocus,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  initialsText: {
    ...Typography.button,
    fontSize: 13,
    color: Colors.primaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: Space.md,
  },
  menuCard: {
    width: 260,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    padding: Space.xs,
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  menuInitials: {
    ...Typography.button,
    color: Colors.primaryText,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  userHandle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Space.xs / 2,
  },
  menuItem: {
    paddingVertical: Space.xs,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.md,
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.text,
  },
  logoutItem: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  logoutText: {
    ...Typography.body,
    color: Colors.errorText,
    fontWeight: "600",
  },
});
