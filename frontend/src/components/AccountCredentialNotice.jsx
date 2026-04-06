import { FiKey, FiShield, FiUser, FiX } from 'react-icons/fi';

export default function AccountCredentialNotice({
  account,
  title = 'Kredensial akun berhasil disiapkan',
  description = 'Simpan informasi ini untuk login pertama. Password akan tetap sama sampai diubah atau direset kembali.',
  onClose,
}) {
  if (!account) {
    return null;
  }

  return (
    <section className="app-panel border border-amber-200/80 bg-amber-50/80">
      <div className="app-panel-header gap-4 border-amber-200/80">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <FiShield size={18} />
          </div>
          <div>
            <h3 className="app-panel-title">{title}</h3>
            <p className="app-panel-description text-slate-600">{description}</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="app-icon-button" title="Tutup informasi akun">
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="app-panel-body">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <FiUser size={14} />
              Username
            </div>
            <p className="mt-2 break-all text-base font-semibold text-slate-950">{account.username}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <FiKey size={14} />
              Password Awal
            </div>
            <p className="mt-2 break-all text-base font-semibold text-slate-950">{account.password}</p>
          </div>
        </div>

        {account.label && (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Akun ini terhubung dengan <span className="font-semibold text-slate-900">{account.label}</span>.
          </p>
        )}
      </div>
    </section>
  );
}