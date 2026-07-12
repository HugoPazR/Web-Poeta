import { useState } from 'react';
import { subscribeToNewsletter } from '../utils/storage';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      await subscribeToNewsletter(email);
      setStatus({ ok: true, msg: '¡Gracias! Te avisaremos cuando publique un nuevo poema.' });
      setEmail('');
    } catch {
      setStatus({ ok: false, msg: 'No pudimos completar la suscripción. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto md:max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          aria-label="Correo electrónico"
          className="flex-1 px-4 py-2.5 rounded-none bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
        />
        <button
          type="submit"
          disabled={!email.trim() || isSubmitting}
          className="btn-primary px-5 py-2.5 rounded-none text-sm font-sans font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubmitting ? 'Enviando...' : 'Suscribirme'}
        </button>
      </div>
      {status && (
        <p role="status" className={`mt-2 text-xs font-sans ${status.ok ? 'text-sage' : 'text-accent'}`}>
          {status.msg}
        </p>
      )}
    </form>
  );
}
