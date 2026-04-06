import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function PasswordInput({
  className = '',
  buttonClassName = '',
  containerClassName = '',
  disabled = false,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ToggleIcon = isVisible ? FiEyeOff : FiEye;

  return (
    <div className={`relative ${containerClassName}`.trim()}>
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-12`.trim()}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className={buttonClassName || 'absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1.5 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:text-slate-900'}
        aria-label={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
        title={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
        disabled={disabled}
      >
        <ToggleIcon size={18} />
      </button>
    </div>
  );
}