export default function Footer() {
  return (
    <footer className="border-t border-border-light m-10 bg-white/35">
      <div className="max-w-8xl mx-auto px-10 page-padding py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-start" style={{ paddingLeft: '15px', paddingRight: '15px', marginTop: '10px', marginBottom: '10px' }}>
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

          <div className="mt-4 flex items-center gap-3">
            <a href="#" aria-label="X" className="text-ink-faint hover:text-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.5 6.5c-1.2.8-2.8 1.6-4.8 2.5 1.9-.1 3.6-.1 5.1-.1-.8 1.3-2.4 2.8-4.9 4.5 0 0 4.2 4.7 7.2 6.6-2.9 0-8.9-3.1-12.8-6.4-3.8-3.2-6.1-6.6-6.1-10.1 0-1.6.6-2.9 1.6-3.9C3.9 2.6 6.6 4 9.9 5.7 12 7 14 8.4 15.5 9.6c1.6 1.3 3.2 2.6 4.9 3.9-.1-.6-.2-1.2-.3-1.9.9-1 1.9-2.6 2.5-4.1-.6.3-1.6.5-2.4.3z" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="text-ink-faint hover:text-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="text-ink-faint hover:text-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 8.5h1.8V5.9H15c-1.7 0-2.8 1-2.8 2.8V11H10v2.5h2.2V21h2.6v-7.5H17l.5-2.5h-2V9.3c0-.5.2-.8.6-.8z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-wider text-ink-faint font-sans mb-3">Enlaces</h3>
          <ul className="text-sm text-ink-faint space-y-2">
            <li><a href="#" className="hover:text-accent">Inicio</a></li>
            <li><a href="#" className="hover:text-accent">Sobre mí</a></li>
            <li><a href="#" className="hover:text-accent">Poemas</a></li>
            <li><a href="#" className="hover:text-accent">Contacto</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-10 page-padding text-center text-ink-faint text-xs py-4" style={{ paddingLeft: '15px', paddingRight: '15px', marginTop: '10px', marginBottom: '10px' }}>
        © {new Date().getFullYear()} · Archivo poético personal y archivo de lecturas. · Diseñado por Hugo Paz
      </div>
    </footer>
  );
}
