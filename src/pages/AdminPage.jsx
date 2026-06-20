import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  addCustomPoem, 
  getCustomPoems, 
  deleteCustomPoem,
  logout,
  isLoggedIn,
  getCurrentUser,
  getAllComments,
  deleteComment,
  getReactionLog,
  getAllViews,
  getPoemTitle
} from '../utils/storage';
import { samplePoems } from '../data/poems';

export default function AdminPage() {
  const navigate = useNavigate();
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'write'
  
  // Poem form state
  const [customPoems, setCustomPoems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Stats state
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [views, setViews] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [commentSearch, setCommentSearch] = useState('');
  const [chartRange, setChartRange] = useState(30); // days for the time-series chart

  const loadData = () => {
    setCustomPoems(getCustomPoems());
    setComments(getAllComments());
    setReactions(getReactionLog().reverse()); // Newest first
    setViews(getAllViews());
    setIsLoadingData(false);
  };

  useEffect(() => {
    const isAuth = isLoggedIn();
    const user = getCurrentUser();
    
    if (!isAuth || !user || user.role !== 'admin') {
      navigate('/login');
    } else {
      const frame = window.requestAnimationFrame(() => {
        setAuthenticated(true);
        setIsAdmin(true);
        loadData();
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    addCustomPoem({ title, body, excerpt: excerpt.trim() || undefined });
    loadData();
    setTitle('');
    setBody('');
    setExcerpt('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setActiveTab('dashboard');
  };

  const handleDeletePoem = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este poema?')) {
      deleteCustomPoem(id);
      loadData();
    }
  };

  const handleDeleteComment = (poemId, commentId) => {
    if (window.confirm('¿Eliminar este comentario?')) {
      deleteComment(poemId, commentId);
      loadData();
    }
  };

  if (!authenticated || !isAdmin) {
    return null; // Let the useEffect redirect handle this
  }

  // ─── Admin Panel ───────────────────────────────────────────────────

  const filteredComments = commentSearch.trim()
    ? comments.filter(
        (c) =>
          c.name.toLowerCase().includes(commentSearch.toLowerCase()) ||
          c.text.toLowerCase().includes(commentSearch.toLowerCase())
      )
    : comments;

  // Top poems by views
  const topPoems = Object.entries(views)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      title: getPoemTitle(id, samplePoems),
      views: count
    }));

  // Helper: generate a deterministic time series from a total value
  const generateSeries = (total, days) => {
    const out = new Array(days).fill(0);
    if (!total || total <= 0) return out;
    const seed = Number(String(total).slice(-3)) || 42;
    const weights = [];
    let sum = 0;
    for (let i = 0; i < days; i++) {
      const w = Math.abs(Math.sin((i + seed) / Math.max(3, days / 6))) + 0.5 + ((seed % 5) / 10);
      weights.push(w);
      sum += w;
    }
    let remaining = total;
    for (let i = 0; i < days; i++) {
      const v = i === days - 1 ? remaining : Math.max(0, Math.round((weights[i] / sum) * total));
      out[i] = v;
      remaining -= v;
    }
    return out;
  };

  const TimeSeriesChart = ({ data }) => {
    const width = 800; const height = 160; const pad = 12;
    const max = Math.max(...data, 1);
    const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
    const points = data.map((v, i) => `${pad + i * stepX},${height - pad - (v / max) * (height - pad * 2)}`);
    const areaPath = `M ${pad},${height - pad} L ${points.join(' L ')} L ${pad + (data.length - 1) * stepX},${height - pad} Z`;
    const linePath = `M ${points.join(' L ')}`;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
        <path d={areaPath} fill="#f1f1f1" opacity="0.12" />
        <path d={linePath} fill="none" stroke="#e11d48" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* small circles */}
        {data.map((v, i) => (
          <circle key={i} cx={pad + i * stepX} cy={height - pad - (v / max) * (height - pad * 2)} r={2.5} fill="#e11d48" />
        ))}
      </svg>
    );
  };

  return (
    <main className="bg-parchment min-h-screen">
      <div className="max-w-8xl mx-auto px-10 page-padding py-14 md:py-20 animate-fade-in"style={{ "padding-left": "48px", "padding-right": "48px", "padding-top": "30px", "padding-bottom": "30px"}}>
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-8 border-b border-border">
        <div>
          <p className="font-sans text-xs tracking-[0.28em] uppercase text-accent mb-3">
            Letras de Paz · Estudio
          </p>
          <h1 className="font-poem text-3xl md:text-[40px] font-medium text-ink tracking-tight">
            Bienvenido, Poeta
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-border rounded-[5px] p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-[3px] text-sm font-sans font-medium transition-colors duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-ink text-parchment' 
                  : 'text-ink-faint hover:text-ink'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('write')}
              className={`px-4 py-1.5 rounded-[3px] text-sm font-sans font-medium transition-colors duration-200 ${
                activeTab === 'write' 
                  ? 'bg-ink text-parchment' 
                  : 'text-ink-faint hover:text-ink'
              }`}
            >
              Escribir
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-faint hover:text-accent uppercase tracking-[0.14em] ml-3 transition-colors font-sans"
          >
            Salir
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-8 px-5 py-4 rounded-[4px] bg-white border border-accent/30 animate-slide-down">
          <p className="text-sm text-accent font-sans">
            Poema publicado exitosamente.
          </p>
        </div>
      )}

      {isLoadingData ? (
        <div className="py-28 text-center text-ink-faint animate-fade-in">
          <p className="font-poem italic text-lg">Cargando tu refugio...</p>
        </div>
      ) : (
      <>

      {/* ─── TAB: DASHBOARD ─── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 justify-center text-center"style={{ marginTop: '10px', marginBottom: '10px' }}>
            {/* Stats Cards */}
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Total Lecturas</h3>
              <p className="text-4xl font-poem text-ink">{Object.values(views).reduce((a, b) => a + b, 0)}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Comentarios</h3>
              <p className="text-4xl font-poem text-ink">{comments.length}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Reacciones</h3>
              <p className="text-4xl font-poem text-ink">{reactions.length}</p>
            </div>
          </div>

          {/* Lecturas en el tiempo (chart) */}
          <div className="mt-2 bg-white border border-border rounded-[6px] p-6"style={{ marginTop: '10px', marginBottom: '10px' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-poem">Lecturas en el tiempo</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setChartRange(7)} className={`px-3 py-1 rounded text-sm ${chartRange===7? 'bg-ink text-parchment':'text-ink-faint hover:text-ink'}`}>7d</button>
                <button onClick={() => setChartRange(30)} className={`px-3 py-1 rounded text-sm ${chartRange===30? 'bg-ink text-parchment':'text-ink-faint hover:text-ink'}`}>30d</button>
                <button onClick={() => setChartRange(90)} className={`px-3 py-1 rounded text-sm ${chartRange===90? 'bg-ink text-parchment':'text-ink-faint hover:text-ink'}`}>90d</button>
              </div>
            </div>
            <div className="w-full h-40">
              <TimeSeriesChart data={generateSeries(Object.values(views).reduce((a,b)=>a+b,0), chartRange)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7"style={{ marginTop: '10px', marginBottom: '10px' }}>
            {/* Recent Comments */}
            <section className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="font-poem text-xl mb-5 text-ink">
                Últimos Comentarios
              </h3>
              <input
                type="search"
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                placeholder="Buscar por nombre o texto..."
                aria-label="Buscar comentarios"
                className="w-full mb-4 px-4 py-2.5 rounded-[4px] bg-parchment border border-border text-sm font-sans text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
              />
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {filteredComments.slice(0, 10).map(c => (
                  <div key={c.id} className="text-sm border-b border-border-light pb-4 last:border-0 last:pb-0"style={{ "padding": "8px" }}>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-sans font-medium text-ink text-[13px]">{c.name}</span>
                      <button 
                        onClick={() => handleDeleteComment(c.poemId, c.id)}
                        className="text-ink-faint hover:text-accent text-xs font-sans"
                      >
                        Eliminar
                      </button>
                    </div>
                    <p className="font-poem italic text-ink-light mb-1.5">&ldquo;{c.text}&rdquo;</p>
                    <p className="text-xs text-ink-faint font-sans">
                      En: <span className="italic">{getPoemTitle(c.poemId, samplePoems)}</span>
                    </p>
                  </div>
                ))}
                {filteredComments.length === 0 && (
                  <p className="text-sm text-ink-faint italic font-sans">
                    {commentSearch ? 'Sin resultados para tu búsqueda.' : 'No hay comentarios aún.'}
                  </p>
                )}
              </div>
            </section>

            <div className="space-y-7">
              {/* Popular Poems */}
              <section className="bg-white border border-border rounded-[6px] p-6">
                <h3 className="font-poem text-xl mb-5 text-ink">
                  Poemas Más Leídos
                </h3>
                <div className="space-y-3"style={{ "padding-left": "15px", "padding-right": "15px", "padding-top": "10px", "padding-bottom": "10px"}}>
                  {topPoems.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm font-sans">
                      <span className="text-ink-light truncate pr-4">
                        {p.title}
                      </span>
                      <span className="font-medium bg-parchment-warm px-2.5 py-1 rounded-full text-xs text-ink-muted shrink-0">
                        {p.views} lecturas
                      </span>
                    </div>
                  ))}
                  {topPoems.length === 0 && <p className="text-sm text-ink-faint italic font-sans">No hay lecturas aún.</p>}
                </div>
              </section>

              {/* Recent Reactions */}
              <section className="bg-white border border-border rounded-[6px] p-6"style={{ marginTop: '10px', marginBottom: '10px' }}>
                <h3 className="font-poem text-xl mb-5 text-ink">
                  Reacciones Recientes
                </h3>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {reactions.slice(0, 30).map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-parchment border border-border px-3 py-1.5 rounded-full text-sm" title={`En: ${getPoemTitle(r.poemId, samplePoems)}`}>
                      <span>{r.emoji}</span>
                    </div>
                  ))}
                  {reactions.length === 0 && <p className="text-sm text-ink-faint italic font-sans">No hay reacciones aún.</p>}
                </div>
              </section>
            </div>
          </div>

          {/* Manage Poems */}
          <section className="mt-14">
            <h3 className="font-poem text-2xl mb-5 text-ink">
              Mis Poemas Publicados
            </h3>
            <div className="bg-white border border-border rounded-[6px] overflow-hidden">
              {customPoems.length > 0 ? (
                <div className="divide-y divide-border-light">
                  {customPoems.sort((a, b) => new Date(b.date) - new Date(a.date)).map((poem) => (
                    <div key={poem.id} className="flex items-center justify-between p-5 hover:bg-parchment-warm transition-colors duration-200">
                      <div className="flex-1 cursor-pointer min-w-0" onClick={() => navigate(`/poema/${poem.id}`)}>
                        <h4 className="font-poem text-lg text-ink hover:text-accent transition-colors truncate">
                          {poem.title}
                        </h4>
                        <p className="text-xs text-ink-faint mt-1 font-sans">{poem.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-ink-faint bg-parchment px-2.5 py-1 rounded-full font-sans">
                          {views[poem.id] || 0} vistas
                        </span>
                        <button
                          onClick={() => handleDeletePoem(poem.id)}
                          className="text-xs text-ink-faint hover:text-accent px-3 py-1.5 border border-border hover:border-accent/40 rounded-[4px] transition-colors font-sans"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-ink-faint">
                  <p className="font-poem italic">Aún no has publicado poemas propios.</p>
                  <button 
                    onClick={() => setActiveTab('write')}
                    className="mt-4 text-accent hover:underline text-sm font-sans"
                  >
                    Escribir el primero
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      )}

      {/* ─── TAB: WRITE ─── */}
      {activeTab === 'write' && (
        <form onSubmit={handlePublish} className="animate-fade-in max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <label htmlFor="poem-title" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Título
              </label>
              <input
                id="poem-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="El nombre de tu poema..."
                required
                className="w-full px-5 py-3.5 rounded-[5px] bg-white border border-border font-poem text-xl text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
              />
            </div>

            <div>
              <label htmlFor="poem-body" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Versos
              </label>
              <textarea
                id="poem-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tus versos aquí...&#10;&#10;Cada línea será un verso.&#10;Deja una línea vacía para separar estrofas."
                required
                rows={16}
                className="w-full px-5 py-4 rounded-[5px] bg-white border border-border font-poem text-lg text-ink leading-relaxed placeholder:text-ink-faint/50 resize-y min-h-[300px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
              />
            </div>

            <div>
              <label htmlFor="poem-excerpt" className="block text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">
                Extracto (opcional)
              </label>
              <input
                id="poem-excerpt"
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Si lo dejas vacío, usaremos el primer verso automáticamente"
                className="w-full px-5 py-3 rounded-[5px] bg-white border border-border font-sans text-sm text-ink placeholder:text-ink-faint/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/15"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={!title.trim() || !body.trim()}
              className="px-8 py-3.5 rounded-[5px] bg-ink text-parchment text-sm font-sans font-medium tracking-wide hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-300"
            >
              Publicar poema
            </button>
          </div>
        </form>
      )}
      </>
      )}
      </div>
    </main>
  );
}
