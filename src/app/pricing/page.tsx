"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";
import type Stripe from "stripe";

interface StripePrice {
  id: string;
  currency: string;
  unit_amount: number | null;
  recurring: { interval: string } | null;
  product: {
    id: string;
    name: string;
    active: boolean;
  };
}

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    fetch("/api/stripe/prices")
      .then((res) => res.json())
      .then((data) => setPrices(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("Failed to load pricing plans. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(price: StripePrice) {
    if (!user) {
      setError("Please sign in before subscribing.");
      return;
    }

    if (checkingOut) return;
    setCheckingOut(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Session expired. Please sign in again.");
        return;
      }

      const type = price.recurring ? "subscription" : "payment";

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: price.id, type }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  function formatPrice(price: StripePrice): string {
    if (price.unit_amount == null) return "Custom pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    }).format(price.unit_amount / 100);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">Upgrade to Pro</h1>
      <p className="mb-8 text-gray-400 text-center max-w-md">
        Unlock premium features, track your progress, and get lifetime access by
        subscribing below.
      </p>

      {error && (
        <div className="mb-6 w-full max-w-sm rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading prices...</p>
      ) : prices.length === 0 ? (
        <p className="text-gray-400">No pricing plans available.</p>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {prices.map((price) => (
            <button
              key={price.id}
              disabled={checkingOut}
              className="w-full px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleCheckout(price)}
            >
              {checkingOut ? (
                "Redirecting..."
              ) : (
                <>
                  {price.product.name} — {formatPrice(price)}
                  {price.recurring && (
                    <span className="text-sm font-normal ml-1 opacity-75">
                      / {price.recurring.interval}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {!user && (
        <p className="mt-4 text-gray-400 text-sm">Sign in to subscribe.</p>
      )}
    </div>
  );
}
