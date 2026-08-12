
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isRegistering) {
        const response = await fetch(`${API_URL}/api/auth/register/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            password_confirm: passwordConfirm,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof data === "object" && data !== null) {
            const messages = Object.entries(data)
              .flatMap(([field, value]) => {
                if (Array.isArray(value)) {
                  return value.map((message) => `${field}: ${message}`);
                }

                return `${field}: ${String(value)}`;
              })
              .join(" ");

            setError(messages || "Unable to create your account.");
          } else {
            setError("Unable to create your account.");
          }

          return;
        }

        // Registration succeeded.
        // Switch back to the login form so the new user can sign in.
        setSuccess(
          "Account created successfully. You can now sign in."
        );

        setIsRegistering(false);
        setPassword("");
        setPasswordConfirm("");
      } else {
        const response = await fetch(`${API_URL}/api/auth/login/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.detail || "Invalid username or password."
          );
          return;
        }

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", username);

        router.push("/dashboard");
      }
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setError("");
    setSuccess("");
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4">

      {/* Login background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/Login.jpeg')" }}
      />

      {/* Image overlay */}
      <div className="absolute inset-0 bg-slate-900/50" />

      {/* Login / Register card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            TaskFlo
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {isRegistering
              ? "Create an account to manage your projects and tasks."
              : "Sign in to manage your projects and tasks."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Email - registration only */}
          {isRegistering && (
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete={
                isRegistering ? "new-password" : "current-password"
              }
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Confirm password - registration only */}
          {isRegistering && (
            <div>
              <label
                htmlFor="passwordConfirm"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>

              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) =>
                  setPasswordConfirm(event.target.value)
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isRegistering
                ? "Creating Account..."
                : "Signing in..."
              : isRegistering
                ? "Create Account"
                : "Sign In"}
          </button>

        </form>

        {/* Switch between login and registration */}
        <div className="mt-6 text-center text-sm text-slate-500">
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-slate-900 hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-slate-900 hover:underline"
              >
                Register
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}






// "use client";

// import { FormEvent, useState } from "react";
// import { useRouter } from "next/navigation";

// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// export default function Home() {
//   const router = useRouter();

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     setLoading(true);
//     setError("");

//     try {
//       const response = await fetch(`${API_URL}/api/auth/login/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           username,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(
//           data.detail || "Invalid username or password."
//         );
//         return;
//       }

//       localStorage.setItem("access_token", data.access);
//       localStorage.setItem("refresh_token", data.refresh);

//       router.push("/dashboard");
//     } catch {
//       setError(
//         "Unable to connect to the server. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//   <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4">

//     {/* Login background */}
//     <div
//       className="absolute inset-0 bg-cover bg-center"
//       style={{ backgroundImage: "url('/images/Login.jpeg')" }}
//     />

//     {/* Image overlay */}
//     <div className="absolute inset-0 bg-slate-900/50" />

//     {/* Login card */}
//     <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-slate-900">
//           TaskFlo
//         </h1>

//         <p className="mt-2 text-sm text-slate-500">
//           Sign in to manage your projects and tasks.
//         </p>
//       </div>

//       {error && (
//         <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//         <form onSubmit={handleSubmit} className="space-y-5">

//           <div>
//             <label
//               htmlFor="username"
//               className="mb-2 block text-sm font-medium text-slate-700"
//             >
//               Username
//             </label>

//             <input
//               id="username"
//               type="text"
//               value={username}
//               onChange={(event) => setUsername(event.target.value)}
//               placeholder="Enter your username"
//               autoComplete="username"
//               required
//               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-medium text-slate-700"
//             >
//               Password
//             </label>

//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               placeholder="Enter your password"
//               autoComplete="current-password"
//               required
//               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>

//         </form>
//       </div>
//     </main>
//   );
// }