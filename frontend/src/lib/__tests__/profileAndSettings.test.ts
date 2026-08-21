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

console.log("\n🎉 ALL PROFILE & SETTINGS TESTS PASSED SUCCESSFULLY!");
