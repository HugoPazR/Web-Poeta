import { useEffect, useMemo, useState } from 'react';
import { getCustomPoems, sortPoemsByNewest } from '../utils/storage';
import PoemCard from '../components/PoemCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DAYS_FOR_NEW_BADGE = 7;

export default function HomePage() {
  useDocumentTitle();
  const [query, setQuery] = useState('');
  const [now] = useState(() => Date.now());
  const [allPoems, setAllPoems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCustomPoems().then((customPoems) => {
      if (cancelled) return;
      const combined = sortPoemsByNewest(customPoems);
      setAllPoems(combined);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const featured = allPoems[0];

  const visiblePoems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPoems;
    return allPoems.filter(
      (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
    );
  }, [allPoems, query]);

  const isNew = (dateStr) => {
    const days = (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return days <= DAYS_FOR_NEW_BADGE;
  };

  return (
    <main className="bg-transparent min-h-screen">
      <section className="relative overflow-hidden" id="hero">
        <div className="max-w-8xl mx-auto px-8 pt-10 md:pt-14 pb-8 md:pb-10 page-padding">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-14 items-center">
            <div className="animate-fade-in-up">
              <h1 className="font-poem text-[50px] sm:text-[68px] lg:text-[86px] font-semibold text-ink leading-[0.92] tracking-normal max-w-3xl" style={{ paddingBottom: '0px', marginBottom: '15px' }}>
                Versos para leer despacio.
              </h1>
              <p className="mt-7 max-w-xl text-[16px] md:text-[18px] leading-8 text-ink-muted font-sans">
                Un archivo íntimo de poemas, silencios y pequeñas revelaciones. Entra como quien abre una libreta: sin prisa, con atención.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#poems-list" className="btn-primary rounded-none px-5 py-3 text-sm font-medium no-underline transition-colors duration-300">
                  Leer poemas
                </a>
                <a href="/sobre-mi" className="btn-secondary rounded-none px-5 py-3 text-sm font-medium no-underline transition-colors duration-300">
                  Conocer la voz
                </a>
              </div>
            </div>

            {featured && (
              <aside className="paper-panel border-none rounded-none p-6 md:p-8 lg:p-9 animate-fade-in-up delay-2">
                <div className="flex items-center justify-between gap-6 border-b border-border-light pb-5 mb-7">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-sage font-semibold font-sans">
                    Último poema
                  </p>
                  <span className="h-9 w-9 rounded-full bg-sage-light text-sage grid place-items-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 19.5V5.8c0-.7.5-1.3 1.2-1.4 4.6-.6 8.9.3 12.8 2.6v13.6c-3.9-2.3-8.2-3.2-12.8-2.6-.7.1-1.2.7-1.2 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M9 8.5h5M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
                <h2 className="font-poem text-[34px] md:text-[42px] leading-none font-semibold text-ink mb-6">
                  {featured.title}
                </h2>
                <p className="font-poem text-xl md:text-2xl italic leading-relaxed text-ink-light">
                  &ldquo;{featured.excerpt}&rdquo;
                </p>
                <a href={`/poema/${featured.id}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent no-underline">
                  Abrir poema
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </aside>
            )}
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-8 page-padding">
          <div className="editorial-rule" />
        </div>
      </section>

      <section className="max-w-8xl mx-auto px-10 page-padding py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-sage font-semibold font-sans mb-3">
              Biblioteca
            </p>
            <h2 className="font-poem text-[38px] md:text-[48px] leading-none font-semibold text-ink">
              Poemas publicados
            </h2>
          </div>

          <div className="w-full md:max-w-md" >
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar un poema o un verso..."
                aria-label="Buscar poemas"
                className="
                  w-full pl-14 pr-11 py-3.5 rounded-none
                  bg-white/85 border border-border shadow-sm
                  font-sans text-sm text-ink placeholder:text-ink-faint/70
                  focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
                  transition-all duration-300
                "
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-none text-ink-faint hover:text-ink hover:bg-parchment-warm transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-xs text-ink-faint mt-3 font-sans">
              {query
                ? `${visiblePoems.length} ${visiblePoems.length === 1 ? 'resultado' : 'resultados'}`
                : `${allPoems.length} ${allPoems.length === 1 ? 'poema publicado' : 'poemas publicados'}`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="pb-24 text-center animate-fade-in">
            <p className="font-poem text-xl text-ink-faint italic">Cargando poemas...</p>
          </div>
        ) : visiblePoems.length > 0 ? (
          <ul id="poems-list" className="poems-list pb-24">
            {visiblePoems.map((poem, i) => (
              <li key={poem.id} className="poem-list-item relative">
                <PoemCard poem={poem} index={i} isNew={isNew(poem.date)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="pb-24 text-center animate-fade-in paper-panel rounded-[8px] p-10">
            <p className="font-poem text-2xl text-ink-muted italic mb-4">
              {allPoems.length === 0
                ? 'Aún no hay poemas publicados.'
                : 'Ningún poema coincide con tu búsqueda.'}
            </p>
            {query && (
              <button onClick={() => setQuery('')} className="text-accent text-sm hover:underline font-sans">
                Ver todos los poemas
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
