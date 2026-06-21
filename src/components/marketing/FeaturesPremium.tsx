import FeaturesHeroSection from "./sections/FeaturesHeroSection"
import FeatureModuleSection from "./sections/FeatureModuleSection"
import FeaturesCta from "./sections/FeaturesCta"

const sections = [
  { eyebrow: "Portfolio", title: "A connected operational record.", copy: "Move from portfolio to property, unit and tenancy without losing the financial, compliance or activity context around it.", points: ["Structured property and unit records", "Tenancy timeline and linked documents", "Operational activity in context"], images: [["03-property-detail.png", "Property detail"], ["04-unit-detail.png", "Unit detail"], ["05-tenancy.png", "Tenancy detail"]] },
  { eyebrow: "Work and planning", title: "Coordinate reactive and planned work.", copy: "Prioritise jobs, recurring maintenance, suppliers, schedules and conversations in one operating flow.", points: ["Work queues and ownership", "Planned preventive maintenance", "Calendar and message coordination"], images: [["06-work.png", "Work command centre"], ["07-ppm.png", "PPM schedules"], ["08-calendar.png", "Operational calendar"], ["09-messages.png", "Messages"]] },
  { eyebrow: "Money", title: "See the financial position behind the operation.", copy: "Income, expenses and invoices stay connected to the records and work that created them.", points: ["Portfolio-level money overview", "Invoice status and follow-up", "Traceable operational context"], images: [["10-money.png", "Money overview"], ["11-invoices.png", "Invoices"]] },
  { eyebrow: "Compliance", title: "Make obligations visible before they become urgent.", copy: "Track evidence, renewal dates, ownership and status across the portfolio.", points: ["Expiry and renewal oversight", "Evidence linked to the right asset", "Clear responsibility and audit context"], images: [["12-compliance.png", "Compliance control centre"]] },
  { eyebrow: "Automations", title: "Repeatable workflows, with review built in.", copy: "Use Canvas Lite to prepare and coordinate recurring operational steps while keeping material actions under human control.", points: ["Trigger-based operational recipes", "Visible run status and exceptions", "Human review before consequential actions"], images: [["14-automation.png", "Automation workspace"], ["13-copilot-chat.png", "Review-first Copilot"]] },
  { eyebrow: "Legal readiness", title: "Keep legal work connected to the case record.", copy: "Organise notices, evidence, milestones and next steps without presenting workflow support as legal advice.", points: ["Case and notice preparation", "Evidence and document trail", "Milestones with review checkpoints"], images: [["18-legal.png", "Legal workspace"]] },
  { eyebrow: "Connected portals", title: "A focused workspace for every participant.", copy: "Landlords, tenants and suppliers receive the information and actions relevant to them, using the same coherent Propvora interface.", points: ["Role-specific navigation", "Secure documents and updates", "Consistent work and communication context"], images: [["15-landlord-portal.png", "Landlord portal"], ["16-tenant-portal.png", "Tenant portal"], ["17-supplier-portal.png", "Supplier portal"]] },
] as const

export default function FeaturesPremium() {
  return (
    <>
      <FeaturesHeroSection />
      {sections.map((section, index) => (
        <FeatureModuleSection
          key={section.title}
          eyebrow={section.eyebrow}
          title={section.title}
          copy={section.copy}
          points={section.points}
          images={section.images}
          index={index}
        />
      ))}
      <FeaturesCta />
    </>
  )
}
