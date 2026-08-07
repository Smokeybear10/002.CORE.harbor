import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vessel tracking overview",
  description: "AIS vessel positions, activity alerts, saved history, and satellite imagery in one map.",
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
