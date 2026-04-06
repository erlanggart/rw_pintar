export default function AppPageHeader({
  eyebrow,
  title,
  description,
  stats = [],
  actions = null,
}) {
  const mobileStatGridClass = stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const statGridClass =
    stats.length === 1
      ? 'md:grid-cols-1'
      : stats.length === 2
        ? 'md:grid-cols-2'
        : stats.length === 4
          ? 'md:grid-cols-2 xl:grid-cols-4'
          : 'md:grid-cols-3';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-[0_28px_72px_-46px_rgba(15,23,42,0.88)]">
      <div className="landing-grid absolute inset-0 opacity-10" />
      <div className="landing-orb landing-orb-sand -right-10 top-10 h-24 w-24" />
      <div className="landing-orb landing-orb-teal -left-6 bottom-4 h-20 w-20" />

      <div className="relative px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            {eyebrow && (
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                {eyebrow}
              </span>
            )}
            <h1 className="font-display mt-3 text-xl leading-tight text-white sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-slate-300 sm:text-sm sm:leading-6">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
              {actions}
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <div className={`mt-4 grid gap-3 ${mobileStatGridClass} ${statGridClass}`}>
            {stats.map((item, index) => (
              <div
                key={`${item.kicker || 'stat'}-${item.value}-${index}`}
                className={`rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur sm:p-4 ${stats.length > 1 && stats.length % 2 === 1 && index === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-[11px]">
                  {item.kicker || 'Ringkasan'}
                </p>
                <p className="font-display mt-1.5 break-words text-lg leading-tight text-white sm:mt-2 sm:text-[28px]">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}