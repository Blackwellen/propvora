"use client"

import React, { useState, type KeyboardEvent } from "react"
import { X, Tag } from "lucide-react"
import type { WizardState } from "./types"
import { InputField, TextareaField } from "./FormPrimitives"

export default function Step2Details({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  const [tagInput, setTagInput] = useState("")

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (state.tags.find((t) => t.label.toLowerCase() === trimmed.toLowerCase())) return
    setState((s) => ({ ...s, tags: [...s.tags, { id: crypto.randomUUID(), label: trimmed }] }))
    setTagInput("")
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag() }
  }

  const removeTag = (id: string) => setState((s) => ({ ...s, tags: s.tags.filter((t) => t.id !== id) }))

  const displayName =
    state.entityType === "organisation"
      ? state.organisationName || "Organisation name"
      : [state.firstName, state.lastName].filter(Boolean).join(" ") || "Full name"

  const errorFor = (field: string) => errors.find((e) => e.toLowerCase().startsWith(field.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Contact Details</h2>
        <p className="text-sm text-slate-500">Enter the basic information for this contact.</p>
      </div>

      {state.entityType === "person" ? (
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="First Name"
            value={state.firstName}
            onChange={(v) => setState((s) => ({ ...s, firstName: v }))}
            required
            placeholder="e.g. Kevin"
            error={errorFor("First name")}
          />
          <InputField
            label="Last Name"
            value={state.lastName}
            onChange={(v) => setState((s) => ({ ...s, lastName: v }))}
            required
            placeholder="e.g. Thompson"
            error={errorFor("Last name")}
          />
          <div className="col-span-2">
            <InputField
              label="Preferred Name"
              value={state.preferredName}
              onChange={(v) => setState((s) => ({ ...s, preferredName: v }))}
              placeholder="Optional nickname or preferred name"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InputField
            label="Organisation Name"
            value={state.organisationName}
            onChange={(v) => setState((s) => ({ ...s, organisationName: v }))}
            required
            placeholder="e.g. Acme Property Services Ltd"
            error={errorFor("Organisation name")}
          />
          <InputField
            label="Primary Contact Name"
            value={state.primaryContactName}
            onChange={(v) => setState((s) => ({ ...s, primaryContactName: v }))}
            placeholder="Main point of contact (optional)"
          />
        </div>
      )}

      <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400 mb-0.5">Display name preview</p>
        <p className="text-sm font-semibold text-slate-800">{displayName}</p>
      </div>

      <TextareaField
        label="Notes"
        value={state.notes}
        onChange={(v) => setState((s) => ({ ...s, notes: v }))}
        placeholder="Any internal notes about this contact…"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {state.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5"
            >
              {tag.label}
              <button type="button" onClick={() => removeTag(tag.id)} aria-label={`Remove tag ${tag.label}`} className="ml-0.5 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addTag}
            aria-label="Add tag"
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Tag className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400">Press Enter or click the tag icon to add</p>
      </div>

    </div>
  )
}
