export const runtime = "nodejs";

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Real Stripe price IDs mapped to plan hierarchy
const planHierarchy: Record<string, number> = {
  price_1T2gkyAmgcW9BNOee4v4K80N: 1, // monthly
  price_1T2gmZAmgcW9BNOegQnPWB2V: 2, // yearly
  price_1T2gn6AmgcW9BNOe3PRBKEhB: 3, // lifetime
};

const priceToStatus: Record<string, "monthly" | "yearly" | "lifetime"> = {
  price_1T2gkyAmgcW9BNOee4v4K80N: "monthly",
  price_1T2gmZAmgcW9BNOegQnPWB2V: "yearly",
  price_1T2gn6AmgcW9BNOe3PRBKEhB: "lifetime",
};

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
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
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
// 1️⃣ CHECKOUT SESSION
////////////////////////////////////////////////////////////////////////////////

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return console.error("No userId in metadata");

  // LIFETIME PAYMENT
  if (session.mode === "payment") {
    const paymentIntentId = session.payment_intent as string;

    await supabase
      .from("lifetime_access")
      .upsert(
        { user_id: userId, stripe_payment_intent_id: paymentIntentId },
        { onConflict: "stripe_payment_intent_id" },
      );

    // Cancel all active subscriptions after lifetime purchase
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"]);

    for (const sub of existingSubs ?? []) {
      if (sub.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch (err) {
          if (
            err instanceof Stripe.errors.StripeError &&
            err.code === "resource_missing"
          ) {
            console.warn(
              `Subscription ${sub.stripe_subscription_id} not found in Stripe`,
            );
          } else {
            throw err;
          }
        }

        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", sub.stripe_subscription_id);
      }
    }

    await supabase
      .from("profiles")
      .update({ is_pro: true, subscription_status: "lifetime" })
      .eq("id", userId);

    return;
  }

  // SUBSCRIPTION SESSION (monthly/yearly)
  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;
    if (!subscriptionId || !customerId) return;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdated(subscription, userId);
  }
}

////////////////////////////////////////////////////////////////////////////////
// 2️⃣ SUBSCRIPTION CREATED / UPDATED
////////////////////////////////////////////////////////////////////////////////

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  knownUserId?: string,
) {
  // Resolve userId from metadata or via stripe_customer_id in profiles
  let userId = knownUserId ?? subscription.metadata?.userId;

  if (!userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .maybeSingle();

    if (!profile) {
      console.error("No profile found for subscription:", subscription.id);
      return;
    }

    userId = profile.id;
  }

  const priceId = subscription.items.data[0]?.price.id;

  // Bug fix: current_period_end is on the subscription, not the item
  const currentPeriodEnd = subscription.items.data[0]?.plan?.interval
    ? new Date((subscription.items.data[0] as any).current_period_end * 1000)
    : null;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  // Check lifetime access
  const { data: lifetime } = await supabase
    .from("lifetime_access")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const hasLifetime = !!lifetime;

  // If user already has lifetime, cancel this subscription immediately
  if (hasLifetime) {
    try {
      await stripe.subscriptions.cancel(subscription.id);
    } catch (err) {
      if (
        err instanceof Stripe.errors.StripeError &&
        err.code === "resource_missing"
      ) {
        console.warn(`Subscription ${subscription.id} not found in Stripe`);
      } else {
        throw err;
      }
    }

    await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("stripe_subscription_id", subscription.id);

    return;
  }

  // Check existing active subscriptions for hierarchy enforcement
  const { data: existingSubs } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_price_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .neq("stripe_subscription_id", subscription.id); // exclude current one

  const subsArray = existingSubs ?? [];
  const newPlanLevel = planHierarchy[priceId!] ?? 0;
  const maxExistingLevel = Math.max(
    0,
    ...subsArray.map((s) => planHierarchy[s.stripe_price_id!] ?? 0),
  );

  // Block duplicate plan purchase
  if (subsArray.find((s) => s.stripe_price_id === priceId)) {
    console.warn("Duplicate subscription attempt blocked for user:", userId);
    return;
  }

  // Block downgrade attempt
  if (newPlanLevel < maxExistingLevel) {
    console.warn("Downgrade attempt blocked for user:", userId);
    return;
  }

  // Upgrade: cancel lower-tier subscriptions
  if (newPlanLevel > maxExistingLevel && subsArray.length > 0) {
    for (const sub of subsArray) {
      if (sub.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch (err) {
          if (
            err instanceof Stripe.errors.StripeError &&
            err.code === "resource_missing"
          ) {
            console.warn(
              `Subscription ${sub.stripe_subscription_id} not found in Stripe`,
            );
          } else {
            throw err;
          }
        }

        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", sub.stripe_subscription_id);
      }
    }
  }

  // Upsert current subscription
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Derive subscription_status from real price ID
  const subscriptionStatus =
    isActive && priceId ? (priceToStatus[priceId] ?? "free") : "free";

  const isPro = subscriptionStatus !== "free";

  if (isPro) {
    await supabase
      .from("profiles")
      .update({
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscriptionStatus,
        is_pro: true,
      })
      .eq("id", userId);
  }

  console.log("Subscription updated:", { userId, subscriptionStatus, isPro });
}

////////////////////////////////////////////////////////////////////////////////
// 3️⃣ SUBSCRIPTION DELETED
////////////////////////////////////////////////////////////////////////////////

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    console.error(
      "No profile found for deleted subscription, customer:",
      customerId,
    );
    return;
  }

  // Check lifetime access from its own table (not a profiles column)
  const { data: lifetime } = await supabase
    .from("lifetime_access")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  const hasLifetime = !!lifetime;

  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  await supabase
    .from("profiles")
    .update({
      subscription_status: hasLifetime ? "lifetime" : "canceled",
      stripe_subscription_id: null,
      is_pro: hasLifetime,
    })
    .eq("id", profile.id);

  console.log("Subscription deleted:", { userId: profile.id, hasLifetime });
}
