"use client"

// ────────────────────────────────────────────────────────────────────────────
// Typed notification emitters
//
// One function per real product event. Each builds a consistent title/body,
// picks a severity, stamps the resource link, and is idempotent (guarded by a
// dedupe key) so re-renders / retries don't double-fire.
//
// Emitters return the underlying createNotification result(s) but callers
// generally fire-and-forget — failures must never break the primary mutation.
// ────────────────────────────────────────────────────────────────────────────

import {
  createNotification,
  alreadyFired,
  type CreateNotificationResult,
} from "./service"

interface BaseCtx {
  workspaceId: string
}

const NOOP: CreateNotificationResult = { ok: false, error: "skipped" }

async function fire(
  key: string,
  fn: () => Promise<CreateNotificationResult>,
): Promise<CreateNotificationResult> {
  if (alreadyFired(key)) return NOOP
  return fn()
}

// ── Work / Tasks ────────────────────────────────────────────────────────────

export function notifyTaskAssigned(ctx: BaseCtx & {
  taskId: string
  assigneeUserId: string
  title: string
  assignedByName?: string
}) {
  if (!ctx.assigneeUserId) return Promise.resolve(NOOP)
  return fire(`task.assigned:${ctx.taskId}:${ctx.assigneeUserId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.assigneeUserId,
      kind: "task.assigned",
      severity: "info",
      title: "Task assigned to you",
      body: ctx.assignedByName
        ? `${ctx.assignedByName} assigned you “${ctx.title}”`
        : `You were assigned “${ctx.title}”`,
      resourceType: "task",
      resourceId: ctx.taskId,
      metadata: { event: "task_assigned" },
    }),
  )
}

export function notifyTaskOverdue(ctx: BaseCtx & {
  taskId: string
  userId: string
  title: string
  dueAt?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`task.overdue:${ctx.taskId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "task.overdue",
      severity: "warning",
      title: "Task overdue",
      body: `“${ctx.title}” is past its due date`,
      resourceType: "task",
      resourceId: ctx.taskId,
      metadata: { event: "task_overdue", due_at: ctx.dueAt ?? null },
    }),
  )
}

// ── Compliance ──────────────────────────────────────────────────────────────

export function notifyComplianceDueSoon(ctx: BaseCtx & {
  itemId: string
  userId: string
  title: string
  dueDate?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`compliance.due_soon:${ctx.itemId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "compliance.due_soon",
      severity: "warning",
      title: "Compliance item due soon",
      body: ctx.dueDate ? `“${ctx.title}” is due ${ctx.dueDate}` : `“${ctx.title}” is due soon`,
      resourceType: "compliance_item",
      resourceId: ctx.itemId,
      metadata: { event: "compliance_due_soon", due_date: ctx.dueDate ?? null },
    }),
  )
}

export function notifyComplianceOverdue(ctx: BaseCtx & {
  itemId: string
  userId: string
  title: string
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`compliance.overdue:${ctx.itemId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "compliance.overdue",
      severity: "danger",
      title: "Compliance item overdue",
      body: `“${ctx.title}” is overdue and needs attention`,
      resourceType: "compliance_item",
      resourceId: ctx.itemId,
      metadata: { event: "compliance_overdue" },
    }),
  )
}

export function notifyLicenceExpiring(ctx: BaseCtx & {
  propertyId: string
  userId: string
  licence: "HMO" | "EPC" | string
  label: string
  expiry?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`licence.expiring:${ctx.propertyId}:${ctx.licence}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "compliance.licence_expiring",
      severity: "warning",
      title: `${ctx.licence} licence expiring`,
      body: ctx.expiry
        ? `${ctx.label} — ${ctx.licence} licence expires ${ctx.expiry}`
        : `${ctx.label} — ${ctx.licence} licence is expiring`,
      resourceType: "property",
      resourceId: ctx.propertyId,
      metadata: { event: "licence_expiring", licence: ctx.licence, expiry: ctx.expiry ?? null },
    }),
  )
}

// ── Portfolio / Tenancy ─────────────────────────────────────────────────────

export function notifyRentOverdue(ctx: BaseCtx & {
  tenancyId: string
  userId: string
  label: string
  amount?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`rent.overdue:${ctx.tenancyId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "rent.overdue",
      severity: "danger",
      title: "Rent overdue",
      body: ctx.amount
        ? `${ctx.label} is in arrears (${ctx.amount})`
        : `${ctx.label} is in arrears`,
      resourceType: "tenancy",
      resourceId: ctx.tenancyId,
      metadata: { event: "rent_overdue", amount: ctx.amount ?? null },
    }),
  )
}

export function notifyTenancyEndingSoon(ctx: BaseCtx & {
  tenancyId: string
  userId: string
  label: string
  endDate?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`tenancy.ending:${ctx.tenancyId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "tenancy.ending_soon",
      severity: "info",
      title: "Tenancy ending soon",
      body: ctx.endDate
        ? `${ctx.label} ends ${ctx.endDate}`
        : `${ctx.label} is approaching its end date`,
      resourceType: "tenancy",
      resourceId: ctx.tenancyId,
      metadata: { event: "tenancy_ending_soon", end_date: ctx.endDate ?? null },
    }),
  )
}

// ── Money ───────────────────────────────────────────────────────────────────

export function notifyBillDue(ctx: BaseCtx & {
  billId: string
  userId: string
  label: string
  dueDate?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`bill.due:${ctx.billId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "bill.due",
      severity: "warning",
      title: "Bill due",
      body: ctx.dueDate ? `${ctx.label} is due ${ctx.dueDate}` : `${ctx.label} is due`,
      resourceType: "bill",
      resourceId: ctx.billId,
      metadata: { event: "bill_due", due_date: ctx.dueDate ?? null },
    }),
  )
}

export function notifyBillApproved(ctx: BaseCtx & {
  billId: string
  userId: string
  label: string
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`bill.approved:${ctx.billId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "bill.approved",
      severity: "success",
      title: "Bill approved",
      body: `${ctx.label} was approved for payment`,
      resourceType: "bill",
      resourceId: ctx.billId,
      metadata: { event: "bill_approved" },
    }),
  )
}

export function notifyInvoicePaid(ctx: BaseCtx & {
  invoiceId: string
  userId: string
  label: string
  amount?: string | null
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`invoice.paid:${ctx.invoiceId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "invoice.paid",
      severity: "success",
      title: "Invoice paid",
      body: ctx.amount
        ? `${ctx.label} was paid (${ctx.amount})`
        : `${ctx.label} was marked as paid`,
      resourceType: "invoice",
      resourceId: ctx.invoiceId,
      metadata: { event: "invoice_paid", amount: ctx.amount ?? null },
    }),
  )
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export function notifyJobCompleted(ctx: BaseCtx & {
  jobId: string
  userId: string
  title: string
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  return fire(`job.completed:${ctx.jobId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "job.completed",
      severity: "success",
      title: "Job completed",
      body: `“${ctx.title}” was marked complete`,
      resourceType: "job",
      resourceId: ctx.jobId,
      metadata: { event: "job_completed" },
    }),
  )
}

// ── Messaging ───────────────────────────────────────────────────────────────

export function notifyMessageReceived(ctx: BaseCtx & {
  conversationId: string
  userId: string
  fromName?: string
  preview?: string
}) {
  if (!ctx.userId) return Promise.resolve(NOOP)
  // Keyed by conversation only (not message id) so a burst collapses to one ping
  // within the dedupe window — avoids notification spam on rapid replies.
  return fire(`message.received:${ctx.conversationId}:${ctx.userId}`, () =>
    createNotification({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      kind: "message.received",
      severity: "info",
      title: ctx.fromName ? `New message from ${ctx.fromName}` : "New message",
      body: ctx.preview ?? "You have a new message",
      resourceType: "conversation",
      resourceId: ctx.conversationId,
      metadata: { event: "message_received" },
    }),
  )
}
