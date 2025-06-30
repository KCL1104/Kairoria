"use client";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import React from "react";

// A simple, full-page loading component.
const GlobalLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    {/* You can use a more sophisticated spinner here */}
    <div className="text-2xl">Loading...</div>
  </div>
);

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuth();

  if (!isInitialized) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
}