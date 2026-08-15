import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page-bg)] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-teal-700">
          404
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It may have been moved or the address may be incorrect.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-block rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}