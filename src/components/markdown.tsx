// Tiny markdown renderer (no external deps). Handles: # headings, **bold**, *italic*,
// `code`, ```code blocks```, - lists, 1. ordered lists, > quotes, links, paragraphs.
import { type JSX } from "react";

// Allow only safe URL schemes. javascript:, data:, vbscript:, file: are blocked.
function safeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "#";
  // Relative URLs, anchors, and protocol-relative same-origin are allowed.
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./") || url.startsWith("../")) {
    return url;
  }
  try {
    const parsed = new URL(url, "https://placeholder.local");
    const scheme = parsed.protocol.toLowerCase();
    if (scheme === "http:" || scheme === "https:" || scheme === "mailto:") {
      return url;
    }
    return "#";
  } catch {
    return "#";
  }
}

function inline(text: string): (string | JSX.Element)[] {
  const out: (string | JSX.Element)[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={i++}>{m[2]}</strong>);
    else if (m[4]) out.push(<em key={i++}>{m[4]}</em>);
    else if (m[6]) out.push(<code key={i++} className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">{m[6]}</code>);
    else if (m[7]) out.push(<a key={i++} href={safeUrl(m[8])} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-4">{m[7]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ children }: { children: string }) {
  const lines = children.replace(/\r\n/g, "\n").split("\n");
  const blocks: JSX.Element[] = [];
  let i = 0; let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const buf: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push(<pre key={key++} className="my-4 overflow-x-auto rounded-lg bg-secondary p-4 text-sm text-secondary-foreground"><code>{buf.join("\n")}</code></pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const sizes = ["text-3xl","text-2xl","text-xl","text-lg"];
      const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
      blocks.push(<Tag key={key++} className={`mt-6 mb-3 font-semibold tracking-tight ${sizes[level-1]}`}>{inline(h[2])}</Tag>);
      i++; continue;
    }
    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) { items.push(lines[i].replace(/^-\s+/, "")); i++; }
      blocks.push(<ul key={key++} className="my-3 list-disc space-y-1 pl-6">{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      blocks.push(<ol key={key++} className="my-3 list-decimal space-y-1 pl-6">{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={key++} className="my-4 border-l-4 border-primary/60 pl-4 italic text-muted-foreground">{inline(line.slice(2))}</blockquote>);
      i++; continue;
    }
    if (line.trim() === "") { i++; continue; }
    // Paragraph: gather until blank
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,4}\s+|-\s+|\d+\.\s+|>\s+|```)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push(<p key={key++} className="my-3 leading-7 text-foreground/90">{inline(para.join(" "))}</p>);
  }
  return <div className="prose-like">{blocks}</div>;
}
