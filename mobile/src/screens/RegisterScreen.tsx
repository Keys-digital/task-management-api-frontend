import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  StatusBar,
} from "react-native";
import { Colors, Space, Radii, Typography } from "../theme";
import { ValidationError, TaskFloError } from "../sdk/client";

export interface RegisterScreenProps {
  onRegister: (
    username: string,
    email: string,
    password: string,
    passwordConfirm: string
  ) => Promise<void>;
  onNavigateToLogin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegister,
  onNavigateToLogin,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const extractFieldErrors = (errorData: Record<string, unknown>): Record<string, string> => {
    const extracted: Record<string, string> = {};
    for (const [key, value] of Object.entries(errorData)) {
      if (Array.isArray(value)) {
        extracted[key] = value.map(String).join(" ");
      } else if (typeof value === "string") {
        extracted[key] = value;
      }
    }
    return extracted;
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};

    if (!username.trim()) {
      errors.username = "Username is required.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    if (!passwordConfirm) {
      errors.password_confirm = "Please confirm your password.";
    } else if (password && passwordConfirm && password !== passwordConfirm) {
      errors.password_confirm = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError("");
      return;
    }

    setFieldErrors({});
    setGeneralError("");
    setIsLoading(true);

    try {
      await onRegister(
        username.trim(),
        email.trim(),
        password,
        passwordConfirm
      );
    } catch (err: unknown) {
      if (err instanceof ValidationError && err.errors) {
        const parsedErrors = extractFieldErrors(err.errors);
        setFieldErrors(parsedErrors);
        const nonField = parsedErrors.non_field_errors || parsedErrors.detail;
        if (nonField) {
          setGeneralError(nonField);
        }
      } else if (err instanceof TaskFloError && err.data) {
        const parsedErrors = extractFieldErrors(err.data as Record<string, unknown>);
        if (Object.keys(parsedErrors).length > 0) {
          setFieldErrors(parsedErrors);
        } else {
          setGeneralError(err.message || "Registration failed. Please check your inputs.");
        }
      } else {
        const message =
          (err as { message?: string })?.message ||
          "Unable to connect to the server. Please try again.";
        setGeneralError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Full-screen background image — Login.jpeg with dark overlay */}
      <ImageBackground
        source={require("../../assets/Login.jpeg")}
        style={styles.background}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        {/* Overlay matching the web app: bg-slate-900/50 */}
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Registration Card */}
            <View style={styles.card}>
              {/* Brand header */}
              <View style={styles.brandHeader}>
                <Text style={styles.appTitle} accessibilityRole="header">
                  TaskFlo
                </Text>
                <Text style={styles.appSubtitle}>
                  Create an account to manage your projects and tasks.
                </Text>
              </View>

              {/* General error banner */}
              {!!generalError && (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text style={styles.errorText}>{generalError}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* Username */}
                <View style={styles.field}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    value={username}
                    onChangeText={(val) => {
                      setUsername(val);
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: "" }));
                      }
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[
                      styles.input,
                      !!fieldErrors.username && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    textContentType="username"
                    accessibilityLabel="Username"
                  />
                  {!!fieldErrors.username && (
                    <Text style={styles.fieldErrorText}>
                      {fieldErrors.username}
                    </Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[
                      styles.input,
                      !!fieldErrors.email && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    textContentType="emailAddress"
                    accessibilityLabel="Email"
                  />
                  {!!fieldErrors.email && (
                    <Text style={styles.fieldErrorText}>
                      {fieldErrors.email}
                    </Text>
                  )}
                </View>

                {/* Password */}
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[
                      styles.input,
                      !!fieldErrors.password && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                    editable={!isLoading}
                    secureTextEntry
                    returnKeyType="next"
                    textContentType="newPassword"
                    accessibilityLabel="Password"
                  />
                  {!!fieldErrors.password && (
                    <Text style={styles.fieldErrorText}>
                      {fieldErrors.password}
                    </Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.field}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    value={passwordConfirm}
                    onChangeText={(val) => {
                      setPasswordConfirm(val);
                      if (fieldErrors.password_confirm) {
                        setFieldErrors((prev) => ({ ...prev, password_confirm: "" }));
                      }
                    }}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[
                      styles.input,
                      !!fieldErrors.password_confirm && styles.inputError,
                      isLoading && styles.inputDisabled,
                    ]}
                    editable={!isLoading}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    textContentType="newPassword"
                    accessibilityLabel="Confirm Password"
                  />
                  {!!fieldErrors.password_confirm && (
                    <Text style={styles.fieldErrorText}>
                      {fieldErrors.password_confirm}
                    </Text>
                  )}
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                  accessibilityState={{ disabled: isLoading }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Switch to Login */}
              {onNavigateToLogin && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={onNavigateToLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Sign In"
                  >
                    <Text style={styles.switchLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Security note */}
              <Text style={styles.securityNote}>
                🔒 Secured with platform Keychain / Keystore token protection.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Space.md,
    paddingVertical: Space["2xl"],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii["2xl"],
    paddingVertical: Space["2xl"],
    paddingHorizontal: Space["2xl"],
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandHeader: {
    marginBottom: Space.lg,
  },
  appTitle: {
    ...Typography.screenTitle,
    color: Colors.text,
    marginBottom: Space.xs,
  },
  appSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    marginBottom: Space.md,
  },
  errorText: {
    color: Colors.errorText,
    ...Typography.bodySmall,
  },
  form: {
    gap: Space.md,
  },
  field: {
    gap: Space.xs / 2,
  },
  label: {
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
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  fieldErrorText: {
    ...Typography.caption,
    color: Colors.errorText,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Space.xs,
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Space.lg,
  },
  switchText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  switchLink: {
    ...Typography.bodySmall,
    color: Colors.primaryText,
    fontWeight: "600",
  },
  securityNote: {
    ...Typography.caption,
    color: Colors.textSubtle,
    textAlign: "center",
    marginTop: Space.lg,
  },
});
