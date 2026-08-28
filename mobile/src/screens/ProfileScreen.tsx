import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { User, DateFormat, TimeFormat, Language } from "../sdk/types";
import { getLanguageLabel } from "../sdk/mappers";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ProfileScreenProps {
  user: User | null;
  onUpdateProfile?: (data: {
    first_name?: string;
    last_name?: string;
    profile?: Partial<User["profile"]>;
  }) => Promise<void>;
  onUploadAvatarUrl?: (url: string) => Promise<void>;
  onRemoveAvatar?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  onLogout: () => void;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Africa/Lagos", label: "Africa/Lagos — West Africa Time (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi — East Africa Time (EAT, UTC+3)" },
  { value: "Africa/Cairo", label: "Africa/Cairo — Eastern European Time (EET, UTC+2)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg — South Africa (SAST, UTC+2)" },
  { value: "America/New_York", label: "America/New_York — Eastern Time (ET)" },
  { value: "America/Chicago", label: "America/Chicago — Central Time (CT)" },
  { value: "America/Denver", label: "America/Denver — Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles — Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo — Brasilia Time (BRT, UTC-3)" },
  { value: "Europe/London", label: "Europe/London — GMT / BST" },
  { value: "Europe/Paris", label: "Europe/Paris — Central European Time (CET)" },
  { value: "Europe/Berlin", label: "Europe/Berlin — Central European Time (CET)" },
  { value: "Europe/Moscow", label: "Europe/Moscow — Moscow Standard Time (MSK, UTC+3)" },
  { value: "Asia/Dubai", label: "Asia/Dubai — Gulf Standard Time (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata — India Standard Time (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore — Singapore Time (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo — Japan Standard Time (JST, UTC+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney — Australian Eastern Time (AET)" },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateProfile,
  onUploadAvatarUrl,
  onRemoveAvatar,
  onDeleteAccount,
  onLogout,
}) => {
  const profile = user?.profile;

  // Personal Info Form State
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");

  // Regional Preferences
  const [timezone, setTimezone] = useState(profile?.timezone || "UTC");
  const [language, setLanguage] = useState<Language>((profile?.language as Language) || "en");
  const [dateFormat, setDateFormat] = useState<DateFormat>(profile?.date_format || "YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(profile?.time_format || "24h");

  // Feedback & Loading
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar Edit Modal State
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarInputUrl, setAvatarInputUrl] = useState("");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setFullName(user.profile?.full_name || "");
      setBio(user.profile?.bio || "");
      setTimezone(user.profile?.timezone || "UTC");
      setLanguage((user.profile?.language as Language) || "en");
      setDateFormat(user.profile?.date_format || "YYYY-MM-DD");
      setTimeFormat(user.profile?.time_format || "24h");
    }
  }, [user]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          profile: {
            full_name: fullName.trim() || null,
            bio: bio.trim() || null,
            timezone,
            language,
            date_format: dateFormat,
            time_format: timeFormat,
          },
        });
        showFeedback("success", "Profile details updated successfully.");
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to update profile.";
      showFeedback("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetAvatarUrl = async () => {
    if (!avatarInputUrl.trim()) return;
    setUpdatingAvatar(true);
    try {
      if (onUploadAvatarUrl) {
        await onUploadAvatarUrl(avatarInputUrl.trim());
        showFeedback("success", "Avatar updated successfully.");
        setAvatarModalVisible(false);
        setAvatarInputUrl("");
      }
    } catch (err: unknown) {
      showFeedback("error", "Failed to update avatar image.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUpdatingAvatar(true);
    try {
      if (onRemoveAvatar) {
        await onRemoveAvatar();
        showFeedback("success", "Avatar removed. Initials restored.");
      }
    } catch (err) {
      showFeedback("error", "Failed to remove avatar.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    if (deleteConfirmText !== user?.username) {
      setDeleteError(`Please type "${user?.username}" exactly to confirm.`);
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (err: unknown) {
      setDeletingAccount(false);
      setDeleteError((err as { message?: string })?.message || "Failed to delete account.");
    }
  };

  const cycleTimezone = () => {
    const curIdx = TIMEZONES.findIndex((t) => t.value === timezone);
    const nextIdx = (curIdx + 1) % TIMEZONES.length;
    setTimezone(TIMEZONES[nextIdx].value);
  };

  const cycleLanguage = () => {
    const langs: Language[] = ["en", "es", "fr", "de"];
    setLanguage(langs[(langs.indexOf(language) + 1) % langs.length]);
  };

  const cycleDateFormat = () => {
    const formats: DateFormat[] = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];
    setDateFormat(formats[(formats.indexOf(dateFormat) + 1) % formats.length]);
  };

  const cycleTimeFormat = () => {
    const formats: TimeFormat[] = ["24h", "12h"];
    setTimeFormat(formats[(formats.indexOf(timeFormat) + 1) % formats.length]);
  };

  const initials = (user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase();
  const displayName =
    fullName ||
    `${firstName} ${lastName}`.trim() ||
    user?.username ||
    "User";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <View style={styles.avatarActions}>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => setAvatarModalVisible(true)}
              disabled={updatingAvatar}
              accessibilityRole="button"
            >
              <Text style={styles.avatarBtnText}>Change Photo</Text>
            </TouchableOpacity>

            {!!profile?.avatar && (
              <TouchableOpacity
                style={styles.removeAvatarBtn}
                onPress={handleRemoveAvatar}
                disabled={updatingAvatar}
                accessibilityRole="button"
              >
                <Text style={styles.removeAvatarText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.userSummary}>
          <Text style={styles.displayName} accessibilityRole="header">
            {displayName}
          </Text>
          <Text style={styles.userMeta}>
            @{user?.username || "user"} · {user?.email || "No email"}
          </Text>
          {user?.date_joined && (
            <Text style={styles.dateJoined}>
              Member since {new Date(user.date_joined).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {/* Global Feedback Banner */}
      {!!feedback && (
        <View
          style={[
            styles.feedbackBanner,
            feedback.type === "success" ? styles.successBanner : styles.errorBanner,
          ]}
          accessibilityRole="alert"
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === "success" ? styles.successText : styles.errorText,
            ]}
          >
            {feedback.text}
          </Text>
        </View>
      )}

      {/* Personal Details Form Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.sectionSubtitle}>
          Update your public identity and profile bio.
        </Text>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfCol]}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={Colors.inputPlaceholder}
              style={styles.input}
              accessibilityLabel="First Name"
            />
          </View>

          <View style={[styles.formGroup, styles.halfCol]}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={Colors.inputPlaceholder}
              style={styles.input}
              accessibilityLabel="Last Name"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Display Name (Full Name)</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Jane Doe"
            placeholderTextColor={Colors.inputPlaceholder}
            style={styles.input}
            accessibilityLabel="Display Name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Write a few words about your role and focus..."
            placeholderTextColor={Colors.inputPlaceholder}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea]}
            accessibilityLabel="Profile Bio"
          />
        </View>
      </View>

      {/* Regional & Timezone Preferences */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Regional Conventions</Text>
        <Text style={styles.sectionSubtitle}>
          Timezone, calendar formatting, and interface language.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Timezone</Text>
          <TouchableOpacity style={styles.selectorRow} onPress={cycleTimezone} accessibilityRole="button">
            <Text style={styles.selectorValue} numberOfLines={1}>
              {TIMEZONES.find((t) => t.value === timezone)?.label || timezone}
            </Text>
            <Text style={styles.cycleHint}>Tap to change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfCol]}>
            <Text style={styles.fieldLabel}>Language</Text>
            <TouchableOpacity style={styles.selectorRow} onPress={cycleLanguage} accessibilityRole="button">
              <Text style={styles.selectorValue}>{getLanguageLabel(language)}</Text>
              <Text style={styles.cycleHint}>Tap</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.formGroup, styles.halfCol]}>
            <Text style={styles.fieldLabel}>Time Format</Text>
            <TouchableOpacity style={styles.selectorRow} onPress={cycleTimeFormat} accessibilityRole="button">
              <Text style={styles.selectorValue}>{timeFormat}</Text>
              <Text style={styles.cycleHint}>Tap</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Date Format</Text>
          <TouchableOpacity style={styles.selectorRow} onPress={cycleDateFormat} accessibilityRole="button">
            <Text style={styles.selectorValue}>{dateFormat}</Text>
            <Text style={styles.cycleHint}>Tap to change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSaveProfile}
        disabled={saving}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={Colors.textInverse} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile Changes</Text>
        )}
      </TouchableOpacity>

      {/* Account Actions & Danger Zone */}
      <View style={styles.dangerSectionCard}>
        <Text style={styles.dangerSectionTitle}>Account Actions</Text>
        <Text style={styles.dangerSectionSubtitle}>
          Session sign-out or irreversible account deletion.
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} accessibilityRole="button">
          <Text style={styles.logoutButtonText}>Sign Out of TaskFlo</Text>
        </TouchableOpacity>

        <View style={styles.dangerDivider} />

        <View style={styles.dangerZoneBox}>
          <Text style={styles.dangerZoneTitle}>Danger Zone: Delete Account</Text>
          <Text style={styles.dangerZoneDesc}>
            Once deleted, your account and all associated projects and tasks are permanently erased.
          </Text>
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() => {
              setDeleteConfirmText("");
              setDeleteError("");
              setDeleteModalVisible(true);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.deleteAccountText}>Delete Account Permanently</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar URL Edit Modal */}
      <Modal visible={avatarModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Profile Picture</Text>
            <Text style={styles.modalSubtitle}>
              Enter a direct image URL for your profile avatar (PNG, JPG, WebP).
            </Text>

            <TextInput
              value={avatarInputUrl}
              onChangeText={setAvatarInputUrl}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor={Colors.inputPlaceholder}
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAvatarModalVisible(false)}
                disabled={updatingAvatar}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, updatingAvatar && styles.disabledButton]}
                onPress={handleSetAvatarUrl}
                disabled={updatingAvatar}
              >
                {updatingAvatar ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Avatar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitleDanger}>Confirm Account Deletion</Text>
            <Text style={styles.modalSubtitle}>
              This action is permanent and cannot be reversed. Please type your username{" "}
              <Text style={styles.boldText}>"{user?.username}"</Text> to confirm:
            </Text>

            {!!deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder={user?.username}
              placeholderTextColor={Colors.inputPlaceholder}
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteBtn,
                  (deleteConfirmText !== user?.username || deletingAccount) && styles.disabledButton,
                ]}
                onPress={handleDeleteAccountSubmit}
                disabled={deleteConfirmText !== user?.username || deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Confirm Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Space.md,
    paddingBottom: Space["3xl"] + 20,
    gap: Space.md,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: Space.md,
    width: "100%",
  },
  avatarSection: {
    alignItems: "center",
    gap: Space.xs,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primaryFocus,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    ...Typography.screenTitle,
    fontSize: 28,
    color: Colors.primaryText,
  },
  avatarActions: {
    flexDirection: "row",
    gap: Space.xs,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  avatarBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    paddingVertical: 4,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.full,
  },
  avatarBtnText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: "600",
  },
  removeAvatarBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.full,
  },
  removeAvatarText: {
    ...Typography.caption,
    color: Colors.errorText,
    fontWeight: "600",
  },
  userSummary: {
    alignItems: "center",
    gap: 2,
    width: "100%",
  },
  displayName: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.text,
  },
  userMeta: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  dateJoined: {
    ...Typography.caption,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  feedbackBanner: {
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    width: "100%",
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  feedbackText: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  successText: {
    color: Colors.successText,
  },
  errorText: {
    color: Colors.errorText,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
    width: "100%",
  },
  sectionTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Space.xs / 2,
    marginBottom: Space.xs / 2,
  },
  row: {
    flexDirection: "row",
    gap: Space.sm,
    width: "100%",
  },
  halfCol: {
    flex: 1,
    minWidth: 0,
  },
  formGroup: {
    gap: Space.xs / 2,
    width: "100%",
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    color: Colors.text,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    ...Typography.body,
    width: "100%",
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    width: "100%",
  },
  selectorValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    minWidth: 0,
  },
  cycleHint: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginLeft: Space.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    width: "100%",
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dangerSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
    width: "100%",
  },
  dangerSectionTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  dangerSectionSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Space.xs / 2,
  },
  logoutButton: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    paddingVertical: Space.sm,
    borderRadius: Radii.lg,
    alignItems: "center",
    marginTop: Space.xs,
    width: "100%",
  },
  logoutButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Space.xs,
    width: "100%",
  },
  dangerZoneBox: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: Radii.lg,
    padding: Space.md,
    gap: Space.xs,
    width: "100%",
  },
  dangerZoneTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.errorText,
  },
  dangerZoneDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  deleteAccountBtn: {
    backgroundColor: Colors.errorDark,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    alignItems: "center",
    marginTop: Space.xs,
    width: "100%",
  },
  deleteAccountText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Space.md,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    width: "92%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
  },
  modalTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  modalTitleDanger: {
    ...Typography.cardTitle,
    color: Colors.errorText,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    color: Colors.text,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    ...Typography.body,
    marginTop: Space.xs,
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Space.sm,
    marginTop: Space.sm,
  },
  modalCancelBtn: {
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
  },
  modalCancelText: {
    ...Typography.button,
    color: Colors.textMuted,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
  },
  modalSaveText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  modalDeleteBtn: {
    backgroundColor: Colors.errorDark,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
  },
  modalDeleteText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});
