import { Brain } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What can the AI Copilot actually do?",
    a: "The AI Copilot is a workspace-contextual assistant that understands your own property data. It can: summarise your portfolio performance (occupancy rates, rent arrears, upcoming renewals), surface compliance risks (certificates expiring in the next 90 days across all properties), draft professional communications such as rent chase letters, tenancy renewal notices, or supplier instructions, analyse deal financials (yield calculations, mortgage stress tests), and answer questions about your own records ('Which properties have no current gas safety certificate?'). What the AI does not do: provide regulated financial advice, legal advice, tax planning, or take any action in your workspace without your explicit confirmation.",
  },
  {
    q: "Is the AI Copilot using my property data to train AI models?",
    a: "No. Your workspace data is never used to train AI models, either by Propvora or by our AI infrastructure partners. Each query is processed in real-time with your relevant workspace context provided for that session only. Data is not retained by the AI provider beyond the duration of the request. Our Data Processing Agreement, available in Settings → Legal, covers this commitment in full.",
  },
  {
    q: "How many AI queries do I get per month?",
    a: "Query allowances by plan: Starter plan includes 20 queries/month, Pro plan includes 100 queries/month, and Business plan includes 500 queries/month. If you exhaust your monthly allowance, you can purchase additional query packs at £15/month per 100 queries from Settings → Billing → AI Add-ons. Allowances reset on your billing date each month. You can see your current usage and remaining queries in the Copilot panel.",
  },
  {
    q: "Does the AI make changes to my workspace automatically?",
    a: "Never. Propvora operates on a strict human-in-the-loop model for all AI-suggested actions. The AI Copilot can suggest actions (e.g. 'Create a job to renew the gas safety certificate at 14 Oak Street'), draft content for you to review, and surface insights — but nothing is written to your workspace until you explicitly click 'Apply' or 'Confirm'. This is by design, not a limitation, and it will not change.",
  },
  {
    q: "Why does Propvora say 'AI does not provide financial or legal advice'?",
    a: "UK financial regulations (FCA) and legal professional rules require a clear distinction between general information and regulated advice. Propvora's AI provides operational intelligence about your own data — for example, it can tell you the gross yield on a specific property based on numbers you've entered, but it will not recommend whether to buy, sell, or remortgage that property. Similarly, it can summarise key dates in a tenancy agreement you've uploaded, but it will not advise on whether a clause is enforceable. Always consult a qualified solicitor or RICS-regulated surveyor for regulated advice.",
  },
  {
    q: "Can the AI read my uploaded documents?",
    a: "Document intelligence is an upcoming feature. When released, it will allow the AI to read uploaded tenancy agreements, gas safety certificates, EICRs, supplier contracts, and other documents to automatically extract and surface key dates, parties, and obligations. For example, it will be able to identify a tenancy renewal date from a PDF agreement and flag it in your compliance calendar. This feature is in development and will be available on Pro and Business plans.",
  },
  {
    q: "What data does the AI Copilot have access to when I query it?",
    a: "The AI only has access to data within your own workspace — your properties, tenancies, contacts, jobs, compliance records, and financial summaries. It cannot access data from other Propvora workspaces. The AI context is scoped to what is necessary to answer your query; it does not send your entire database with every request. Team members using the Copilot are also subject to their own workspace permissions — a View Only user cannot use the AI to access data that their role restricts.",
  },
]

export default function FaqAiSection() {
  return (
    <FaqGroup
      id="ai"
      title="AI & Copilot"
      icon={<Brain className="w-5 h-5 text-white" />}
      colour="bg-purple-600"
      items={items}
    />
  )
}
