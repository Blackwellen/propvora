import FeaturesHeroSection from "./sections/FeaturesHeroSection"
import FeatureModuleSection from "./sections/FeatureModuleSection"
import FeaturesCta from "./sections/FeaturesCta"
import { getServerLocale, t } from "@/lib/i18n"

export default async function FeaturesPremium() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)

  const sections = [
    {
      eyebrow: tr("feat1Eyebrow"),
      title: tr("feat1Title"),
      copy: tr("feat1Copy"),
      points: [tr("feat1P1"), tr("feat1P2"), tr("feat1P3")],
      images: [["03-property-detail.png", "Property detail"], ["04-unit-detail.png", "Unit detail"], ["05-tenancy.png", "Tenancy detail"]] as const,
    },
    {
      eyebrow: tr("feat2Eyebrow"),
      title: tr("feat2Title"),
      copy: tr("feat2Copy"),
      points: [tr("feat2P1"), tr("feat2P2"), tr("feat2P3")],
      images: [["06-work.png", "Work command centre"], ["07-ppm.png", "PPM schedules"], ["08-calendar.png", "Operational calendar"], ["09-messages.png", "Messages"]] as const,
    },
    {
      eyebrow: tr("feat3Eyebrow"),
      title: tr("feat3Title"),
      copy: tr("feat3Copy"),
      points: [tr("feat3P1"), tr("feat3P2"), tr("feat3P3")],
      images: [["10-money.png", "Money overview"], ["11-invoices.png", "Invoices"]] as const,
    },
    {
      eyebrow: tr("feat4Eyebrow"),
      title: tr("feat4Title"),
      copy: tr("feat4Copy"),
      points: [tr("feat4P1"), tr("feat4P2"), tr("feat4P3")],
      images: [["12-compliance.png", "Compliance control centre"]] as const,
    },
    {
      eyebrow: tr("feat5Eyebrow"),
      title: tr("feat5Title"),
      copy: tr("feat5Copy"),
      points: [tr("feat5P1"), tr("feat5P2"), tr("feat5P3")],
      images: [["14-automation.png", "Automation workspace"], ["13-copilot-chat.png", "Review-first Copilot"]] as const,
    },
    {
      eyebrow: tr("feat6Eyebrow"),
      title: tr("feat6Title"),
      copy: tr("feat6Copy"),
      points: [tr("feat6P1"), tr("feat6P2"), tr("feat6P3")],
      images: [["18-legal.png", "Legal workspace"]] as const,
    },
    {
      eyebrow: tr("feat7Eyebrow"),
      title: tr("feat7Title"),
      copy: tr("feat7Copy"),
      points: [tr("feat7P1"), tr("feat7P2"), tr("feat7P3")],
      images: [["15-landlord-portal.png", "Landlord portal"], ["16-tenant-portal.png", "Tenant portal"], ["17-supplier-portal.png", "Supplier portal"]] as const,
    },
  ]

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
