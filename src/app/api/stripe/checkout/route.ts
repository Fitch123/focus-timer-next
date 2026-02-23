export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔹 Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 🔹 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 🔹 Plan info: name + hierarchy level
const planInfo: Record<string, { name: string; level: number }> = {
  price_1T2gkyAmgcW9BNOee4v4K80N: { name: "Monthly", level: 1 },
  price_1T2gmZAmgcW9BNOegQnPWB2V: { name: "Yearly", level: 2 },
  price_1T2gn6AmgcW9BNOe3PRBKEhB: { name: "Lifetime", level: 3 },
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, type } = await req.json();

    if (!priceId || !type) {
      return NextResponse.json(
        { error: "Missing priceId or type" },
        { status: 400 },
      );
    }

    if (type !== "subscription" && type !== "payment") {
      return NextResponse.json(
        { error: "Invalid type — must be 'subscription' or 'payment'" },
        { status: 400 },
      );
    }

    // 🔹 Fetch user profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isLifetimePlan = type === "payment"; // lifetime
    const isSubscriptionPlan = type === "subscription"; // monthly/yearly

    // 🔹 Lifetime block: cannot buy any plan if already lifetime
    if (userProfile.subscription_status === "lifetime") {
      return NextResponse.json(
        { error: "You already have lifetime access and cannot buy any plan." },
        { status: 400 },
      );
    }

    // 🔹 Fetch all active/trialing subscriptions
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_price_id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"]);

    // 🔹 Map profile subscription_status to hierarchy level
    const profilePlanLevel = (() => {
      switch (userProfile.subscription_status) {
        case "monthly":
          return planInfo["price_1T2gkyAmgcW9BNOee4v4K80N"].level;
        case "yearly":
          return planInfo["price_1T2gmZAmgcW9BNOegQnPWB2V"].level;
        case "lifetime":
          return planInfo["price_1T2gn6AmgcW9BNOe3PRBKEhB"].level;
        default:
          return 0;
      }
    })();

    // 🔹 Subscription checks (duplicate + hierarchy)
    if (isSubscriptionPlan) {
      // 1️⃣ Exact duplicate check
      const duplicateSub = existingSubs?.find(
        (sub) => sub.stripe_price_id === priceId,
      );
      if (duplicateSub) {
        const planName = planInfo[priceId]?.name || "this plan";
        return NextResponse.json(
          { error: `You already have an active subscription for ${planName}.` },
          { status: 400 },
        );
      }

      // 2️⃣ Hierarchy check: include profile subscription
      const newPlanLevel = planInfo[priceId]?.level || 0;
      const maxExistingLevel = Math.max(
        profilePlanLevel,
        ...(existingSubs?.map(
          (sub) => planInfo[sub.stripe_price_id]?.level || 0,
        ) || []),
      );

      if (newPlanLevel < maxExistingLevel) {
        return NextResponse.json(
          {
            error:
              "You already have a higher subscription. Cannot purchase this plan.",
          },
          { status: 400 },
        );
      }
    }

    // 🔹 Auto-cancel old subscriptions if upgrading to lifetime (after purchase completes)
    // ✅ Do NOT cancel subscriptions here to avoid canceling before payment

    // 🔹 Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: type,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId: user.id },

      ...(isSubscriptionPlan && {
        subscription_data: {
          metadata: { userId: user.id },
        },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "An unexpected error occurred";
    console.error("Failed to create checkout session:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
