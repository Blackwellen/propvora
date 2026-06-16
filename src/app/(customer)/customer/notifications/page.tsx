import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader } from "@/components/customer/ui"
import NotificationsClient from "@/components/customer/NotificationsClient"
import { requireCustomerContext, listCustomerNotifications } from "@/lib/customer"
import { markAllReadAction, markOneReadAction } from "./actions"

export const metadata = { title: "Notifications · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerNotificationsPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const notifications = await listCustomerNotifications(supabase, workspaceId)
  const unread = notifications.filter((n) => !n.read_at).length

  async function markAll() {
    "use server"
    await markAllReadAction()
  }
  async function markOne(id: string) {
    "use server"
    await markOneReadAction(id)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} />

      <CustomerPageHeader
        title="Notifications"
        subtitle="Booking confirmations, payment reminders, check-in alerts, review prompts and new messages — all from real events on your account."
      />

      <NotificationsClient notifications={notifications} markAllAction={markAll} markOneAction={markOne} />
    </div>
  )
}
