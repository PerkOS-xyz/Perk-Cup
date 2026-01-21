"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ParaProvider as Para } from "@getpara/react-sdk";

const queryClient = new QueryClient();

export function ParaProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/para-config")
      .then((res) => res.json())
      .then((data) => setApiKey(data.apiKey || ""))
      .catch(() => setApiKey(""));
  }, []);

  // Still loading or no API key
  if (apiKey === null || apiKey === "") {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Para
        paraClientConfig={{
          apiKey: apiKey,
          environment: "production",
        }}
        config={{
          appName: "Perk Olympics",
        }}
      >
        {children}
      </Para>
    </QueryClientProvider>
  );
}
