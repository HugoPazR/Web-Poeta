import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addCustomPoem,
  getCustomPoems,
  deleteCustomPoem,
  getAllComments,
  deleteComment,
  getReactionLog,
  getAllReactions,
  getAllViews,
  getViewsDailyRaw,
  getPoemTitle,
  getPoemSlug,
  sortPoemsByNewest,
  getSubscribers,
  deleteSubscriber
} from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../utils/firebaseClient';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { hasNotifyConfig, notifySubscriber } from '../utils/emailClient';

export default function AdminPage() {
  useDocumentTitle('Panel');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
  const [reactionCounts, setReactionCounts] = useState({});
  const [views, setViews] = useState({});
  const [viewsDailyRaw, setViewsDailyRaw] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [commentSearch, setCommentSearch] = useState('');
  const [chartRange, setChartRange] = useState(30); // days for the time-series chart
  const [subscribers, setSubscribers] = useState([]);
  const [monthlyMetric, setMonthlyMetric] = useState('lecturas'); // metric shown in the monthly bar chart
  const [resumenYear, setResumenYear] = useState(() => new Date().getFullYear()); // year shown (Jan-Dec) in "Resumen mensual"
  const [dashboardView, setDashboardView] = useState('historico'); // 'historico' | 'mensual'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState(null);

  const loadData = async () => {
    const [customPoemsData, commentsData, reactionLogData, reactionCountsData, viewsData, viewsDailyRawData, subscribersData] = await Promise.all([
      getCustomPoems(),
      getAllComments(),
      getReactionLog(),
      getAllReactions(),
      getAllViews(),
      getViewsDailyRaw(),
      getSubscribers(),
    ]);
    setCustomPoems(customPoemsData);
    setComments(commentsData);
    setReactions(reactionLogData.slice().reverse()); // Newest first
    setReactionCounts(reactionCountsData);
    setViews(viewsData);
    setViewsDailyRaw(viewsDailyRawData);
    setSubscribers(subscribersData);
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) {
      navigate('/login');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch dashboard data once auth resolves
      loadData();
    }
  }, [authLoading, user, navigate]);

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const newPoem = await addCustomPoem({ title, body, excerpt: excerpt.trim() || undefined });
    await loadData();
    setTitle('');
    setBody('');
    setExcerpt('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setActiveTab('dashboard');

    // Best-effort: notify subscribers. Never blocks or fails the publish itself.
    if (hasNotifyConfig() && subscribers.length > 0) {
      setNotifyStatus(null);
      setIsNotifying(true);
      const poemInfo = {
        title: newPoem.title,
        excerpt: newPoem.excerpt,
        url: `${window.location.origin}/poema/${getPoemSlug(newPoem)}`,
      };
      let sent = 0;
      for (const s of subscribers) {
        try {
          await notifySubscriber(s.email, poemInfo);
          sent++;
        } catch (err) {
          console.error('notifySubscriber failed', s.email, err);
        }
      }
      setIsNotifying(false);
      setNotifyStatus({ sent, total: subscribers.length });
    }
  };

  const handleDeletePoem = async (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este poema?')) {
      await deleteCustomPoem(id);
      await loadData();
    }
  };

  const handleDeleteComment = async (poemId, commentId) => {
    if (window.confirm('¿Eliminar este comentario?')) {
      await deleteComment(poemId, commentId);
      await loadData();
    }
  };

  const handleDeleteSubscriber = async (email) => {
    if (window.confirm('¿Eliminar esta suscripción?')) {
      await deleteSubscriber(email);
      await loadData();
    }
  };

  const handleCopyEmails = async () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch {
      /* clipboard API unavailable — nothing to fall back to here */
    }
  };

  if (authLoading || !user || !user.isAdmin) {
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

  // For looking up titles by id
  const allPoemsForTitles = customPoems;

  // Top poems by views (all-time)
  const topPoems = Object.entries(views)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      title: getPoemTitle(id, allPoemsForTitles),
      views: count
    }));

  // Per-day totals (summed across all poems), derived from the raw per-poem records.
  const dailyViewTotals = {};
  for (const d of viewsDailyRaw) {
    if (!d.date) continue;
    dailyViewTotals[d.date] = (dailyViewTotals[d.date] || 0) + (d.views || 0);
  }

  // ─── "Por mes" filtering ───────────────────────────────────────────────
  const isInSelectedMonth = (ts) => {
    if (!ts) return false;
    const d = new Date(ts);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  };

  const monthlyComments = comments.filter((c) => isInSelectedMonth(c.timestamp));
  const monthlyReactionEvents = reactions.filter((r) => isInSelectedMonth(r.timestamp));
  const monthlySubscribers = subscribers.filter((s) => isInSelectedMonth(s.createdAt));

  const monthlyViewsByPoem = {};
  for (const d of viewsDailyRaw) {
    if (!d.date || !d.poemId) continue;
    if (!isInSelectedMonth(new Date(`${d.date}T12:00:00`).getTime())) continue;
    monthlyViewsByPoem[d.poemId] = (monthlyViewsByPoem[d.poemId] || 0) + (d.views || 0);
  }
  const monthlyTopPoems = Object.entries(monthlyViewsByPoem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, title: getPoemTitle(id, allPoemsForTitles), views: count }));
  const monthlyTotalViews = Object.values(monthlyViewsByPoem).reduce((a, b) => a + b, 0);

  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const currentYear = new Date().getFullYear();
  const earliestActivityYear = (() => {
    const timestamps = [
      ...comments.map((c) => c.timestamp),
      ...reactions.map((r) => r.timestamp),
      ...subscribers.map((s) => s.createdAt),
    ].filter(Boolean);
    if (!timestamps.length) return currentYear;
    return new Date(Math.min(...timestamps)).getFullYear();
  })();
  const yearOptions = [];
  for (let y = currentYear; y >= earliestActivityYear; y--) yearOptions.push(y);

  // Real per-day series for the last `days` days (oldest first), from actual tracked totals.
  // Days before daily tracking shipped simply have no recorded reads.
  const buildDailySeries = (dailyTotals, days) => {
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      out.push({ date: dateStr, value: dailyTotals[dateStr] || 0 });
    }
    return out;
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const chartSeries = buildDailySeries(dailyViewTotals, chartRange);

  // Real per-day series for one specific month (oldest first). Future months (relative to
  // today) have no elapsed days yet, so they return an empty array.
  const buildMonthDailySeries = (dailyTotals, year, month) => {
    const today = new Date();
    const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);
    if (isFutureMonth) return [];
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const out = [];
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-CA');
      out.push({ date: dateStr, value: dailyTotals[dateStr] || 0 });
    }
    return out;
  };

  const monthlyDailySeries = buildMonthDailySeries(dailyViewTotals, selectedYear, selectedMonth);

  const TimeSeriesChart = ({ data }) => {
    const width = 800; const height = 160; const pad = 12;
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
    const points = values.map((v, i) => `${pad + i * stepX},${height - pad - (v / max) * (height - pad * 2)}`);
    const areaPath = `M ${pad},${height - pad} L ${points.join(' L ')} L ${pad + (data.length - 1) * stepX},${height - pad} Z`;
    const linePath = `M ${points.join(' L ')}`;
    return (
      <div className="relative w-full h-full pb-4">
        <div className="absolute top-0 left-0 text-[11px] font-sans text-ink-faint">{max}</div>
        <div className="absolute bottom-4 left-0 text-[11px] font-sans text-ink-faint">0</div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height: 'calc(100% - 1rem)' }}>
          <path d={areaPath} fill="#f1f1f1" opacity="0.12" />
          <path d={linePath} fill="none" stroke="#e11d48" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* small circles, each with a hover tooltip showing the exact date + count */}
          {data.map(({ date, value }, i) => (
            <circle key={date} cx={pad + i * stepX} cy={height - pad - (value / max) * (height - pad * 2)} r={2.5} fill="#e11d48">
              <title>{formatShortDate(date)}: {value} lectura{value === 1 ? '' : 's'}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 text-[11px] font-sans text-ink-faint">{formatShortDate(data[0].date)}</div>
        <div className="absolute bottom-0 right-0 text-[11px] font-sans text-ink-faint">{formatShortDate(data[data.length - 1].date)}</div>
      </div>
    );
  };

  // Monthly totals for a full year (January-December), built from real timestamped events.
  // Comments, reactions and subscribers have always recorded timestamps, so their history
  // goes back as far as those features have existed; views are only bucketed by day since
  // the daily tracking feature shipped, so earlier months/years will show 0 there.
  const monthKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const buildMonthlySeries = (events, year) => {
    const totals = {};
    events.forEach(({ timestamp, value }) => {
      if (!timestamp) return;
      const key = monthKey(timestamp);
      totals[key] = (totals[key] || 0) + value;
    });
    const out = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1);
      const key = `${year}-${String(m + 1).padStart(2, '0')}`;
      out.push({
        key,
        shortLabel: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
        fullLabel: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        value: totals[key] || 0,
      });
    }
    return out;
  };

  const monthlySeriesByMetric = {
    lecturas: buildMonthlySeries(
      Object.entries(dailyViewTotals).map(([date, count]) => ({ timestamp: new Date(`${date}T12:00:00`).getTime(), value: count })),
      resumenYear
    ),
    comentarios: buildMonthlySeries(comments.map((c) => ({ timestamp: c.timestamp, value: 1 })), resumenYear),
    reacciones: buildMonthlySeries(reactions.map((r) => ({ timestamp: r.timestamp, value: 1 })), resumenYear),
    suscriptores: buildMonthlySeries(subscribers.map((s) => ({ timestamp: s.createdAt, value: 1 })), resumenYear),
  };

  const historicalTotals = {
    lecturas: Object.values(views).reduce((a, b) => a + b, 0),
    comentarios: comments.length,
    reacciones: Object.values(reactionCounts).reduce((sum, counts) => sum + Object.values(counts).reduce((s, n) => s + n, 0), 0),
    suscriptores: subscribers.length,
  };

  const monthlyMetricLabels = {
    lecturas: 'Lecturas',
    comentarios: 'Comentarios',
    reacciones: 'Reacciones',
    suscriptores: 'Suscriptores',
  };

  const monthlyMetricSingular = {
    lecturas: 'lectura',
    comentarios: 'comentario',
    reacciones: 'reacción',
    suscriptores: 'suscriptor',
  };

  const BarChart = ({ data, unitLabel }) => {
    const width = 800; const height = 160; const pad = 12;
    const max = Math.max(...data.map((d) => d.value), 1);
    const gap = 6;
    const barWidth = (width - pad * 2) / data.length - gap;
    return (
      <div className="relative w-full h-full pb-4">
        <div className="absolute top-0 left-0 text-[11px] font-sans text-ink-faint">{max}</div>
        <div className="absolute bottom-4 left-0 text-[11px] font-sans text-ink-faint">0</div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height: 'calc(100% - 1rem)' }}>
          {data.map((d, i) => {
            const barH = (d.value / max) * (height - pad * 2);
            const x = pad + i * (barWidth + gap);
            const y = height - pad - barH;
            return (
              <rect key={d.key} x={x} y={Math.max(0, y)} width={Math.max(0, barWidth)} height={Math.max(0, barH)} fill="#e11d48" rx={2}>
                <title>{d.fullLabel}: {d.value} {unitLabel}</title>
              </rect>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-sans text-ink-faint px-0.5">
          {data.map((d) => <span key={d.key}>{d.shortLabel}</span>)}
        </div>
      </div>
    );
  };

  return (
    <main className="bg-parchment min-h-screen">
      <div className="max-w-8xl mx-auto px-10 page-padding py-6 md:py-8 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-4 border-b border-border">
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

      {(showSuccess || isNotifying || notifyStatus) && (
        <div className="mb-8 px-5 py-4 rounded-[4px] bg-white border border-accent/30 animate-slide-down">
          <p className="text-sm text-accent font-sans">
            Poema publicado exitosamente.
          </p>
          {isNotifying && (
            <p className="text-xs text-ink-faint font-sans mt-1">Avisando a tus suscriptores...</p>
          )}
          {notifyStatus && (
            <p className="text-xs text-ink-faint font-sans mt-1">
              {notifyStatus.sent === notifyStatus.total
                ? `Se avisó a ${notifyStatus.sent} de ${notifyStatus.total} suscriptores.`
                : `Se avisó a ${notifyStatus.sent} de ${notifyStatus.total} suscriptores (algunos fallaron).`}
            </p>
          )}
        </div>
      )}
      {!hasNotifyConfig() && subscribers.length > 0 && activeTab === 'write' && (
        <div className="mb-8 px-5 py-4 rounded-[4px] bg-white border border-border">
          <p className="text-xs text-ink-faint font-sans">
            Tienes {subscribers.length} suscriptor{subscribers.length === 1 ? '' : 'es'}, pero el aviso automático de poema nuevo aún no está configurado (falta VITE_EMAILJS_NOTIFY_TEMPLATE_ID en tu .env.local).
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

          {/* Histórico / Por mes toggle */}
          <div className="flex bg-white border border-border rounded-[5px] p-1 w-fit">
            <button
              onClick={() => setDashboardView('historico')}
              className={`px-4 py-1.5 rounded-[3px] text-sm font-sans font-medium transition-colors duration-200 ${
                dashboardView === 'historico' ? 'bg-ink text-parchment' : 'text-ink-faint hover:text-ink'
              }`}
            >
              Total histórico
            </button>
            <button
              onClick={() => setDashboardView('mensual')}
              className={`px-4 py-1.5 rounded-[3px] text-sm font-sans font-medium transition-colors duration-200 ${
                dashboardView === 'mensual' ? 'bg-ink text-parchment' : 'text-ink-faint hover:text-ink'
              }`}
            >
              Por mes
            </button>
          </div>

          {dashboardView === 'historico' && (
          <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 justify-center text-center">
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
              <p className="text-4xl font-poem text-ink">{Object.values(reactionCounts).reduce((sum, counts) => sum + Object.values(counts).reduce((s, n) => s + n, 0), 0)}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Suscriptores</h3>
              <p className="text-4xl font-poem text-ink">{subscribers.length}</p>
            </div>
          </div>

          {/* Lecturas en el tiempo (chart) */}
          <div className="mt-2 bg-white border border-border rounded-[6px] p-6"style={{ marginTop: '10px', marginBottom: '10px' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-poem">Lecturas en el tiempo</h3>
                <p className="text-xs text-ink-faint font-sans mt-1">
                  {chartSeries.reduce((a, b) => a + b.value, 0)} lectura{chartSeries.reduce((a, b) => a + b.value, 0) === 1 ? '' : 's'} en los últimos {chartRange} días
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChartRange(7)} className={`px-3 py-1 rounded text-sm ${chartRange===7? 'bg-ink text-parchment':'text-ink-faint hover:text-ink'}`}>7d</button>
                <button onClick={() => setChartRange(30)} className={`px-3 py-1 rounded text-sm ${chartRange===30? 'bg-ink text-parchment':'text-ink-faint hover:text-ink'}`}>30d</button>
              </div>
            </div>
            <div className="w-full h-40">
              <TimeSeriesChart data={chartSeries} />
            </div>
          </div>

          {/* Resumen mensual (bar chart) + total histórico */}
          <div className="mt-2 bg-white border border-border rounded-[6px] p-6" style={{ marginTop: '10px', marginBottom: '10px' }}>
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-poem">Resumen mensual</h3>
                <p className="text-xs text-ink-faint font-sans mt-1">
                  {historicalTotals[monthlyMetric]} {historicalTotals[monthlyMetric] === 1 ? monthlyMetricSingular[monthlyMetric] : monthlyMetricLabels[monthlyMetric].toLowerCase()} en total histórico
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.keys(monthlyMetricLabels).map((key) => (
                  <button
                    key={key}
                    onClick={() => setMonthlyMetric(key)}
                    className={`px-3 py-1 rounded text-sm ${monthlyMetric === key ? 'bg-ink text-parchment' : 'text-ink-faint hover:text-ink'}`}
                  >
                    {monthlyMetricLabels[key]}
                  </button>
                ))}
                <select
                  value={resumenYear}
                  onChange={(e) => setResumenYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-[4px] bg-white border border-border text-sm font-sans text-ink"
                >
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="w-full h-40">
              <BarChart data={monthlySeriesByMetric[monthlyMetric]} unitLabel={monthlyMetricLabels[monthlyMetric].toLowerCase()} />
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
                      En: <span className="italic">{getPoemTitle(c.poemId, allPoemsForTitles)}</span>
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
                <div className="space-y-3" style={{ paddingLeft: '15px', paddingRight: '15px', paddingTop: '10px', paddingBottom: '10px' }}>
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
                    <div key={i} className="flex items-center gap-1.5 bg-parchment border border-border px-3 py-1.5 rounded-full text-sm" title={`En: ${getPoemTitle(r.poemId, allPoemsForTitles)}`}>
                      <span>{r.emoji}</span>
                    </div>
                  ))}
                  {reactions.length === 0 && <p className="text-sm text-ink-faint italic font-sans">No hay reacciones aún.</p>}
                </div>
              </section>
            </div>
          </div>
          </>
          )}

          {dashboardView === 'mensual' && (
          <>
          {/* Month + year picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-[4px] bg-white border border-border text-sm font-sans text-ink"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-[4px] bg-white border border-border text-sm font-sans text-ink"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 justify-center text-center">
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Lecturas</h3>
              <p className="text-4xl font-poem text-ink">{monthlyTotalViews}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Comentarios</h3>
              <p className="text-4xl font-poem text-ink">{monthlyComments.length}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Reacciones</h3>
              <p className="text-4xl font-poem text-ink">{monthlyReactionEvents.length}</p>
            </div>
            <div className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="text-[11px] tracking-[0.14em] uppercase text-ink-faint font-sans mb-2">Suscriptores</h3>
              <p className="text-4xl font-poem text-ink">{monthlySubscribers.length}</p>
            </div>
          </div>

          {/* Lecturas en el tiempo, scoped to the selected month */}
          <div className="bg-white border border-border rounded-[6px] p-6">
            <div className="mb-4">
              <h3 className="text-lg font-poem">Lecturas en el tiempo</h3>
              <p className="text-xs text-ink-faint font-sans mt-1">
                {monthlyTotalViews} lectura{monthlyTotalViews === 1 ? '' : 's'} en {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            {monthlyDailySeries.length > 0 ? (
              <div className="w-full h-40">
                <TimeSeriesChart data={monthlyDailySeries} />
              </div>
            ) : (
              <p className="text-sm text-ink-faint italic font-sans">Sin datos para este mes.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Comments this month */}
            <section className="bg-white border border-border rounded-[6px] p-6">
              <h3 className="font-poem text-xl mb-5 text-ink">
                Últimos Comentarios · {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {monthlyComments.slice(0, 10).map((c) => (
                  <div key={c.id} className="text-sm border-b border-border-light pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-sans font-medium text-ink text-[13px]">{c.name}</span>
                    </div>
                    <p className="font-poem italic text-ink-light mb-1.5">&ldquo;{c.text}&rdquo;</p>
                    <p className="text-xs text-ink-faint font-sans">
                      En: <span className="italic">{getPoemTitle(c.poemId, allPoemsForTitles)}</span>
                    </p>
                  </div>
                ))}
                {monthlyComments.length === 0 && (
                  <p className="text-sm text-ink-faint italic font-sans">Sin datos para este mes.</p>
                )}
              </div>
            </section>

            <div className="space-y-7">
              {/* Top poems this month */}
              <section className="bg-white border border-border rounded-[6px] p-6">
                <h3 className="font-poem text-xl mb-5 text-ink">
                  Poemas Más Leídos · {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <div className="space-y-3">
                  {monthlyTopPoems.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm font-sans">
                      <span className="text-ink-light truncate pr-4">{p.title}</span>
                      <span className="font-medium bg-parchment-warm px-2.5 py-1 rounded-full text-xs text-ink-muted shrink-0">
                        {p.views} lecturas
                      </span>
                    </div>
                  ))}
                  {monthlyTopPoems.length === 0 && (
                    <p className="text-sm text-ink-faint italic font-sans">Sin datos para este mes.</p>
                  )}
                </div>
              </section>

              {/* Reactions this month */}
              <section className="bg-white border border-border rounded-[6px] p-6">
                <h3 className="font-poem text-xl mb-5 text-ink">
                  Reacciones Recientes · {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {monthlyReactionEvents.slice(0, 30).map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-parchment border border-border px-3 py-1.5 rounded-full text-sm" title={`En: ${getPoemTitle(r.poemId, allPoemsForTitles)}`}>
                      <span>{r.emoji}</span>
                    </div>
                  ))}
                  {monthlyReactionEvents.length === 0 && (
                    <p className="text-sm text-ink-faint italic font-sans">Sin datos para este mes.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
          </>
          )}

          {/* Manage Poems */}
          <section className="mt-14">
            <h3 className="font-poem text-2xl mb-5 text-ink">
              Mis Poemas Publicados
            </h3>
            <div className="bg-white border border-border rounded-[6px] overflow-hidden">
              {customPoems.length > 0 ? (
                <div className="divide-y divide-border-light">
                  {sortPoemsByNewest(customPoems).map((poem) => (
                    <div key={poem.id} className="flex items-center justify-between p-5 hover:bg-parchment-warm transition-colors duration-200">
                      <div className="flex-1 cursor-pointer min-w-0" onClick={() => navigate(`/poema/${getPoemSlug(poem)}`)}>
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

          {/* Newsletter subscribers */}
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-poem text-2xl text-ink">
                Suscriptores al boletín
              </h3>
              {subscribers.length > 0 && (
                <button
                  onClick={handleCopyEmails}
                  className="text-xs text-ink-faint hover:text-accent px-3 py-1.5 border border-border hover:border-accent/40 rounded-[4px] transition-colors font-sans"
                >
                  {copiedEmails ? '¡Copiado!' : 'Copiar todos los correos'}
                </button>
              )}
            </div>
            <div className="bg-white border border-border rounded-[6px] overflow-hidden">
              {subscribers.length > 0 ? (
                <div className="divide-y divide-border-light max-h-[400px] overflow-y-auto">
                  {subscribers.map((s) => (
                    <div key={s.email} className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <p className="text-sm text-ink truncate">{s.email}</p>
                        <p className="text-xs text-ink-faint font-sans mt-0.5">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSubscriber(s.email)}
                        className="text-xs text-ink-faint hover:text-accent px-3 py-1.5 border border-border hover:border-accent/40 rounded-[4px] transition-colors font-sans shrink-0 ml-4"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-ink-faint">
                  <p className="font-poem italic">Aún no tienes suscriptores.</p>
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
