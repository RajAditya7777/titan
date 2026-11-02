/**
 * Docs pages as data. Every page body is a list of blocks rendered by one component, so all 45
 * pages share the same look and behaviour, and the "On this page" list and the Copy text are derived
 * from the blocks instead of being written by hand.
 *
 * Inline text ("Rich") supports a tiny markup: **bold**, `code`, [label](href). Hrefs starting with
 * "/titan/" are internal (ours); anything else opens in a new tab.
 */
export type Rich = string;

export type Block =
  | { t: "p"; text: Rich }
  | { t: "h2"; text: string; id?: string }
  | { t: "h3"; text: string; id?: string }
  | { t: "list"; ordered?: boolean; items: Rich[] }
  | { t: "steps"; items: Array<{ title: string; body: Rich }> }
  | { t: "table"; head: string[]; rows: Rich[][] }
  | { t: "code"; code: string; lang?: string; title?: string }
  | { t: "codeTabs"; tabs: Array<{ label: string; code: string }> }
  | { t: "callout"; tone?: "info" | "warning" | "success" | "danger"; text: Rich }
  | { t: "cards"; items: Array<{ title: string; body: Rich; href: string }> }
  | { t: "divider" };

export interface DocContent {
  /** Short line under the title (GitBook's page description). */
  lead?: string;
  blocks: Block[];
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const headingId = (b: Extract<Block, { t: "h2" | "h3" }>) => b.id ?? slugify(b.text);

/** "On this page" entries, from the h2/h3 blocks (and step titles, as GitBook lists them). */
export function tocFor(content: DocContent): Array<{ id: string; title: string; depth: 2 | 3 }> {
  const out: Array<{ id: string; title: string; depth: 2 | 3 }> = [];
  for (const b of content.blocks) {
    if (b.t === "h2" || b.t === "h3") out.push({ id: headingId(b), title: b.text, depth: b.t === "h2" ? 2 : 3 });
    if (b.t === "steps") for (const s of b.items) out.push({ id: slugify(s.title), title: s.title, depth: 3 });
  }
  return out;
}

const plain = (r: Rich) => r.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");

/** Markdown for the page's Copy button. */
export function toMarkdown(title: string, content: DocContent): string {
  const lines = [`# ${title}`];
  if (content.lead) lines.push("", content.lead);
  for (const b of content.blocks) {
    lines.push("");
    switch (b.t) {
      case "p":
        lines.push(plain(b.text));
        break;
      case "h2":
        lines.push(`## ${b.text}`);
        break;
      case "h3":
        lines.push(`### ${b.text}`);
        break;
      case "list":
        b.items.forEach((it, i) => lines.push(`${b.ordered ? `${i + 1}.` : "-"} ${plain(it)}`));
        break;
      case "steps":
        b.items.forEach((s, i) => lines.push(`${i + 1}. **${s.title}**: ${plain(s.body)}`));
        break;
      case "table":
        lines.push(`| ${b.head.join(" | ")} |`, `| ${b.head.map(() => "---").join(" | ")} |`, ...b.rows.map((r) => `| ${r.map(plain).join(" | ")} |`));
        break;
      case "code":
        lines.push("```" + (b.lang ?? ""), b.code, "```");
        break;
      case "codeTabs":
        lines.push("```" + (b.tabs[0]?.label ?? ""), b.tabs[0]?.code ?? "", "```");
        break;
      case "callout":
        lines.push(`> ${plain(b.text)}`);
        break;
      case "cards":
        b.items.forEach((c) => lines.push(`- [${c.title}](${c.href}): ${plain(c.body)}`));
        break;
      case "divider":
        lines.push("---");
        break;
    }
  }
  return lines.join("\n");
}
