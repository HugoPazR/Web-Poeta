import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../utils/firebaseClient';
import { translateAuthError } from '../utils/authErrors';
import { ADMIN_EMAIL } from '../utils/constants';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Entrar');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      const user = await signIn(trimmedEmail, password);
      navigate(user.email === ADMIN_EMAIL ? '/admin' : '/');
    } catch (err) {
      setError(translateAuthError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-76px)] flex items-center justify-center px-10 page-padding py-14">
      <div className="w-full max-w-[430px] relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-sage text-parchment shadow-[0_18px_38px_-26px_rgba(31,37,32,0.75)]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 17.5c5.8-.8 9.8-4.3 12-11.5-6.1 1.1-10.4 4.5-12.5 10.7L4 20l2-2.5Z" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 15.5 14.5 9" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="font-poem text-[42px] font-semibold text-ink mb-2 leading-none">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-ink-faint font-sans">
            Entra a tu refugio de poesía.
          </p>
        </div>

        <div className="paper-panel rounded-[8px] p-7 md:p-8 panel-accent">
          <div className="accent-stripe" aria-hidden="true" />
          <form onSubmit={handleLogin} className="space-y-4 flex-1" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-14 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wide text-ink-faint hover:text-accent transition-colors font-sans"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/recuperar-contrasena" className="text-xs text-ink-faint hover:text-accent transition-colors font-sans">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-accent text-xs text-center font-sans animate-fade-in pt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!email.trim() || !password || isSubmitting}
              className="btn-primary w-full px-5 py-3.5 rounded-none mt-2 font-sans text-sm font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-sm text-ink-faint font-sans">
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="text-accent hover:underline transition-colors duration-300">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
