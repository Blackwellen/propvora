import { UserPlus } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "How do I create a Propvora account?",
    a: "Creating your account takes less than five minutes. Go to propvora.com/register, enter your email address and a secure password, then verify your email by clicking the link we send you. Once verified, you'll be prompted to create your first workspace — give it a name (usually your company name or portfolio name). From there you can invite team members and start adding properties.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No credit card is required to start your free trial. You get 7 days of full access to all features on the Pro plan. You'll only be asked for payment details when you decide to continue after your trial period ends. If you don't add a card, your workspace simply moves to read-only mode at the end of the trial.",
  },
  {
    q: "Can I sign up with Google or another social account?",
    a: "Currently Propvora supports email and password sign-in. Google single sign-on (SSO) is on our roadmap. In the meantime, we recommend using a strong unique password and enabling two-factor authentication from Settings → Account → Security.",
  },
  {
    q: "How do I invite team members to my workspace?",
    a: "Go to Settings → Team → Invite Member. Enter your team member's email address and assign them one of three roles: Administrator (full access), Manager (can create and edit records but not change billing or workspace settings), or View Only (read-only access to everything). They'll receive an invitation email with a secure link to set up their own password and join your workspace.",
  },
  {
    q: "Can I have multiple workspaces?",
    a: "Yes. You can create additional workspaces from your account menu. Each workspace is a completely isolated environment with its own data, settings, and team members. Some landlords use separate workspaces for different limited companies, while letting agents use them to separate portfolio management from agency administration.",
  },
  {
    q: "What happens after my trial ends?",
    a: "When your 7-day trial expires, your workspace moves to read-only mode. You can still log in, view all your data, and export it — but you won't be able to add new records or make changes. To restore full access, upgrade to a paid plan in Settings → Billing. Your data is retained for 90 days in read-only mode before any deletion.",
  },
  {
    q: "How do I change my account email or password?",
    a: "Go to Settings → Account → Profile to update your email address. To change your password, go to Settings → Account → Security → Change Password. You'll need to confirm your current password before setting a new one. If you've forgotten your password, use the 'Forgot password' link on the sign-in page and we'll send a reset link to your registered email.",
  },
]

export default function FaqRegistrationSection() {
  return (
    <FaqGroup
      id="registration"
      title="Registration & Sign Up"
      icon={<UserPlus className="w-5 h-5 text-white" />}
      colour="bg-blue-600"
      items={items}
    />
  )
}
