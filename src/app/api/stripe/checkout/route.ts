export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  console.log("auth header:", req.headers.get("Authorization"));
  try {
    // Derive user server-side from the Authorization header instead of
    // trusting a userId from the client body.
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

    const session = await stripe.checkout.sessions.create({
      mode: type,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId: user.id },
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
