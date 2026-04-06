import { FiFilter, FiRotateCcw } from 'react-icons/fi';

export default function WilayahFilterToolbar({
  role,
  desaList = [],
  rwList = [],
  rtList = [],
  selectedDesaId = '',
  selectedRwId = '',
  selectedRtId = '',
  onDesaChange,
  onRwChange,
  onRtChange,
  onReset,
  loadingRtList = false,
  summaryItems = [],
  trailingContent = null,
  emptySummaryLabel = 'Semua wilayah',
}) {
  const showDesa = role === 'superadmin';
  const showRw = role === 'superadmin' || role === 'desa';
  const showRt = role === 'superadmin' || role === 'desa' || role === 'rw';
  const hasInteractiveFilters = showDesa || showRw || showRt;
  const hasResettableFilters = summaryItems.some((item) => item.resettable !== false);

  if (!hasInteractiveFilters && !summaryItems.length && !trailingContent) {
    return null;
  }

  return (
    <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4">
        {(hasInteractiveFilters || trailingContent) && (
          <div className={`grid gap-3 ${trailingContent ? 'xl:grid-cols-[1fr_320px] xl:items-center' : ''}`}>
            {hasInteractiveFilters && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {showDesa && (
                  <select
                    value={selectedDesaId}
                    onChange={(e) => onDesaChange?.(e.target.value)}
                    className="app-select uppercase"
                  >
                    <option value="">Semua desa</option>
                    {desaList.map((desa) => (
                      <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                    ))}
                  </select>
                )}

                {showRw && (
                  <select
                    value={selectedRwId}
                    onChange={(e) => onRwChange?.(e.target.value)}
                    className="app-select uppercase"
                  >
                    <option value="">Semua RW</option>
                    {rwList.map((rw) => (
                      <option key={rw.id} value={rw.id}>RW {rw.nomor_rw} - {rw.nama_desa}</option>
                    ))}
                  </select>
                )}

                {showRt && (
                  <select
                    value={selectedRtId}
                    onChange={(e) => onRtChange?.(e.target.value)}
                    className="app-select uppercase"
                    disabled={loadingRtList}
                  >
                    <option value="">{loadingRtList ? 'Memuat RT...' : 'Semua RT'}</option>
                    {rtList.map((rt) => (
                      <option key={rt.id} value={rt.id}>RT {rt.nomor_rt} / RW {rt.nomor_rw}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {trailingContent ? <div className="w-full">{trailingContent}</div> : null}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <FiFilter size={14} />
            Filter Aktif
          </span>

          {summaryItems.length > 0 ? summaryItems.map((item) => (
            <span key={`${item.label}-${item.value}`} className="app-chip">
              {item.label}: {item.value}
            </span>
          )) : (
            <span className="app-chip">{emptySummaryLabel}</span>
          )}

          {onReset && hasResettableFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
            >
              <FiRotateCcw size={13} />
              Reset Filter
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}