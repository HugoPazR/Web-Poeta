import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../utils/firebaseClient';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(() => (
    localStorage.getItem('letrasdepaz_dark') === 'true' ||
    (!('letrasdepaz_dark' in localStorage) &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem('letrasdepaz_dark', newDark);
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  const navLinkClass = (active) =>
    `rounded-none px-5 py-2 text-[12px] sm:text-sm font-medium tracking-wide uppercase transition-colors duration-300 no-underline ${
      active
        ? 'text-accent'
        : 'text-ink-faint hover:text-ink-light'
    }`;

  return (
    <header className="sticky top-0 z-50 glass transition-all duration-300 mb-10">
      <div className="max-w-8xl mx-auto p-10 page-padding flex items-center justify-between gap-4" style={{ paddingLeft: '15px', paddingRight: '15px', paddingTop: '0px', paddingBottom: '0px', marginTop: '10px', marginBottom: '10px' }}>
        <Link to="/" className="group flex items-center gap-3 no-underline shrink-0" id="header-logo">
          <img src="/assets/Logo_Letras_de_Paz.png" alt="Letras de Paz" className="h-9 w-9 object-contain rounded-full shadow-[0_10px_24px_-14px_rgba(31,37,32,0.75)] transition-transform duration-300 group-hover:-rotate-6" />
          <h1 className="font-poem text-2xl md:text-[30px] font-semibold text-ink tracking-normal leading-none">
            Letras de Paz
          </h1>
        </Link>

        <nav className="flex items-center gap-4 overflow-x-auto">
          <button
            onClick={toggleDarkMode}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-none text-ink-faint hover:text-accent transition-colors duration-300 cursor-pointer bg-transparent border-none"
            title="Cambiar tema"
            aria-label="Cambiar tema"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <Link to="/" className={navLinkClass(isHome)} id="nav-home">
            Poemas   
          </Link>
          <Link to="/sobre-mi" className={navLinkClass(location.pathname === '/sobre-mi')} id="nav-about">
            Sobre mí  
          </Link>

          {user ? (
            <>
              {user.isAdmin && (
                <Link to="/admin" className={navLinkClass(location.pathname === '/admin')}>
                  Panel
                </Link>
              )}
              <Link to="/perfil" className={navLinkClass(location.pathname === '/perfil')}>
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-none px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-300 text-ink-faint hover:text-red-500 cursor-pointer bg-transparent border-none"
              >
                Salir 
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkClass(location.pathname === '/login')}>
                Entrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
