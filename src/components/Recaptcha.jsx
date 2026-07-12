import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';

let scriptPromise = null;
function loadRecaptchaScript() {
  if (window.grecaptcha) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      window.onRecaptchaScriptLoad = resolve;
      const script = document.createElement('script');
      script.src = `${SCRIPT_SRC}&onload=onRecaptchaScriptLoad`;
      script.async = true;
      script.defer = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// eslint-disable-next-line react-refresh/only-export-components -- conventional component+helper pairing, mirrors emailClient.js's hasEmailConfig()
export function hasRecaptchaConfig() {
  return Boolean(SITE_KEY);
}

const Recaptcha = forwardRef(function Recaptcha({ onChange }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
        onChange(null);
      }
    },
  }));

  useEffect(() => {
    if (!hasRecaptchaConfig() || !containerRef.current) return;
    let cancelled = false;

    loadRecaptchaScript().then(() => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChange(token),
        'expired-callback': () => onChange(null),
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- render the widget once; onChange identity changes shouldn't re-render it
  }, []);

  if (!hasRecaptchaConfig()) return null;

  return <div ref={containerRef} />;
});

export default Recaptcha;
