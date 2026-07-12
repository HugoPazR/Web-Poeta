import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReactions } from '../utils/storage';

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PoemCard({ poem, index, isNew }) {
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    let cancelled = false;
    getReactions(poem.id).then((data) => {
      if (!cancelled) setReactions(data);
    });
    return () => { cancelled = true; };
  }, [poem.id]);

  const totalReactions = Object.values(reactions).reduce((sum, n) => sum + n, 0);
  const topEmojis = Object.entries(reactions)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emoji]) => emoji);

  return (
    <Link
      to={`/poema/${poem.id}`}
      className="group block no-underline w-full animate-fade-in-up focus:outline-none"
      style={{ animationDelay: `${index * 80}ms` }}
      id={`poem-card-${poem.id}`}
    >
      <article
        className="relative w-full overflow-hidden rounded-[8px] paper-panel p-5 md:p-6 flex flex-col md:flex-row gap-5 items-start transition-all duration-500 ease-out group-hover:shadow-[0_20px_60px_-30px_rgba(31,37,32,0.6)] group-focus-visible:ring-2 group-focus-visible:ring-accent/50"
      >
        <div aria-hidden="true" className="flex-shrink-0 h-1 w-full md:h-12 md:w-1 rounded-md bg-gradient-to-b from-sage via-accent to-accent-warm" />

        <div className="relative z-10 flex-1">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <time className="block text-[11px] tracking-[0.18em] uppercase text-ink-faint font-sans mb-1">
                {formatDate(poem.date)}
              </time>
              <h3 className="font-poem text-[20px] md:text-[22px] font-semibold text-ink leading-[1.05] mb-2 group-hover:text-accent transition-colors duration-300">
                {poem.title}
              </h3>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2 mt-2 md:mt-0">
              <span className="text-xs text-accent font-sans font-medium tracking-wide opacity-90 group-hover:opacity-100">
                Leer →
              </span>
              {isNew && (
                <span className="bg-sage text-parchment text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full shadow-sm font-sans">
                  Nuevo
                </span>
              )}
            </div>
          </div>

          <p className="font-poem text-[16px] text-ink-muted leading-relaxed italic mt-2">
            {poem.excerpt}
          </p>

          <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-3">
            {totalReactions > 0 ? (
              <span className="text-xs text-ink-faint font-sans flex items-center gap-2">
                <span className="tracking-wide">{topEmojis.join(' ')}</span>
                <span>{totalReactions}</span>
              </span>
            ) : (
              <span className="text-xs text-ink-faint/75 font-sans italic">
                Sé el primero en reaccionar
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
