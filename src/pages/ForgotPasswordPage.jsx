import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../utils/firebaseClient';
import { translateAuthError } from '../utils/authErrors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const GENERIC_SUCCESS_MSG = 'Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).';

export default function ForgotPasswordPage() {
  useDocumentTitle('Recuperar contraseña');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      await resetPassword(email.trim());
      setStatus({ ok: true, msg: GENERIC_SUCCESS_MSG });
    } catch (err) {
      // Never reveal whether the email exists — that would let anyone enumerate registered
      // accounts. Only surface errors unrelated to "does this account exist".
      if (err.code === 'auth/user-not-found') {
        setStatus({ ok: true, msg: GENERIC_SUCCESS_MSG });
      } else {
        setStatus({ ok: false, msg: translateAuthError(err) });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-76px)] flex items-center justify-center px-10 page-padding py-10">
      <div className="w-full max-w-[430px] relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sage text-parchment shadow-[0_18px_38px_-26px_rgba(31,37,32,0.75)]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.55" />
              <path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.5-1.2-1.5-2.6-1.8.5c-.4-.3-.8-.6-1.3-.8l-.3-1.9h-3l-.3 1.9c-.5.2-.9.5-1.3.8l-1.8-.5-1.5 2.6 1.5 1.2c-.1.5-.1 1 0 1.5l-1.5 1.2 1.5 2.6 1.8-.5c.4.3.8.6 1.3.8l.3 1.9h3l.3-1.9c.5-.2.9-.5 1.3-.8l1.8.5 1.5-2.6-1.5-1.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="font-poem text-[38px] font-semibold text-ink mb-2 leading-none">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-ink-faint font-sans">
            Te enviaremos un enlace para crear una nueva.
          </p>
        </div>

        <div className="paper-panel rounded-[8px] p-7 md:p-8 panel-accent">
          <div className="accent-stripe" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-email" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Correo electrónico
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
              />
            </div>

            {status && (
              <p role="status" className={`text-xs text-center font-sans animate-fade-in pt-1 ${status.ok ? 'text-sage' : 'text-accent'}`}>
                {status.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="btn-primary w-full px-5 py-3.5 rounded-none mt-2 font-sans text-sm font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-sm text-ink-faint font-sans">
          <Link to="/login" className="text-accent hover:underline transition-colors duration-300">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
