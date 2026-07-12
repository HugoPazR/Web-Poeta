import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

export default function Footer() {
  return (
    <footer className="border-t border-border-light bg-white/35">
      <div className="border-b border-border-light">
        <div className="max-w-8xl mx-auto px-10 page-padding py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-poem text-xl text-ink mb-1">Nuevos poemas en tu correo</h3>
            <p className="text-sm text-ink-faint">Sin spam. Solo un aviso cuando publique algo nuevo.</p>
          </div>
          <NewsletterSignup />
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-10 page-padding py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="flex items-start gap-3">
          <img src="/assets/Logo_Letras_de_Paz.png" alt="Letras de Paz" className="h-22 w-22 object-contain rounded-full" />
          <div>
            <p className="font-poem text-2xl leading-none text-ink">Letras de Paz</p>
            <p className="text-ink-faint text-xs tracking-widest uppercase font-sans mt-1">
              Poesía que habita
            </p>
            <p className="text-ink-faint text-sm mt-3">Archivo poético personal y archivo de lecturas.</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-wider text-ink-faint font-sans mb-3">Contacto</h3>
          <p className="text-sm text-ink">contacto@letrasdepaz.com</p>
          <p className="text-xs text-ink-faint mt-2">Tel: +57 314 514 6335</p>

          <div className="mt-4 flex items-center gap-4">
            <a href="https://x.com/hugopazrojas1" target="_blank" rel="noreferrer" aria-label="X" className="text-ink-faint hover:text-accent transition-colors duration-300">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" />
              </svg>
            </a>
            <a href="https://instagram.com/hugopazrojas" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-ink-faint hover:text-accent transition-colors duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
              </svg>
            </a>
            <a href="https://facebook.com/hugopazrojas" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-ink-faint hover:text-accent transition-colors duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 8.5h1.8V5.9H15c-1.7 0-2.8 1-2.8 2.8V11H10v2.5h2.2V21h2.6v-7.5H17l.5-2.5h-2V9.3c0-.5.2-.8.6-.8z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-wider text-ink-faint font-sans mb-3">Enlaces</h3>
          <ul className="text-sm text-ink-faint space-y-2">
            <li><Link to="/" className="hover:text-accent transition-colors duration-300">Inicio</Link></li>
            <li><Link to="/sobre-mi" className="hover:text-accent transition-colors duration-300">Sobre mí</Link></li>
            <li><Link to="/#poems-list" className="hover:text-accent transition-colors duration-300">Poemas</Link></li>
            <li><Link to="/contacto" className="hover:text-accent transition-colors duration-300">Contacto</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-light">
        <div className="max-w-8xl mx-auto px-10 page-padding text-center text-ink-faint text-xs py-4">
          © {new Date().getFullYear()} · Archivo poético personal y archivo de lecturas. · Diseñado por Hugo Paz
        </div>
      </div>
    </footer>
  );
}
