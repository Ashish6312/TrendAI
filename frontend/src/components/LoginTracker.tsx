"use client";

import { useLoginTracking } from "@/hooks/useLoginTracking";

export default function LoginTracker() {
  useLoginTracking();
  return null; // This component doesn't render anything
}