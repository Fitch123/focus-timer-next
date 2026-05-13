// app/api/quote/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API failed: ${res.status}`);
    }

    const data = await res.json();
    // ZenQuotes devuelve un array: [{ q: "...", a: "..." }]
    const { q, a } = data[0];

    return NextResponse.json({
      quote: q,
      author: a,
    });
  } catch (err) {
    console.error("Quote API error:", err);
    return NextResponse.json({
      quote: "Stay consistent.",
      author: "Fallback",
    });
  }
}
