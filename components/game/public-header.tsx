"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/mascot-hero.png"
            alt="Perk"
            width={40}
            height={40}
            className="rounded-full border-2 border-primary"
          />
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Perk Olympics
          </h1>
        </Link>
      </div>
    </header>
  );
}
