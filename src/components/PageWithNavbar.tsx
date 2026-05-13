"use client";

import Navbar from "@/components/navigation/Navbar";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function PageWithNavbar({ children }: Props) {
  const { user, logout, onOpenAuth } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar always visible */}
      <Navbar user={user} onLogout={logout} onOpenAuth={onOpenAuth} />
      {children}
    </div>
  );
}
