"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ParaProvider as Para,
  ParaModal,
  OAuthMethod,
  AuthLayout,
} from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";

const queryClient = new QueryClient();

export function ParaProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/para-config")
      .then((res) => res.json())
      .then((data) => setApiKey(data.apiKey || ""))
      .catch(() => setApiKey(""));
  }, []);

  // Always wrap in QueryClientProvider, but only add Para when we have an API key
  return (
    <QueryClientProvider client={queryClient}>
      {apiKey === null || apiKey === "" ? (
        children
      ) : (
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
          <ParaModal
            authLayout={[AuthLayout.AUTH_FULL]}
            oAuthMethods={[
              OAuthMethod.GOOGLE,
              OAuthMethod.DISCORD,
              OAuthMethod.TWITTER,
              OAuthMethod.APPLE,
            ]}
            disableEmailLogin={false}
            disablePhoneLogin={false}
            theme={{
              foregroundColor: "#E8EBF2",
              backgroundColor: "#0f0f23",
              accentColor: "#8b5cf6",
              darkForegroundColor: "#E8EBF2",
              darkBackgroundColor: "#0f0f23",
              darkAccentColor: "#8b5cf6",
              mode: "dark",
              borderRadius: "md",
              font: "Inter",
            }}
            appName="Perk Olympics"
            recoverySecretStepEnabled={true}
            twoFactorAuthEnabled={false}
          />
        </Para>
      )}
    </QueryClientProvider>
  );
}
