import { createClient } from "@supabase/supabase-js";
import ProfileCard from "./ProfileCard";
import RankCard from "./RankCard";
import SubscriptionCard from "./SubscriptionCard";
import AccountActionsCard from "./AccountActionsCard";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Check lifetime
  const { data: lifetime } = await supabase
    .from("lifetime_access")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPro =
    lifetime || subscription?.status === "active" || profile?.is_pro;

  return (
    <div className="max-w-4x1 mx-auto py-10 space-y-6">
      <ProfileCard profile={profile} />
      <RankCard profile={profile} />
      <SubscriptionCard
        subscription={subscription}
        lifetime={lifetime}
        isPro={isPro}
      />
      <AccountActionsCard />
    </div>
  );
}
