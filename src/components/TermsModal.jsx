import Modal from './Modal';

const sectionHeading = 'font-poem text-xl font-semibold text-ink mb-2 mt-6 first:mt-0';
const sectionBody = 'text-ink-light text-[14px] leading-6 mb-3';

export default function TermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Términos y Condiciones y Política de Privacidad">
      <h3 className={sectionHeading}>Términos y Condiciones</h3>

      <p className={sectionBody}>
        <strong>1. Aceptación de los términos.</strong> Al crear una cuenta o usar este sitio, aceptas estos Términos y Condiciones
        y la Política de Privacidad descrita más abajo.
      </p>
      <p className={sectionBody}>
        <strong>2. Descripción del servicio.</strong> Letras de Paz es un archivo personal de poesía donde puedes leer poemas,
        dejar comentarios, reaccionar con emojis y, opcionalmente, suscribirte a un boletín para enterarte de nuevos poemas.
      </p>
      <p className={sectionBody}>
        <strong>3. Registro de cuenta.</strong> Debes proporcionar información correcta al registrarte y eres responsable de
        mantener segura tu contraseña. Cada cuenta es de uso personal.
      </p>
      <p className={sectionBody}>
        <strong>4. Conducta del usuario.</strong> Los comentarios deben ser respetuosos y no contener spam, acoso ni contenido
        ilegal. El autor puede moderar, editar o eliminar comentarios, y suspender cuentas que incumplan esta norma.
      </p>
      <p className={sectionBody}>
        <strong>5. Propiedad intelectual.</strong> Los poemas y el contenido del sitio son propiedad del autor. Los comentarios
        que publiques siguen siendo tuyos, pero autorizas su publicación y visualización en el sitio.
      </p>
      <p className={sectionBody}>
        <strong>6. Cambios al servicio.</strong> El autor puede modificar, agregar o discontinuar funciones del sitio en cualquier momento.
      </p>
      <p className={sectionBody}>
        <strong>7. Limitación de responsabilidad.</strong> El servicio se ofrece "tal cual", sin garantía de disponibilidad
        continua o libre de errores.
      </p>
      <p className={sectionBody}>
        <strong>8. Terminación de cuenta.</strong> Puedes eliminar tu cuenta cuando quieras. El autor puede terminar cuentas que
        incumplan estos términos.
      </p>
      <p className={sectionBody}>
        <strong>9. Contacto.</strong> Para preguntas sobre estos términos, escribe a través de la página de{' '}
        <a href="/contacto" className="text-accent hover:underline transition-colors duration-300">Contacto</a>.
      </p>

      <h3 className={sectionHeading}>Política de Privacidad</h3>

      <p className={sectionBody}>
        <strong>1. Datos que recopilamos.</strong> Nombre, correo electrónico y contraseña (gestionada por Firebase Authentication,
        nunca almacenada en texto plano por este sitio), los comentarios y reacciones asociados a tu cuenta, y tu correo si te
        suscribes al boletín.
      </p>
      <p className={sectionBody}>
        <strong>2. Cómo usamos tus datos.</strong> Para autenticarte, mostrar tu nombre en tus comentarios, enviarte el boletín
        de nuevos poemas si te suscribiste, y responder mensajes que envíes por el formulario de contacto.
      </p>
      <p className={sectionBody}>
        <strong>3. Base legal.</strong> Tratamos tus datos con base en el consentimiento que otorgas al registrarte (mediante la
        casilla de aceptación) y en el uso continuo del servicio.
      </p>
      <p className={sectionBody}>
        <strong>4. Con quién compartimos datos.</strong> Usamos Firebase (Google) para autenticación y almacenamiento, EmailJS
        para el envío de correos, y Google reCAPTCHA para verificar que los registros no sean automatizados. Cada uno de estos
        proveedores se rige por sus propias políticas de privacidad.
      </p>
      <p className={sectionBody}>
        <strong>5. Conservación de datos.</strong> Tus datos se conservan mientras tu cuenta esté activa y se eliminan si
        solicitas el cierre de tu cuenta.
      </p>
      <p className={sectionBody}>
        <strong>6. Tus derechos.</strong> Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento.
      </p>
      <p className={sectionBody}>
        <strong>7. Seguridad.</strong> Aplicamos medidas razonables para proteger tu información; las contraseñas nunca se
        almacenan en texto plano.
      </p>
      <p className={sectionBody}>
        <strong>8. Menores de edad.</strong> Este servicio no está dirigido a menores de 13 años.
      </p>
      <p className={sectionBody}>
        <strong>9. Cambios a esta política.</strong> Podemos actualizar esta política ocasionalmente; la fecha de la versión
        vigente se indicará aquí.
      </p>
      <p className={sectionBody}>
        <strong>10. Contacto.</strong> Para ejercer tus derechos o resolver dudas sobre tus datos, escríbenos desde la página de{' '}
        <a href="/contacto" className="text-accent hover:underline transition-colors duration-300">Contacto</a>.
      </p>
    </Modal>
  );
}
