import { useState } from 'react';
import { hasEmailConfig, sendContactMessage } from '../utils/emailClient';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MAPS_EMBED_SRC = 'https://maps.google.com/maps?q=Valledupar%2C%20Cesar%2C%20Colombia&output=embed';

export default function ContactPage() {
  useDocumentTitle('Contacto', {
    description: 'Escríbeme tus impresiones, dudas o simplemente saluda. Un espacio para conectar sobre poesía, versos y letras.',
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const configured = hasEmailConfig();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      await sendContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
      setStatus({ ok: true, msg: '¡Gracias! Tu mensaje fue enviado.' });
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus({ ok: false, msg: 'No pudimos enviar tu mensaje. Intenta de nuevo más tarde.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-10 page-padding py-8 md:py-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="text-[11px] tracking-[0.2em] uppercase text-sage font-semibold font-sans mb-3">
          Contacto
        </p>
        <h1 className="font-poem text-[44px] md:text-[60px] font-semibold text-ink leading-[0.98] mb-4">
          Escríbeme
        </h1>
        <p className="text-ink-light text-[16px] leading-8">
          Si un poema te tocó, si quieres compartir algo o simplemente saludar, este es el lugar.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="paper-panel rounded-[8px] p-6 md:p-7">
          {!configured ? (
            <div className="text-center py-6">
              <p className="font-poem text-lg text-ink-muted italic mb-4">
                El formulario de contacto aún no está configurado.
              </p>
              <a href="mailto:contacto.letrasdepaz@gmail.com" className="text-accent hover:underline text-sm font-sans">
                Escribe directamente a contacto.letrasdepaz@gmail.com
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                  Nombre
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                  Correo electrónico
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-[7px] bg-white/90 border border-border font-sans text-sm text-ink leading-relaxed placeholder:text-ink-faint/50 resize-y focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-colors duration-300"
                />
              </div>

              {status && (
                <p role="status" className={`text-sm font-sans ${status.ok ? 'text-sage' : 'text-accent'}`}>
                  {status.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || !email.trim() || !message.trim() || isSubmitting}
                className="btn-primary w-full px-5 py-3.5 rounded-none font-sans text-sm font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </div>

        <div className="paper-panel rounded-[8px] p-2 overflow-hidden">
          <iframe
            src={MAPS_EMBED_SRC}
            width="100%"
            height="420"
            style={{ border: 0, display: 'block', borderRadius: '6px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de Valledupar"
          />
        </div>
      </div>
    </main>
  );
}
