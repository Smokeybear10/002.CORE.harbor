import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maritime areas",
  description: "Explore ports and waterways, including Los Angeles, the English Channel, Malacca, and the Taiwan Strait.",
};

export default function SectorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
