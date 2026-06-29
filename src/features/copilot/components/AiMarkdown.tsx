"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// ============================================================================
// AiMarkdown — the single, shared renderer for AI/Copilot prose.
//
// The model is instructed to reply in GitHub-flavoured markdown (headings,
// **bold**, bullet/numbered lists, tables, links, code). This component turns
// that into clean, professionally-styled React — so the user never sees raw
// `**asterisks**`, stray `#` or broken paragraphs again.
//
// Safety: raw HTML in the markdown source is NOT rendered (react-markdown
// escapes it by default — no rehype-raw), so there is no XSS surface. Links
// open in a new tab with rel="noopener noreferrer".
//
// Sizing matches the chat bubble (12.5px / relaxed leading). Every element is
// mapped explicitly so spacing stays tight and consistent.
// ============================================================================

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => (
    <p className="text-[12.5px] leading-relaxed text-slate-800 [&:not(:first-child)]:mt-2">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-[650] text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-1.5 ml-0.5 list-disc space-y-1 pl-4 text-[12.5px] leading-relaxed text-slate-800 marker:text-slate-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-1.5 ml-0.5 list-decimal space-y-1 pl-4 text-[12.5px] leading-relaxed text-slate-800 marker:text-slate-400 marker:font-[600]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5 [&>ul]:mt-1 [&>ol]:mt-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1 text-[15px] font-[700] text-slate-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1 text-[13.5px] font-[700] text-slate-900 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-0.5 text-[12.5px] font-[700] uppercase tracking-wide text-slate-500 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-2 mb-0.5 text-[12.5px] font-[700] text-slate-700 first:mt-0">{children}</h4>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-[600] text-[var(--brand)] underline decoration-[var(--brand)]/30 underline-offset-2 hover:decoration-[var(--brand)]"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-200 pl-3 text-[12.5px] italic leading-relaxed text-slate-500">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = (className ?? "").includes("language-")
    if (isBlock) {
      return (
        <code className="block font-mono text-[11.5px] leading-relaxed text-slate-800">{children}</code>
      )
    }
    return (
      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{children}</pre>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-slate-200">{children}</thead>,
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-[600] text-slate-600">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-slate-100 px-2 py-1 align-top text-slate-700">{children}</td>
  ),
}

export default function AiMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
