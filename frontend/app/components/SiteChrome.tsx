import Link from "next/link";
import LaunchButton from "@/app/components/LaunchButton";

const NAV: { label: string; href: string }[] = [
  { label: "Map", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
];

export function SiteNav({ active, mapHref = "/" }: { active?: string; mapHref?: string }) {
  return (
    <nav className="max-w-[1400px] mx-auto flex items-center px-4 sm:px-8 py-3 gap-3">
      <Link href={mapHref} className="flex min-h-11 items-center gap-2.5 text-slate-200">
        <span className="text-base font-semibold text-slate-100">Vessel tracking</span>
      </Link>
      <div className="ml-auto flex items-center gap-3 sm:gap-6">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.label === "Map" ? mapHref : item.href}
            className={`inline-flex min-h-11 items-center text-[13px] transition-colors ${
              active === item.label ? "text-slate-100" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <LaunchButton href={mapHref} className="btn-primary hidden sm:inline-flex min-h-11 items-center text-[12.5px] px-3.5 py-1.5 rounded-md">
          Open map
        </LaunchButton>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="max-w-[1400px] mx-auto px-8 py-8 border-t border-white/[0.06] flex flex-wrap justify-between gap-4 text-[12px] text-slate-500">
      <div>AIS positions and vessel history</div>
      <div className="font-mono">Built by Thomas Ou</div>
    </footer>
  );
}

export function PageHero({
  eyebrow,
  title,
  gradient,
  body,
  ctaHref = "/dashboard",
  ctaLabel = "Open map",
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  gradient: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="max-w-[1100px] mx-auto px-8 pt-16 pb-12">
      <p className="mb-5 text-sm text-slate-400">
        {eyebrow}
      </p>
      <h1 className="text-[42px] lg:text-[50px] leading-[1.04] tracking-[-0.03em] font-semibold mb-5">
        {title}
        <br />
        <span className="text-slate-300">{gradient}</span>
      </h1>
      <p className="text-[15.5px] leading-[1.55] text-slate-400 max-w-[620px] mb-8">
        {body}
      </p>
      <div className="flex flex-wrap gap-2.5 items-center">
        {ctaHref === "/dashboard" ? (
          <LaunchButton className="btn-primary text-[13px] px-4 py-2 rounded-md inline-flex items-center gap-2">
            {ctaLabel} <span aria-hidden>→</span>
          </LaunchButton>
        ) : (
          <Link href={ctaHref} className="btn-primary text-[13px] px-4 py-2 rounded-md inline-flex items-center gap-2">
            {ctaLabel} <span aria-hidden>→</span>
          </Link>
        )}
        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref} className="btn-secondary text-[13px] px-4 py-2 rounded-md inline-flex items-center gap-2 backdrop-blur">
            {secondaryLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
