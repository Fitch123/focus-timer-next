import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: lifetime } = await supabase
    .from("lifetime_access")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPro = Boolean(
    lifetime || subscription?.status === "active" || profile?.is_pro,
  );

  return (
    <ProfileClient
      profile={{ ...profile, email: user.email }}
      subscription={subscription}
      lifetime={lifetime}
      isPro={isPro}
    />
  );
}
