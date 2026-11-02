import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import LaunchButton from "@/app/components/LaunchButton";

export default function ProductPage() {
  return (
    <main id="main" className="min-h-screen">
      <SiteNav />

      <section className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-16 pb-12">
        <h1 className="text-4xl font-semibold tracking-tight mb-5">Vessel tracking overview</h1>
        <p className="text-base leading-relaxed text-slate-300 max-w-[640px]">
          Explore received AIS positions, inspect saved vessel history, and review activity alerts.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-[640px]">
          Live coverage follows the map and depends on available AIS receivers. The demo uses simulated traffic.
        </p>
        <LaunchButton className="btn-primary mt-7 min-h-11 px-4 py-2 rounded-md inline-flex items-center text-sm">
          Open map
        </LaunchButton>
      </section>

      <section id="workflow" className="max-w-[1100px] mx-auto px-6 sm:px-8 pb-24">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Using the map</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-md border border-white/10 p-5">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-sm tabular-nums text-slate-400">{index + 1}.</span>
                <h3 className="text-base font-medium text-slate-100">{step.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <SiteFooter />
    </main>
  );
}

const STEPS = [
  {
    title: "Find a vessel",
    body: "Choose an area or pan and zoom the map. Search the loaded vessels by name or MMSI.",
  },
  {
    title: "Inspect its history",
    body: "Select a vessel to view its reported identity, latest position, speed, and saved track.",
  },
  {
    title: "Review alerts",
    body: "Open an alert to inspect the detected signals and risk score alongside the vessel details.",
  },
  {
    title: "Save a report",
    body: "Open the vessel report to review retained positions and alerts. Use Print / PDF to save the displayed records.",
  },
];
