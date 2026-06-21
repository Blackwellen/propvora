"use client"

import React, { useState } from "react"
import { MessageSquare, Trash2, Loader2, Send } from "lucide-react"
import { relativeTime } from "./task-detail-utils"
import {
  useTaskComments,
  useAddTaskComment,
  useDeleteTaskComment,
} from "@/hooks/useTaskCollab"

interface ActivityItem {
  id: string
  text: string
  user: string
  time: string
  initials: string
}

interface TaskLiveCommentsTabProps {
  workspaceId?: string
  taskId: string
  baseActivity: ActivityItem[]
}

export function TaskLiveCommentsTab({ workspaceId, taskId, baseActivity }: TaskLiveCommentsTabProps) {
  const { data: comments = [], isLoading } = useTaskComments(workspaceId, taskId)
  const addComment = useAddTaskComment()
  const deleteComment = useDeleteTaskComment()
  const [body, setBody] = useState("")

  async function handlePost() {
    const text = body.trim()
    if (!text || !workspaceId || addComment.isPending) return
    try {
      await addComment.mutateAsync({ workspaceId, taskId, body: text })
      setBody("")
    } catch { /* disabled state covers it */ }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Comments</h3>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePost() } }}
          rows={3}
          placeholder="Add a comment…  (Ctrl/⌘ + Enter to post)"
          className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePost}
            disabled={!body.trim() || addComment.isPending || !workspaceId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addComment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post Comment
          </button>
        </div>
        {addComment.isError && <p className="text-[11px] text-red-500 mt-2">Couldn&apos;t post your comment. Please try again.</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-slate-900">Activity &amp; Comments</h3>
          {comments.length > 0 && <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{comments.length}</span>}
        </div>
        {isLoading ? (
          <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="group flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  You
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-slate-800">You</span>
                    <span className="text-[10px] text-slate-400 tabular-nums" title={new Date(c.created_at).toLocaleString("en-GB")}>
                      {relativeTime(c.created_at)}{c.edited_at && " · edited"}
                    </span>
                    <button
                      onClick={() => workspaceId && deleteComment.mutate({ workspaceId, taskId, id: c.id })}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-300 hover:text-red-500"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="inline-block max-w-full bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{c.body_md}</p>
                  </div>
                </div>
              </div>
            ))}
            {baseActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-slate-600">{item.user}</span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <div className="inline-block max-w-full bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2">
                    <p className="text-xs text-slate-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-6">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400">No comments yet — start the discussion above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
