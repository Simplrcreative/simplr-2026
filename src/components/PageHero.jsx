export default function PageHero({ kicker, title, intro, badge }) {
  return (
    <section className="shell pt-16 md:pt-24">
      <div className="surface-card overflow-hidden px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
          <div className="max-w-4xl">
            <p className="eyebrow">{kicker}</p>
            <h1 className="section-title mt-4">{title}</h1>
            <p className="body-copy mt-6 max-w-2xl">{intro}</p>
          </div>
          {badge ? (
            <div className="rounded-[1.5rem] border border-black/8 bg-sand-50/80 p-5 text-sm leading-6 text-coffee">
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}