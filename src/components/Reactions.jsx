import { useState, useRef, useCallback } from 'react';
import { reactionEmojis } from '../data/poems';
import { getReactions, addReaction, getUserReaction } from '../utils/storage';

export default function Reactions({ poemId }) {
  const [reactions, setReactions] = useState(() => getReactions(poemId));
  const [userReaction, setUserReaction] = useState(() => getUserReaction(poemId));
  const [animating, setAnimating] = useState(null);
  const [floats, setFloats] = useState([]);
  const floatIdRef = useRef(0);

  const handleReaction = useCallback((emoji) => {
    if (userReaction === emoji) return;
    const updated = addReaction(poemId, emoji);
    setReactions({ ...updated });
    setUserReaction(emoji);
    setAnimating(emoji);
    setTimeout(() => setAnimating(null), 400);

    const id = ++floatIdRef.current;
    setFloats((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  }, [poemId, userReaction]);

  return (
    <div className="relative">
      <p className="text-[11px] tracking-[0.18em] uppercase text-sage font-semibold font-sans mb-5">
        ¿Qué te hizo sentir?
      </p>

      <div className="flex flex-wrap gap-3">
        {reactionEmojis.map(({ emoji, label }) => {
          const count = reactions[emoji] || 0;
          const isAnimating = animating === emoji;
          const isActive = userReaction === emoji;

          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`
                group relative flex items-center gap-2 px-4 py-2.5
                rounded-full border backdrop-blur-sm cursor-pointer shadow-sm
                transition-all duration-300
                ${isActive
                  ? 'border-accent-warm bg-accent-glow'
                  : 'border-border bg-white/70 hover:border-accent-warm hover:bg-accent-glow'
                }
                active:scale-95
                ${isAnimating ? 'animate-reaction-pop' : ''}
              `}
              title={label}
              aria-label={`${label}: ${count} reacciones`}
              id={`reaction-${emoji}`}
            >
              <span className="text-xl leading-none select-none">{emoji}</span>
              <span className={`text-sm font-sans font-semibold tabular-nums transition-colors duration-300 ${count > 0 ? 'text-ink-light' : 'text-ink-faint'} group-hover:text-accent`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {floats.map(({ id, emoji }) => (
        <span key={id} className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl animate-float-up" aria-hidden="true">
          {emoji}
        </span>
      ))}
    </div>
  );
}
