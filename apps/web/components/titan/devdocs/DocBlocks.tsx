import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { headingId, slugify, type Block, type DocContent, type Rich } from "@/lib/products/titan/docs/schema";
import { Code, CodeBlock, CodeTabs, H2, Lead, Steps, Table } from "./blocks";

/** Inline markup → React: **bold**, `code`, [label](href). Internal /titan/ links stay in the app. */
export function RichText({ text }: { text: Rich }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} className="font-semibold text-[#fffff9]">{m[1]}</strong>);
    else if (m[2]) parts.push(<Code key={k++}>{m[2]}</Code>);
    else if (m[3] && m[4]) {
      const internal = m[4].startsWith("/titan/");
      const cls = "text-[#f2d364] underline decoration-[#f2d364]/40 underline-offset-2 hover:decoration-[#f2d364]";
      parts.push(
        internal ? (
          <Link key={k++} href={m[4]} className={cls}>
            {m[3]}
          </Link>
        ) : (
          <a key={k++} href={m[4]} target="_blank" rel="noreferrer" className={cls}>
            {m[3]} ↗
          </a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const TONE = {
  info: { icon: Info, cls: "border-[#3d392e] text-[#f2d364]" },
  success: { icon: CheckCircle2, cls: "border-[#00d692]/30 text-[#00d692]" },
  warning: { icon: AlertTriangle, cls: "border-[#f2b84b]/30 text-[#f2b84b]" },
  danger: { icon: OctagonAlert, cls: "border-[#f34f6a]/30 text-[#f34f6a]" },
} as const;

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return (
        <p className="mt-5 text-base leading-[26px] text-[#fffff9]/85">
          <RichText text={b.text} />
        </p>
      );
    case "h2":
      return <H2 id={headingId(b)}>{b.text}</H2>;
    case "h3":
      return (
        <h3 id={headingId(b)} className="scroll-mt-20 pt-6 text-xl font-semibold leading-[29px] text-[#fffff9]">
          {b.text}
        </h3>
      );
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L className={`mt-4 space-y-1.5 pl-6 text-base leading-[26px] text-[#fffff9]/85 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-[#8b8575]`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <RichText text={it} />
            </li>
          ))}
        </L>
      );
    }
    case "steps":
      return <Steps steps={b.items.map((s) => ({ id: slugify(s.title), title: s.title, body: <RichText text={s.body} /> }))} />;
    case "table":
      return <Table head={b.head} rows={b.rows.map((r) => r.map((c, i) => <RichText key={i} text={c} />))} />;
    case "code":
      return <CodeBlock code={b.code} />;
    case "codeTabs":
      return <CodeTabs tabs={b.tabs} />;
    case "callout": {
      const tone = TONE[b.tone ?? "info"];
      const Icon = tone.icon;
      return (
        <div className={`mt-6 flex gap-3 rounded-xl border bg-[#232220] px-4 py-3 text-sm leading-6 ${tone.cls}`}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[#fffff9]/85">
            <RichText text={b.text} />
          </div>
        </div>
      );
    }
    case "cards":
      return (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {b.items.map((c) => {
            const inner = (
              <>
                <p className="font-medium text-[#fffff9]">{c.title}</p>
                <p className="mt-1 text-sm text-[#c7c0a9]">
                  <RichText text={c.body} />
                </p>
              </>
            );
            const cls = "block rounded-xl border border-[#3d392e] p-4 transition hover:border-[#f2d364]/60 hover:bg-white/[0.02]";
            return c.href.startsWith("/titan/") ? (
              <Link key={c.title} href={c.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className={cls}>
                {inner}
              </a>
            );
          })}
        </div>
      );
    case "divider":
      return <hr className="mt-8 border-[#3d392e]" />;
  }
}

export function DocBlocks({ content }: { content: DocContent }) {
  return (
    <>
      {content.lead && <Lead>{content.lead}</Lead>}
      {content.blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </>
  );
}
