import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, setDocData } from '../utils/firebaseClient';
import { translateAuthError } from '../utils/authErrors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import TermsModal from '../components/TermsModal';
import Recaptcha, { hasRecaptchaConfig } from '../components/Recaptcha';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterPage() {
  useDocumentTitle('Crear cuenta');
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMismatch = confirmTouched && password !== confirmPassword;
  const recaptchaRequired = hasRecaptchaConfig();

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setConfirmTouched(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setConfirmTouched(true);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors({ password: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!acceptedTerms) {
      setFieldErrors({ terms: 'Debes aceptar los Términos y Condiciones para continuar.' });
      return;
    }
    setFieldErrors({});

    if (recaptchaRequired && !recaptchaToken) {
      setError('Por favor completa la verificación reCAPTCHA.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (recaptchaRequired) {
        const verifyRes = await fetch('/api/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
        });
        const verifyData = await verifyRes.json().catch(() => ({ success: false }));
        if (!verifyData.success) {
          setError('No pudimos verificar que no eres un robot. Intenta de nuevo.');
          setIsSubmitting(false);
          recaptchaRef.current?.reset();
          return;
        }
      }

      const firebaseUser = await signUp(email.trim(), password, name.trim());
      await setDocData('users', firebaseUser.uid, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: Date.now(),
        acceptedTermsAt: Date.now(),
      });
      navigate('/');
    } catch (err) {
      setError(translateAuthError(err));
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  const submitDisabled =
    !name.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    password.length < MIN_PASSWORD_LENGTH ||
    password !== confirmPassword ||
    !acceptedTerms ||
    (recaptchaRequired && !recaptchaToken) ||
    isSubmitting;

  return (
    <main className="min-h-[calc(100vh-76px)] flex items-center justify-center px-6 page-padding py-14 animate-fade-in">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-6">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sage text-parchment">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="font-poem text-3xl md:text-[40px] font-semibold text-ink mb-1 leading-tight">
            Crear cuenta
          </h1>
          <p className="text-sm text-ink-faint font-sans">
            Guarda tu nombre para comentar e interactuar.
          </p>
        </div>

        <div className="paper-panel rounded-[8px] p-7 md:p-8 panel-accent shadow-md">
          <div className="accent-stripe" aria-hidden="true" />
          <form onSubmit={handleRegister} noValidate className="space-y-4 flex-1">
            <div>
              <label htmlFor="register-name" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Nombre
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
                className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Correo electrónico
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tú@correo.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="register-password" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans">
                  Contraseña
                </label>
                <small className="text-xs text-ink-faint font-sans">Mínimo {MIN_PASSWORD_LENGTH} caracteres</small>
              </div>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña segura"
                  autoComplete="new-password"
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
              {fieldErrors.password && (
                <p role="alert" className="text-accent text-xs font-sans mt-1.5 animate-fade-in">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? 'confirm-password-error' : undefined}
                  className="w-full px-4 py-3 pr-14 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wide text-ink-faint hover:text-accent transition-colors font-sans"
                >
                  {showConfirmPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {(passwordsMismatch || fieldErrors.confirmPassword) && (
                <p id="confirm-password-error" role="alert" className="text-accent text-xs font-sans mt-1.5 animate-fade-in">
                  {fieldErrors.confirmPassword || 'Las contraseñas no coinciden.'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input
                  id="register-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ accentColor: 'var(--color-accent)' }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border border-border bg-white/90 focus:outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer"
                />
                <label htmlFor="register-terms" className="text-xs text-ink-faint font-sans leading-relaxed cursor-pointer select-none">
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-accent hover:underline transition-colors duration-300"
                  >
                    Términos y Condiciones
                  </button>.
                </label>
              </div>
              {fieldErrors.terms && (
                <p role="alert" className="text-accent text-xs font-sans mt-1.5 animate-fade-in">{fieldErrors.terms}</p>
              )}
            </div>

            {recaptchaRequired && (
              <div>
                <Recaptcha ref={recaptchaRef} onChange={setRecaptchaToken} />
              </div>
            )}

            {error && (
              <p role="alert" className="text-accent text-xs text-center font-sans animate-fade-in pt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="btn-primary w-full px-5 py-3.5 rounded-none mt-2 font-sans text-sm font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-faint font-sans">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent hover:underline transition-colors duration-300">
            Inicia sesión
          </Link>
        </p>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </main>
  );
}
