import { NextResponse } from "next/server";

export async function GET() {
  // Para's client ID is a publishable client-side key (like Stripe's publishable key)
  // It's designed to be used in the browser and is safe to expose
  return NextResponse.json({
    apiKey: process.env.PARA_CLIENT_ID || "",
  });
}
