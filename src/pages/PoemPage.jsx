import { useParams, Link, useNavigate } from 'react-router-dom';
import { samplePoems } from '../data/poems';
import { getCustomPoems, addView } from '../utils/storage';
import { useEffect } from 'react';
import Reactions from '../components/Reactions';
import Comments from '../components/Comments';

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PoemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allPoems = [...getCustomPoems(), ...samplePoems];
  const poem = allPoems.find((p) => p.id === id);

  useEffect(() => {
    if (poem) addView(poem.id);
  }, [poem]);

  if (!poem) {
    return (
      <main className="max-w-3xl mx-auto px-10 page-padding py-24 text-center animate-fade-in">
        <div className="paper-panel rounded-[8px] p-10">
          <p className="font-poem text-3xl text-ink-muted italic mb-6">
            Este poema se perdió entre las páginas...
          </p>
          <Link to="/" className="text-sm text-accent hover:text-accent-light transition-colors duration-300 no-underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const sortedPoems = [...allPoems].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const currentIndex = sortedPoems.findIndex((p) => p.id === id);
  const prevPoem = sortedPoems[currentIndex - 1];
  const nextPoem = sortedPoems[currentIndex + 1];

  return (
    <main className="max-w-5xl mx-auto px-10 page-padding py-8 md:py-14">
      <button
        onClick={() => navigate(-1)}
        className="mb-7 inline-flex items-center gap-2 text-sm text-ink-faint hover:text-accent transition-colors duration-300 font-sans tracking-wide cursor-pointer bg-transparent border-none p-0"
        id="back-button"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H6M12 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver
      </button>

      <article className="paper-panel rounded-[8px] px-6 py-9 md:px-14 md:py-14 animate-fade-in-up" id={`poem-${poem.id}`}>
        <header className="max-w-3xl">
          <time className="block text-[11px] tracking-[0.18em] uppercase text-sage font-semibold font-sans mb-5">
            {formatDate(poem.date)}
          </time>

          <h1 className="font-poem text-[44px] md:text-[64px] font-semibold text-ink mb-8 leading-[0.96] tracking-normal">
            {poem.title}
          </h1>
        </header>

        <div className="editorial-rule mb-10 md:mb-14" />

        <div className="poem-body max-w-3xl mb-14 md:mb-18 first-letter:text-6xl md:first-letter:text-7xl first-letter:font-poem first-letter:text-accent first-letter:mr-2 first-letter:float-left first-letter:leading-[0.8] first-letter:mt-2">
          {poem.body}
        </div>

        <div className="mb-12 md:mb-16 text-sage">
          <svg width="86" height="19" viewBox="0 0 86 19" fill="none" aria-hidden="true">
            <path d="M2 12C16 2 28 17 43 9.5C58 2 69 16 84 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mb-12 md:mb-16">
          <Reactions poemId={poem.id} />
        </div>

        <div className="editorial-rule mb-12 md:mb-16" />

        <Comments poemId={poem.id} />

        <nav className="mt-16 pt-8 border-t border-border-light" id="poem-navigation">
          <div className="grid grid-cols-2 gap-4">
            {prevPoem ? (
              <Link to={`/poema/${prevPoem.id}`} className="group no-underline rounded-[8px] btn-secondary p-4 transition-colors duration-300" id="prev-poem-link">
                <span className="text-xs text-ink-faint font-sans tracking-wide mb-2 flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 12H6M12 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Anterior
                </span>
                <span className="font-poem text-lg text-ink-muted group-hover:text-accent transition-colors duration-300 line-clamp-1">
                  {prevPoem.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextPoem ? (
              <Link to={`/poema/${nextPoem.id}`} className="group no-underline rounded-[8px] btn-secondary p-4 text-right transition-colors duration-300" id="next-poem-link">
                <span className="text-xs text-ink-faint font-sans tracking-wide mb-2 flex items-center justify-end gap-2">
                  Siguiente
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h13M12 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-poem text-lg text-ink-muted group-hover:text-accent transition-colors duration-300 line-clamp-1">
                  {nextPoem.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </nav>
      </article>
    </main>
  );
}
