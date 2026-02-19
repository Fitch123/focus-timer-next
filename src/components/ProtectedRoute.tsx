"use client";

import { useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);

      if (!data.user) {
        router.replace("/login");
      }
    };

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.replace("/login");
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  if (!user) return null; // user will be redirected

  return <>{children}</>;
}
