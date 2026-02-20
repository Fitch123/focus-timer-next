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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSession(session);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    default:
      console.log("Unhandled event type", event.type);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId) {
    console.error("No userId in metadata");
    return;
  }

  if (session.mode === "payment") {
    // Lifetime purchase
    console.log("Lifetime purchase for:", userId);

    await supabase
      .from("profiles")
      .update({
        lifetime_access: true,
        is_pro: true,
        stripe_customer_id: customerId,
      })
      .eq("id", userId);
  }

  if (session.mode === "subscription") {
    console.log("Subscription checkout for:", userId);

    await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
      })
      .eq("id", userId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  console.log("Subscription status:", subscription.status);

  await supabase
    .from("profiles")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      is_pro: isActive,
    })
    .eq("stripe_customer_id", customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log("Subscription canceled for:", customerId);

  await supabase
    .from("profiles")
    .update({
      subscription_status: "canceled",
      is_pro: false,
    })
    .eq("stripe_customer_id", customerId);
}
