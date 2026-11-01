import { Container, PageHero } from "@/components/site/blocks";

const SECTIONS = [
  { h: "What this demo is", p: "An independent proof of concept. It is not run by Reflect Money and has no access to Reflect accounts." },
  { h: "No wallet, no account", p: "There is no wallet connection and no sign-up. Balances on the dashboard and portfolio pages are demo data." },
  { h: "Market data", p: "Rates, supply and quotes are fetched by this app's server from Reflect's public API. Your browser doesn't send anything to Reflect directly." },
  { h: "Voice and chat", p: "Voice input uses your browser's built-in speech service; in Chrome and Edge that service sends audio to the browser vendor to transcribe it. If an LLM key is configured, your requests are sent to that provider to plan the companion's reply. This app keeps no transcripts." },
  { h: "Logs", p: "The server logs method, path, status and timing for debugging. Request bodies are not logged." },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="What this demo collects." subtitle="Short version: as little as possible, and nothing about your money." />
      <section className="pb-16">
        <Container>
          <div className="max-w-2xl space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.h}>
                <h2 className="text-[20px] font-medium">{s.h}</h2>
                <p className="mt-2 text-[15.5px] leading-relaxed text-[var(--muted)]">{s.p}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
