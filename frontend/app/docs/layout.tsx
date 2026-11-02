import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API documentation",
  description: "API reference and local setup instructions for vessel positions, activity alerts, and reports.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
