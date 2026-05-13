"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/navigation/Navbar";
import ProfileTab from "./tabs/ProfileTab";
import PreferencesTab from "./tabs/PreferencesTab";
import BillingTab from "./tabs/BillingTab";
import SecurityTab from "./tabs/SecurityTab";

type Tab = "profile" | "preferences" | "billing" | "security";

export default function AccountClient({
  profile,
  subscription,
  lifetime,
  isPro,
}: any) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "profile",
  );
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "preferences", label: "Preferences" },
    { id: "billing", label: "Billing" },
    { id: "security", label: "Security" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <Navbar user={profile} onLogout={handleLogout} onOpenAuth={() => {}} />

      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--text)" }}
        >
          Account
        </h1>

        {/* Tabs */}
        <div
          className="flex gap-1 border-b mb-8"
          style={{ borderColor: "var(--border)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition -mb-px"
              style={{
                borderColor: tab === t.id ? "var(--text)" : "transparent",
                color: tab === t.id ? "var(--text)" : "var(--text)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--card)",
            borderColor: "rgba(0,0,0,0.08)",
          }}
        >
          {tab === "profile" && <ProfileTab profile={profile} />}
          {tab === "preferences" && <PreferencesTab />}
          {tab === "billing" && (
            <BillingTab
              subscription={subscription}
              lifetime={lifetime}
              isPro={isPro}
            />
          )}
          {tab === "security" && <SecurityTab profile={profile} />}
        </div>
      </main>
    </div>
  );
}
