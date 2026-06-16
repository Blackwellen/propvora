"use client"

import React, { KeyboardEvent } from "react"
import { X } from "lucide-react"
import { FieldLabel, SectionCard } from "./shared"

interface Props {
  register: ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>
  tags: string[]
  tagInput: string
  setTagInput: (v: string) => void
  addTag: (e: KeyboardEvent<HTMLInputElement>) => void
  removeTag: (tag: string) => void
}

export function ContactTagsSection({ register, tags, tagInput, setTagInput, addTag, removeTag }: Props) {
  return (
    <SectionCard title="Tags & Notes">
      <div className="space-y-5">
        <div>
          <FieldLabel optional>Tags</FieldLabel>
          <div className="flex flex-wrap gap-2 min-h-[42px] p-2 rounded-lg border border-slate-200 bg-slate-50 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB] text-xs font-medium">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="hover:text-blue-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              aria-label="Add tags"
              placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
              className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <FieldLabel optional>Notes</FieldLabel>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Any notes about this contact…"
            className="w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </SectionCard>
  )
}
