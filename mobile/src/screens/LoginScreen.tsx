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

export interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setErrorMsg("Please provide your username and password.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      await onLogin(username.trim(), password);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Invalid username or password.";
      setErrorMsg(message);
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
            {/* Login card — matches web: rounded-2xl bg-white p-8 shadow-2xl */}
            <View style={styles.card}>

              {/* Brand header — matches web: <h1>TaskFlo</h1> */}
              <View style={styles.brandHeader}>
                <Text style={styles.appTitle} accessibilityRole="header">
                  TaskFlo
                </Text>
                <Text style={styles.appSubtitle}>
                  Sign in to manage your projects and tasks.
                </Text>
              </View>

              {/* Error banner */}
              {!!errorMsg && (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>

                {/* Username */}
                <View style={styles.field}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[styles.input, isLoading && styles.inputDisabled]}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    textContentType="username"
                    accessibilityLabel="Username"
                  />
                </View>

                {/* Password */}
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[styles.input, isLoading && styles.inputDisabled]}
                    editable={!isLoading}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    textContentType="password"
                    accessibilityLabel="Password"
                  />
                </View>

                {/* Submit button — matches web: bg-slate-900 rounded-lg */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign In"
                  accessibilityState={{ disabled: isLoading }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

              </View>

              {/* Switch to Register */}
              {onNavigateToRegister && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={onNavigateToRegister}
                    accessibilityRole="button"
                    accessibilityLabel="Create Account"
                  >
                    <Text style={styles.switchLink}>Create Account</Text>
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
    gap: Space.lg,
  },
  field: {
    gap: Space.xs,
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
  inputDisabled: {
    opacity: 0.6,
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
    marginTop: Space.xl,
  },
});
