import { useEffect, useState } from 'react';
import { getComments, addComment } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Ahora mismo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

function getInitialColor(name) {
  const colors = [
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-orange-100 text-orange-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Comments({ poemId }) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once Firebase auth resolves
    if (currentUser) setName(currentUser.name);
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    getComments(poemId).then((data) => {
      if (cancelled) return;
      setComments(data);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [poemId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    addComment(poemId, { name, text }).then((updated) => {
      setComments(updated);
      setText('');
      setIsSubmitting(false);
    });
  };

  return (
    <section id="comments-section">
      <p className="text-[11px] tracking-[0.18em] uppercase text-sage font-semibold font-sans mb-6">
        Comentarios {comments.length > 0 && `(${comments.length})`}
      </p>

      <form onSubmit={handleSubmit} className="mb-10 rounded-[8px] bg-white/60 border border-border-light p-4 md:p-5" id="comment-form">
        <div className="grid sm:grid-cols-[12rem_1fr] gap-3 mb-3">
          <input
            type="text"
            placeholder={currentUser ? currentUser.name : 'Tu nombre (opcional)'}
            value={name}
            onChange={(e) => { if (!currentUser) setName(e.target.value); }}
            readOnly={!!currentUser}
            className={`
              px-4 py-3 rounded-[7px]
              border border-border
              text-sm font-sans text-ink placeholder:text-ink-faint/60
              transition-all duration-300
              ${currentUser ? 'bg-parchment-warm cursor-not-allowed opacity-70' : 'bg-white/90 focus:outline-none focus:border-accent-warm focus:ring-4 focus:ring-accent-warm/10'}
            `}
            id="comment-name-input"
          />
          <input
            type="text"
            placeholder="Escribe un comentario..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="px-4 py-3 rounded-[7px] bg-white/90 border border-border text-sm font-sans text-ink placeholder:text-ink-faint/60 transition-all duration-300 focus:outline-none focus:border-accent-warm focus:ring-4 focus:ring-accent-warm/10"
            id="comment-text-input"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="btn-primary px-6 py-2.5 rounded-none text-sm font-sans font-medium tracking-wide cursor-pointer transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            id="comment-submit-btn"
          >
            {isSubmitting ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </form>

      <div className="space-y-0">
        {isLoading ? (
          <p className="text-center text-ink-faint/80 text-base py-8 font-poem italic">
            Cargando comentarios...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-center text-ink-faint/80 text-base py-8 font-poem italic">
            Sé el primero en dejar un pensamiento...
          </p>
        ) : (
          comments.map((comment, i) => (
            <div
              key={comment.id}
              className={`py-5 border-b border-border-light last:border-0 ${i === 0 && comments.length > 1 ? 'animate-slide-down' : ''}`}
              id={`comment-${comment.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold uppercase ${getInitialColor(comment.name)}`} aria-hidden="true">
                  {comment.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-ink">
                      {comment.name}
                    </span>
                    <span className="text-xs text-ink-faint/70">
                      {timeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-light leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
