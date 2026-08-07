import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About this project",
  description: "The contributors behind this vessel tracking project.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
