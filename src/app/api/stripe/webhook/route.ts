export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role required for webhook
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe signature", { status: 400 });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await handleCheckoutSession(
          stripeEvent.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          stripeEvent.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          stripeEvent.data.object as Stripe.Subscription,
        );
        break;

      default:
        console.log("Unhandled event:", stripeEvent.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}

////////////////////////////////////////////////////////////////////////////////
// 1️⃣ CHECKOUT SESSION (Lifetime + initial subscription metadata)
////////////////////////////////////////////////////////////////////////////////

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("No userId in metadata");
    return;
  }

  // LIFETIME (mode: payment)
  if (session.mode === "payment") {
    const paymentIntentId = session.payment_intent as string;

    await supabase.from("lifetime_access").upsert(
      {
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
      },
      { onConflict: "stripe_payment_intent_id" },
    );

    await supabase.from("profiles").update({ is_pro: true }).eq("id", userId);

    return;
  }

  // SUBSCRIPTION (mode: subscription)
  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!subscriptionId || !customerId) {
      console.error("Missing subscription or customer ID");
      return;
    }

    // 🔥 Save Stripe customer ID to profile
    await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
      })
      .eq("id", userId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await handleSubscriptionUpdated(subscription);
  }
}

////////////////////////////////////////////////////////////////////////////////
// 2️⃣ SUBSCRIPTION CREATED / UPDATED
////////////////////////////////////////////////////////////////////////////////

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  const priceId = subscription.items.data[0]?.price.id;

  const currentPeriodEndUnix = subscription.items.data[0]?.current_period_end;

  const currentPeriodEnd = currentPeriodEndUnix
    ? new Date(currentPeriodEndUnix * 1000)
    : null;

  // Check lifetime
  const { data: lifetime } = await supabase
    .from("lifetime_access")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const hasLifetime = !!lifetime;

  console.log("USER ID FROM METADATA:", userId);

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  console.log("PROFILE EXISTS:", profileCheck);

  // Upsert subscription
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_end: currentPeriodEnd,
      },
      { onConflict: "stripe_subscription_id" },
    )
    .select();

  console.log("SUB UPSERT RESULT:", data);
  console.log("SUB UPSERT ERROR:", error);

  // Update profile
  await supabase
    .from("profiles")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      is_pro: hasLifetime ? true : isActive,
    })
    .eq("id", userId);

  console.log("FULL SUB OBJECT:", subscription);
  console.log("SUB METADATA:", subscription.metadata);
}

////////////////////////////////////////////////////////////////////////////////
// 3️⃣ SUBSCRIPTION DELETED (DOWNGRADE LOGIC)
////////////////////////////////////////////////////////////////////////////////

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, lifetime_access")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    console.error("No profile found for deleted subscription");
    return;
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
    })
    .eq("stripe_subscription_id", subscription.id);

  // Downgrade only if NOT lifetime
  await supabase
    .from("profiles")
    .update({
      subscription_status: "canceled",
      stripe_subscription_id: null,
      is_pro: profile.lifetime_access ? true : false,
    })
    .eq("id", profile.id);
}
