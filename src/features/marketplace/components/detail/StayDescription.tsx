interface StayDescriptionProps {
  description: string | null
  summary: string | null
}

export default function StayDescription({ description, summary }: StayDescriptionProps) {
  return (
    <section className="py-7 border-b border-slate-200">
      {description || summary ? (
        <p className="text-[14.5px] leading-relaxed text-slate-700 whitespace-pre-line">
          {description ?? summary}
        </p>
      ) : (
        <p className="text-[14.5px] leading-relaxed text-slate-500">
          The host hasn&apos;t added a full description yet. Choose your dates to see live pricing and
          reserve your stay.
        </p>
      )}
    </section>
  )
}
