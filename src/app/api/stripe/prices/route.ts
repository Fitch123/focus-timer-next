import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    const activePrices = prices.data.filter(
      (price) =>
        typeof price.product === "object" &&
        (price.product as Stripe.Product).active,
    );

    return NextResponse.json(activePrices, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "An unexpected error occurred";
    console.error("Error fetching prices:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
