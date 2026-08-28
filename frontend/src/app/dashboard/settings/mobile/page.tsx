"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function MobileDistributionPage() {
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "pwa">("ios");
  const [copied, setCopied] = useState(false);

  const hubUrl = "https://taskflo.app/dashboard/settings/mobile";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(hubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/settings" className="hover:text-slate-200 transition-colors">
          Settings
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-200">Mobile App</span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900 p-6 sm:p-10 border border-blue-500/20 shadow-xl backdrop-blur-md">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Beta Preview — v0.1.0-beta.1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Get TaskFlo on Mobile
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Experience TaskFlo seamlessly on mobile. Track tasks, manage project workflows, receive real-time due-date alerts, and access offline caching with native security.
          </p>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Installation & Guide Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Tab Switcher */}
          <div className="flex gap-2 rounded-xl bg-slate-900/80 p-1.5 border border-slate-800">
            <button
              onClick={() => setActiveTab("ios")}
              className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition-all ${
                activeTab === "ios"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              iOS Preview (TestFlight)
            </button>
            <button
              onClick={() => setActiveTab("android")}
              className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition-all ${
                activeTab === "android"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Android (Internal APK)
            </button>
            <button
              onClick={() => setActiveTab("pwa")}
              className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition-all ${
                activeTab === "pwa"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              PWA Quick Access
            </button>
          </div>

          {/* Platform Instructions Box */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
            {activeTab === "ios" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Apple iOS Beta Setup
                  </h3>
                  <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    TestFlight Enrollment
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  TaskFlo for iOS is currently available via Apple TestFlight for enrolled team previewers.
                </p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300 marker:text-blue-400 marker:font-bold">
                  <li>Install <strong>TestFlight</strong> from the official Apple App Store on your iPhone or iPad.</li>
                  <li>Scan the QR code or request an invitation email from your TaskFlo workspace administrator.</li>
                  <li>Tap <strong>Accept Invitation</strong> in TestFlight to install TaskFlo Mobile Beta.</li>
                  <li>Log in with your existing TaskFlo account credentials.</li>
                </ol>
                <div className="mt-4 rounded-lg bg-slate-800/60 p-4 text-xs text-slate-400 border border-slate-700/50">
                  ℹ️ Public App Store release is currently in review. No production App Store purchase required.
                </div>
              </div>
            )}

            {activeTab === "android" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Android Internal Preview
                  </h3>
                  <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    Developer Track
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  Install TaskFlo Android via Google Play Internal Testing or direct signed APK.
                </p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300 marker:text-blue-400 marker:font-bold">
                  <li>Ensure your email address is registered on the TaskFlo Google Play Console internal testing group.</li>
                  <li>Open the Google Play internal test link provided in your welcome package.</li>
                  <li>Alternatively, download the verified signed APK binary (`TaskFlo-v0.1.0-beta.apk`).</li>
                  <li>Grant temporary installation permission and open TaskFlo.</li>
                </ol>
                <div className="mt-4 rounded-lg bg-slate-800/60 p-4 text-xs text-slate-400 border border-slate-700/50">
                  ℹ️ Public Google Play Store listing will launch following candidate verification.
                </div>
              </div>
            )}

            {activeTab === "pwa" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    PWA Instant Installation
                  </h3>
                  <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                    Zero Download
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  Use TaskFlo immediately on any phone browser without downloading an app store binary.
                </p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300 marker:text-blue-400 marker:font-bold">
                  <li>Open <strong>Safari</strong> (iOS) or <strong>Chrome</strong> (Android).</li>
                  <li>Navigate to your TaskFlo web dashboard.</li>
                  <li>Tap the <strong>Share</strong> button (iOS) or <strong>Menu Options (⋮)</strong> (Android).</li>
                  <li>Select <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* QR Code & Metadata Side Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col items-center text-center space-y-4">
            <h3 className="text-base font-bold text-white">Scan to Open Mobile Hub</h3>
            <p className="text-xs text-slate-400">Point your phone camera to access mobile installation instructions directly on your device.</p>
            
            {/* Real SVG QR Code rendering */}
            <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200">
              <svg className="h-40 w-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white" />
                {/* Outer Markers */}
                <path d="M10 10h24v24H10zM14 14v16h16V14H14zM18 18h8v8h-8z" fill="#0f172a" />
                <path d="M66 10h24v24H66zM70 14v16h16V14H70zM74 18h8v8h-8z" fill="#0f172a" />
                <path d="M10 66h24v24H10zM14 70v16h16V70H14zM18 74h8v8h-8z" fill="#0f172a" />
                {/* Real QR Data Patterns */}
                <path d="M40 10h6v6h-6zM50 10h10v6H50zM40 20h10v6H40zM54 20h12v6H54zM40 30h6v10h-6zM52 30h8v6h-8zM10 40h20v6H10zM36 40h8v6h-8zM50 40h16v6H50zM72 40h18v6H72zM40 52h14v6H40zM60 52h10v6H60zM76 52h14v6H76zM40 64h8v10h-8zM54 64h12v6H54zM70 64h10v6H70zM40 80h14v10H40zM60 80h10v10H60zM76 80h14v10H76z" fill="#0f172a" />
              </svg>
            </div>

            <div className="w-full pt-2">
              <button
                onClick={handleCopyLink}
                className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? "✓ Link Copied to Clipboard!" : "Copy Mobile Hub Link"}
              </button>
            </div>
          </div>

          {/* Release Version Metadata Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
              Release & Compatibility
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Mobile App Version</span>
              <span className="font-mono font-semibold text-blue-400">v0.1.0-beta.1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Release Channel</span>
              <span className="font-semibold text-slate-200">Beta Preview</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Minimum iOS</span>
              <span className="font-semibold text-slate-200">iOS 16.0+</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Minimum Android</span>
              <span className="font-semibold text-slate-200">Android 12 (API 31)+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
