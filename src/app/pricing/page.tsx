"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import PageWithNavbar from "@/components/PageWithNavbar";

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

const MONTHLY_FEATURES = [
  "Unlimited focus sessions",
  "Advanced analytics",
  "XP & ranking system",
  "Custom timer presets",
  "Strict mode",
];

const YEARLY_FEATURES = [
  "Everything in Monthly",
  "40% savings vs monthly",
  "Priority support",
  "Early access to features",
];

const LIFETIME_FEATURES = [
  "Everything in Yearly",
  "One-time payment",
  "All future updates",
  "Lifetime access",
];

function CheckIcon({ color }: { color?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export default function PricingPage() {
  const supabase = createClient();
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
      .catch(() => setError("Failed to load pricing plans. Please try again."))
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

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: price.id,
          type: price.recurring ? "subscription" : "payment",
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else
        setError(data.error ?? "Failed to start checkout. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  function formatPrice(price: StripePrice): string {
    if (price.unit_amount == null) return "Custom";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    }).format(price.unit_amount / 100);
  }

  const monthlyPrice = prices.find((p) => p.recurring?.interval === "month");
  const yearlyPrice = prices.find((p) => p.recurring?.interval === "year");
  const lifetimePrice = prices.find((p) => !p.recurring);

  const plans = [
    {
      label: "Monthly",
      price: monthlyPrice,
      features: MONTHLY_FEATURES,
      interval: "/month",
      highlighted: false,
      buttonLabel: "Start Monthly",
    },
    {
      label: "Yearly",
      price: yearlyPrice,
      features: YEARLY_FEATURES,
      interval: "/year",
      highlighted: true,
      buttonLabel: "Start Yearly",
      badge: "Best Value",
    },
    {
      label: "Lifetime",
      price: lifetimePrice,
      features: LIFETIME_FEATURES,
      interval: "one-time",
      highlighted: false,
      buttonLabel: "Get Lifetime Access",
    },
  ];

  return (
    <PageWithNavbar>
      <div
        className="min-h-screen py-16 px-6"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ color: "var(--text)" }}
          >
            Pricing plans
          </h1>
          <p className="text-base" style={{ color: "var(--text)" }}>
            Choose the right plan for your focus journey.
          </p>
        </div>

        {error && (
          <div
            className="mb-8 max-w-md mx-auto rounded-xl px-4 py-3 text-sm text-center"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center" style={{ color: "var(--text)" }}>
            Loading plans...
          </p>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {" "}
            {plans.map((plan) => (
              <div
                key={plan.label}
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={{
                  background: "var(--card)",
                  border: plan.highlighted
                    ? "1.5px solid var(--ring)"
                    : "1px solid var(--border)",
                  boxShadow: plan.highlighted
                    ? "0 8px 32px color-mix(in srgb, var(--ring) 20%, transparent)"
                    : "var(--shadow)",
                }}
              >
                {/* Label + badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      background: plan.highlighted
                        ? "color-mix(in srgb, var(--ring) 15%, transparent)"
                        : "rgba(0,0,0,0.06)",
                      color: plan.highlighted ? "var(--ring)" : "var(--text)",
                    }}
                  >
                    {plan.label}
                  </span>
                  {plan.badge && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--ring)", color: "#fff" }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: plan.highlighted
                      ? "color-mix(in srgb, var(--ring) 10%, transparent)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="flex items-end gap-1">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: "var(--text)" }}
                    >
                      {plan.price ? formatPrice(plan.price) : "—"}
                    </span>
                    <span
                      className="text-sm mb-1"
                      style={{ color: "var(--text)" }}
                    >
                      {plan.interval}
                    </span>
                  </div>
                </div>

                {/* Button */}
                <button
                  disabled={checkingOut || !plan.price}
                  onClick={() => plan.price && handleCheckout(plan.price)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: plan.highlighted
                      ? "var(--ring)"
                      : "var(--accent)",
                    color: "#fff",
                    boxShadow: plan.highlighted
                      ? "0 4px 14px color-mix(in srgb, var(--ring) 40%, transparent)"
                      : "none",
                  }}
                >
                  {checkingOut ? "Redirecting..." : plan.buttonLabel}
                </button>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {" "}
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      <CheckIcon
                        color={plan.highlighted ? "var(--ring)" : undefined}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <p
            className="text-center text-sm mt-8"
            style={{ color: "var(--text)" }}
          >
            You need to sign in to subscribe.
          </p>
        )}
      </div>
    </PageWithNavbar>
  );
}
