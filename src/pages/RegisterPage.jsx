import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, setDocData } from '../utils/firebaseClient';
import { translateAuthError } from '../utils/authErrors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function RegisterPage() {
  useDocumentTitle('Crear cuenta');
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      const firebaseUser = await signUp(email.trim(), password, name.trim());
      await setDocData('users', firebaseUser.uid, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: Date.now(),
      });
      navigate('/');
    } catch (err) {
      setError(translateAuthError(err));
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleRegister} className="paper-panel rounded-[10px] p-8 space-y-6 panel-accent shadow-md flex flex-col">
          <div className="grid grid-cols-1 gap-4">
            <label className="block">
              <span className="text-xs text-ink-faint font-sans">Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="mt-1 w-full px-4 py-3 rounded-[8px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>

            <label className="block">
              <span className="text-xs text-ink-faint font-sans">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tú@correo.com"
                required
                className="mt-1 w-full px-4 py-3 rounded-[8px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>

            <label className="block">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-faint font-sans">Contraseña</span>
                <small className="text-xs text-ink-faint font-sans">Mínimo 6 caracteres</small>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña segura"
                required
                className="mt-1 w-full px-4 py-3 rounded-[8px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !password || isSubmitting}
              className="btn-primary w-full px-5 py-3.5 rounded-md font-sans text-sm font-medium tracking-wide transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>

          <p className="mt-1 text-center text-sm text-ink-faint font-sans">
            Al crear una cuenta aceptas nuestras políticas.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint font-sans">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent hover:underline transition-colors duration-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
