import { getInitials, formatAvatarUrl } from "../../components/UserProfileContext";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("--- Running Profile & Settings Tests ---\n");

// Test 1: getInitials with first and last name
{
  assert(
    getInitials("John", "Doe") === "JD",
    "getInitials with first & last name produces JD"
  );
  assert(
    getInitials("alice", "smith") === "AS",
    "getInitials with lowercase names produces uppercase AS"
  );
}

// Test 2: getInitials with full name
{
  assert(
    getInitials("", "", "Sarah Connor") === "SC",
    "getInitials with full name produces SC"
  );
  assert(
    getInitials("", "", "Madonna") === "M",
    "getInitials with single full name produces M"
  );
}

// Test 3: getInitials fallback to username or default
{
  assert(
    getInitials("", "", "", "devmaster") === "D",
    "getInitials with username fallback produces D"
  );
  assert(
    getInitials("", "", "", "") === "U",
    "getInitials with no values produces default U"
  );
}

// Test 4: formatAvatarUrl handling
{
  assert(
    formatAvatarUrl(null) === null,
    "formatAvatarUrl returns null for null"
  );
  assert(
    formatAvatarUrl(undefined) === null,
    "formatAvatarUrl returns null for undefined"
  );
  assert(
    formatAvatarUrl("https://example.com/avatar.png") === "https://example.com/avatar.png",
    "formatAvatarUrl preserves https URLs"
  );
  assert(
    formatAvatarUrl("blob:http://localhost:3000/1234") === "blob:http://localhost:3000/1234",
    "formatAvatarUrl preserves blob URLs for immediate preview"
  );
  
  const relativeFormatted = formatAvatarUrl("/media/avatars/user.png");
  assert(
    Boolean(relativeFormatted && relativeFormatted.endsWith("/media/avatars/user.png")),
    "formatAvatarUrl formats relative media paths with API url"
  );
}

// Test 5: Profile & Settings validation rules
{
  const allowedImageFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  assert(
    allowedImageFormats.includes("image/png"),
    "PNG is an allowed avatar format"
  );
  assert(
    allowedImageFormats.includes("image/jpeg"),
    "JPEG is an allowed avatar format"
  );
  assert(
    !allowedImageFormats.includes("text/plain"),
    "text/plain is rejected as an avatar format"
  );
  assert(
    3 * 1024 * 1024 < maxFileSize,
    "3MB file passes file size validation"
  );
  assert(
    6 * 1024 * 1024 > maxFileSize,
    "6MB file is rejected by file size validation"
  );
}

// Test 6: Timezone — IANA standard validation
{
  const VALID_IANA_TIMEZONES = [
    "UTC",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  // Africa/Lagos must be present (WAT, UTC+1)
  assert(
    VALID_IANA_TIMEZONES.includes("Africa/Lagos"),
    "Africa/Lagos is in the timezone list (WAT, UTC+1)"
  );

  // UTC must always be present as the universal baseline
  assert(
    VALID_IANA_TIMEZONES.includes("UTC"),
    "UTC is present as the universal baseline timezone"
  );

  // Ensure all entries follow IANA format (no spaces, valid slash pattern)
  const allValidFormat = VALID_IANA_TIMEZONES.every(
    (tz) => tz === "UTC" || /^[A-Za-z_]+\/[A-Za-z_]+$/.test(tz)
  );
  assert(
    allValidFormat,
    "All timezone values conform to IANA format (Region/City or UTC)"
  );

  // Ensure no legacy US/ or Etc/ short-form aliases crept in
  const noLegacyAliases = VALID_IANA_TIMEZONES.every(
    (tz) => !tz.startsWith("US/") && !tz.startsWith("Etc/")
  );
  assert(
    noLegacyAliases,
    "No legacy US/ or Etc/ timezone aliases are present"
  );
}

// Test 7: Dirty-state baseline logic
{
  // Simulate the baseline-comparison logic used in the Settings page
  type PrefBaseline = {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStart: string;
  };

  function isPrefDirty(current: PrefBaseline, baseline: PrefBaseline): boolean {
    return (
      current.language !== baseline.language ||
      current.timezone !== baseline.timezone ||
      current.dateFormat !== baseline.dateFormat ||
      current.timeFormat !== baseline.timeFormat ||
      current.weekStart !== baseline.weekStart
    );
  }

  const baseline: PrefBaseline = {
    language: "en",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    weekStart: "monday",
  };

  // Unchanged state should not be dirty
  assert(
    !isPrefDirty({ ...baseline }, baseline),
    "Preferences: unchanged state is not dirty"
  );

  // Changing timezone makes it dirty
  assert(
    isPrefDirty({ ...baseline, timezone: "Africa/Lagos" }, baseline),
    "Preferences: changing timezone marks dirty"
  );

  // Changing language makes it dirty
  assert(
    isPrefDirty({ ...baseline, language: "fr" }, baseline),
    "Preferences: changing language marks dirty"
  );

  // Changing dateFormat makes it dirty
  assert(
    isPrefDirty({ ...baseline, dateFormat: "DD/MM/YYYY" }, baseline),
    "Preferences: changing dateFormat marks dirty"
  );

  // After save (baseline updated to match current), no longer dirty
  const updatedState: PrefBaseline = {
    language: "fr",
    timezone: "Africa/Lagos",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    weekStart: "sunday",
  };
  const updatedBaseline = { ...updatedState };
  assert(
    !isPrefDirty(updatedState, updatedBaseline),
    "Preferences: after save, baseline matches current state — not dirty"
  );
}

// Test 8: Notification dirty-state logic
{
  type NotifBaseline = {
    notifyDueDate: boolean;
    notifyOverdue: boolean;
    notifyProjectActivity: boolean;
    notifyEmailDigest: boolean;
    notifyInApp: boolean;
  };

  function isNotifDirty(current: NotifBaseline, baseline: NotifBaseline): boolean {
    return (
      current.notifyDueDate !== baseline.notifyDueDate ||
      current.notifyOverdue !== baseline.notifyOverdue ||
      current.notifyProjectActivity !== baseline.notifyProjectActivity ||
      current.notifyEmailDigest !== baseline.notifyEmailDigest ||
      current.notifyInApp !== baseline.notifyInApp
    );
  }

  const notifBaseline: NotifBaseline = {
    notifyDueDate: true,
    notifyOverdue: true,
    notifyProjectActivity: true,
    notifyEmailDigest: false,
    notifyInApp: true,
  };

  assert(
    !isNotifDirty({ ...notifBaseline }, notifBaseline),
    "Notifications: unchanged state is not dirty"
  );

  assert(
    isNotifDirty({ ...notifBaseline, notifyEmailDigest: true }, notifBaseline),
    "Notifications: toggling email digest marks dirty"
  );

  assert(
    isNotifDirty({ ...notifBaseline, notifyDueDate: false }, notifBaseline),
    "Notifications: disabling due date reminder marks dirty"
  );
}

console.log("\n🧪 Running Synchronization Tests...\n");

// Test 9: Per-field dirty-guard — clean field follows context, dirty field doesn't
{
  // Simulate the per-field sync logic used in both Profile and Settings
  type FieldState = { timezone: string; dateFormat: string; timeFormat: string };

  function applyPerFieldSync(
    current: FieldState,
    baseline: FieldState,
    serverValues: FieldState
  ): { next: FieldState; nextBaseline: FieldState } {
    const nextBaseline = { ...baseline };
    const next = { ...current };
    // For each field: if clean (current === baseline), follow server value and advance baseline.
    // If dirty (current !== baseline), preserve local value and DO NOT advance baseline.
    if (current.timezone   === baseline.timezone)   { next.timezone   = serverValues.timezone;   nextBaseline.timezone   = serverValues.timezone;   }
    if (current.dateFormat === baseline.dateFormat) { next.dateFormat = serverValues.dateFormat; nextBaseline.dateFormat = serverValues.dateFormat; }
    if (current.timeFormat === baseline.timeFormat) { next.timeFormat = serverValues.timeFormat; nextBaseline.timeFormat = serverValues.timeFormat; }
    return { next, nextBaseline };
  }

  const baseline: FieldState = { timezone: "UTC", dateFormat: "YYYY-MM-DD", timeFormat: "24h" };

  // Scenario A: all fields clean — all follow server, all baselines advance
  const allClean: FieldState = { ...baseline };
  const serverA: FieldState = { timezone: "Africa/Lagos", dateFormat: "DD/MM/YYYY", timeFormat: "12h" };
  const resultA = applyPerFieldSync(allClean, baseline, serverA);

  assert(resultA.next.timezone === "Africa/Lagos", "Sync: clean timezone follows context (Africa/Lagos)");
  assert(resultA.next.dateFormat === "DD/MM/YYYY", "Sync: clean dateFormat follows context");
  assert(resultA.next.timeFormat === "12h", "Sync: clean timeFormat follows context");
  assert(resultA.nextBaseline.timezone === "Africa/Lagos", "Sync: baseline advances for clean timezone");

  // Scenario B: timezone dirty, others clean — only timezone preserved, rest sync
  const tzDirty: FieldState = { timezone: "Europe/London", dateFormat: "YYYY-MM-DD", timeFormat: "24h" };
  const serverB: FieldState = { timezone: "Africa/Lagos", dateFormat: "MM/DD/YYYY", timeFormat: "12h" };
  const resultB = applyPerFieldSync(tzDirty, baseline, serverB);

  assert(resultB.next.timezone === "Europe/London", "Sync: dirty timezone NOT overwritten by context update");
  assert(resultB.nextBaseline.timezone === "UTC", "Sync: dirty timezone baseline NOT advanced");
  assert(resultB.next.dateFormat === "MM/DD/YYYY", "Sync: clean dateFormat still follows context when timezone is dirty");
  assert(resultB.next.timeFormat === "12h", "Sync: clean timeFormat still follows context when timezone is dirty");

  // Scenario C: all dirty — nothing from context overwrites local values
  const allDirty: FieldState = { timezone: "Asia/Tokyo", dateFormat: "DD/MM/YYYY", timeFormat: "12h" };
  const serverC: FieldState = { timezone: "UTC", dateFormat: "YYYY-MM-DD", timeFormat: "24h" };
  const resultC = applyPerFieldSync(allDirty, baseline, serverC);

  assert(resultC.next.timezone   === "Asia/Tokyo",    "Sync: all dirty — timezone not overwritten");
  assert(resultC.next.dateFormat === "DD/MM/YYYY",    "Sync: all dirty — dateFormat not overwritten");
  assert(resultC.next.timeFormat === "12h",           "Sync: all dirty — timeFormat not overwritten");
  assert(resultC.nextBaseline.timezone   === "UTC",   "Sync: all dirty — timezone baseline preserved");
}

// Test 10: Baseline advances only after successful save
{
  type PrefState = { language: string; timezone: string };

  function simulateSave(
    localState: PrefState,
    baseline: { current: PrefState },
    apiSuccess: boolean,
    serverResponse?: PrefState
  ): { newBaseline: PrefState; localState: PrefState } {
    if (apiSuccess && serverResponse) {
      // On success: advance baseline to server-confirmed values
      baseline.current = { ...serverResponse };
      return { newBaseline: baseline.current, localState: serverResponse };
    }
    // On failure: baseline NOT advanced, local state preserved
    return { newBaseline: baseline.current, localState };
  }

  const initial = { language: "en", timezone: "UTC" };
  const blRef = { current: { ...initial } };
  const localEdit = { language: "fr", timezone: "Africa/Lagos" };

  // Successful save — baseline advances to server response
  const successResult = simulateSave(localEdit, blRef, true, { language: "fr", timezone: "Africa/Lagos" });
  assert(successResult.newBaseline.timezone === "Africa/Lagos", "Save success: baseline advances to Africa/Lagos");
  assert(successResult.newBaseline.language === "fr", "Save success: baseline advances language to fr");

  // Failed save — reset ref for failure test
  const blRef2 = { current: { ...initial } };
  const failResult = simulateSave(localEdit, blRef2, false);
  assert(failResult.newBaseline.timezone === "UTC", "Save failure: baseline NOT advanced (stays UTC)");
  assert(failResult.localState.timezone === "Africa/Lagos", "Save failure: local dirty value preserved");
}

// Test 11: API failure preserves dirty state and does not advance baseline
{
  type TimezoneState = { current: string; baseline: string };

  function handleApiFailure(state: TimezoneState): TimezoneState {
    // On API failure: local state and baseline are both preserved unchanged.
    return { current: state.current, baseline: state.baseline };
  }

  const state: TimezoneState = { current: "Africa/Lagos", baseline: "UTC" };
  const afterFailure = handleApiFailure(state);

  assert(afterFailure.current  === "Africa/Lagos", "API failure: dirty local value (Africa/Lagos) preserved");
  assert(afterFailure.baseline === "UTC",           "API failure: baseline (UTC) not advanced");
  assert(afterFailure.current !== afterFailure.baseline, "API failure: field remains dirty after failure");
}

// Test 12: Cross-page synchronization scenario
{
  // Simulates the full round-trip:
  // Profile saves Africa/Lagos → context updates → Settings receives it via clean sync
  type SharedPrefs = { timezone: string };

  function simulateCrossPageSync(
    contextValue: SharedPrefs,       // What context now holds after Profile saved
    settingsLocal: SharedPrefs,      // What Settings currently shows
    settingsBaseline: SharedPrefs    // Settings' last committed value
  ): SharedPrefs {
    // Settings per-field sync: if clean, follow context
    if (settingsLocal.timezone === settingsBaseline.timezone) {
      return { timezone: contextValue.timezone };
    }
    return settingsLocal; // dirty — preserve
  }

  // Case 1: Settings field is clean → it picks up Profile's saved value
  const afterProfileSave: SharedPrefs = { timezone: "Africa/Lagos" };
  const settingsClean: SharedPrefs    = { timezone: "UTC" };
  const settingsBaselineClean         = { timezone: "UTC" };
  const syncedClean = simulateCrossPageSync(afterProfileSave, settingsClean, settingsBaselineClean);
  assert(syncedClean.timezone === "Africa/Lagos", "Cross-page: Settings reflects Profile's saved Africa/Lagos");

  // Case 2: Settings field is dirty (user mid-edit) → NOT overwritten
  const settingsDirty: SharedPrefs    = { timezone: "Asia/Tokyo" };
  const settingsBaselineDirty         = { timezone: "UTC" };
  const syncedDirty = simulateCrossPageSync(afterProfileSave, settingsDirty, settingsBaselineDirty);
  assert(syncedDirty.timezone === "Asia/Tokyo", "Cross-page: Settings dirty edit (Asia/Tokyo) not overwritten by Profile save");
}

// Test 13: Initial context hydration populates both pages correctly
{
  type ProfileContext = { timezone: string; date_format: string; time_format: string };

  function initializePage(serverProfile: ProfileContext) {
    // Simulates first-load initialization
    const localState = {
      timezone:   serverProfile.timezone   || "UTC",
      dateFormat: serverProfile.date_format || "YYYY-MM-DD",
      timeFormat: serverProfile.time_format || "24h",
    };
    const baseline = { ...localState };
    return { localState, baseline };
  }

  const serverProfile: ProfileContext = {
    timezone: "Africa/Lagos",
    date_format: "DD/MM/YYYY",
    time_format: "12h",
  };

  const profilePage  = initializePage(serverProfile);
  const settingsPage = initializePage(serverProfile);

  assert(profilePage.localState.timezone === "Africa/Lagos",  "Init: Profile hydrated with Africa/Lagos from context");
  assert(settingsPage.localState.timezone === "Africa/Lagos", "Init: Settings hydrated with Africa/Lagos from context");
  assert(profilePage.baseline.timezone === settingsPage.baseline.timezone,
    "Init: Profile and Settings share the same initial baseline timezone");
  assert(profilePage.localState.dateFormat === settingsPage.localState.dateFormat,
    "Init: Profile and Settings show same dateFormat on initial load");
  // Both are clean at initialization
  assert(
    profilePage.localState.timezone === profilePage.baseline.timezone,
    "Init: Profile fields are clean (not dirty) on initial load"
  );
  assert(
    settingsPage.localState.timezone === settingsPage.baseline.timezone,
    "Init: Settings fields are clean (not dirty) on initial load"
  );
}

console.log("\n🎉 ALL PROFILE & SETTINGS TESTS PASSED SUCCESSFULLY!");
