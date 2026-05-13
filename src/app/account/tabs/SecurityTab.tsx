"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SecurityTab({ profile }: any) {
  const [confirm, setConfirm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email;

    if (!email) {
      console.error("No email found");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("Reset error:", error.message);
      return;
    }

    setResetSent(true);
  };

  const handleDeleteAccount = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    const res = await fetch("/api/delete-account", { method: "DELETE" });

    if (!res.ok) {
      const { error } = await res.json();
      console.error("Delete error:", error);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Security</h2>

      {/* Password */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Password
        </h3>
        <p className="text-sm text-gray-500">
          We'll send a password reset link to {profile?.email}
        </p>
        <button
          onClick={handlePasswordReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          {resetSent ? "Email sent ✓" : "Send Reset Email"}
        </button>
      </div>

      {/* Delete */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">
          Danger Zone
        </h3>
        <p className="text-sm text-gray-500">
          Permanently delete your account and all data.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
        >
          {confirm ? "Click again to confirm deletion" : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
