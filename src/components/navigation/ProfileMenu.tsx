"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import SettingsModal from "@/components/SettingsModal";

interface ProfileMenuProps {
  user: User | null;
  onLogout: () => void;
  onSave?: (settings: any) => Promise<void>; // ✅ add
}

export default function ProfileMenu({
  user,
  onLogout,
  onSave,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle to handle cases where profile might not exist

      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }

      if (!data) return;

      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    };

    fetchProfile();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block">
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition hover:ring-2"
        style={{ background: "rgba(0,0,0,0.06)" }}
      >
        {user?.user_metadata?.avatar_url || avatarUrl ? (
          <img
            src={avatarUrl || user?.user_metadata?.avatar_url}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            style={{ color: "var(--muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
            />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-60 rounded-xl shadow-xl p-4 animate-fadeIn z-50 border"
          style={{
            background: "var(--card)",
            borderColor: "rgba(0,0,0,0.08)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* Profile Header */}
          <div
            className="flex items-center gap-3 pb-3 border-b"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  style={{ color: "var(--muted)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
                  />
                </svg>
              )}
            </div>

            <div className="flex flex-col">
              <span
                className="text-sm font-medium truncate"
                style={{ color: "var(--text)" }}
              >
                {username ?? user?.email ?? "User"}
              </span>
              <span className="text-xs" style={{ color: "var(--text)" }}>
                Manage your account
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col mt-3 text-sm">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/pricing");
              }}
              className="text-left px-3 py-2 rounded-lg transition mb-1 font-medium"
              style={{ color: "var(--ring)" }}
            >
              ✦ Premium
            </button>

            <button
              onClick={() => {
                setOpen(false);
                router.push("/account");
              }}
              className="text-left px-3 py-2 rounded-lg transition hover:bg-black/5"
              style={{ color: "var(--text)" }}
            >
              Account
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="text-left px-3 py-2 rounded-lg transition hover:bg-red-500/10 mt-1"
              style={{ color: "#ef4444" }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={onSave}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text)" }}
          >
            Settings
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="transition hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-medium" style={{ color: "var(--text)" }}>
              Timer
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Default focus and break duration
            </p>
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text)" }}>
              Focus Mode
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Strict mode and pause behavior
            </p>
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text)" }}>
              Appearance
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Theme preferences
            </p>
          </div>
        </div>
      </SettingsModal>
    </div>
  );
}
