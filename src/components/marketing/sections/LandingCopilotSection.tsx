import PremiumProductImage from "../PremiumProductImage"

export default function LandingCopilotSection() {
  return (
    <section className="bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">Human-controlled AI</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">Ask, review, then decide.</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Copilot can summarise portfolio context and prepare draft actions. You remain responsible for review and approval.</p>
        <div className="mt-12 max-w-[1180px]">
          <PremiumProductImage src="/images/marketing/product/enriched/13-copilot-chat.png" alt="Propvora Copilot preparing review-first draft actions using illustrative demo data" />
        </div>
      </div>
    </section>
  )
}
