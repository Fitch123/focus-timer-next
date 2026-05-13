"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

type Quote = {
  quote: string;
  author: string;
};

export default function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quote?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setQuote(data);
    } catch (err) {
      setQuote({
        quote: "Keep going. You're closer than you think.",
        author: "Fallback",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <Card>
      {/* Icon */}
      <span className="text-2xl mt-0.5">🌤️</span>

      {/* Text */}
      <div>
        {loading && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading...
          </p>
        )}
        {!loading && quote && (
          <>
            <p
              className="text-base font-medium leading-snug"
              style={{ color: "var(--text)" }}
            >
              {quote.quote}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--ring)" }}>
              — {quote.author}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
