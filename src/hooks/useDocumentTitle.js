import { useEffect } from 'react';

const SITE_NAME = 'Letras de Paz';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
