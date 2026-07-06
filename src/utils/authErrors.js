// Translates Firebase Auth error codes into Spanish messages for the UI.
export function translateAuthError(error) {
  switch (error && error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta de nuevo más tarde.';
    case 'auth/email-already-in-use':
      return 'El correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/requires-recent-login':
      return 'Por seguridad, cierra sesión y vuelve a entrar antes de hacer este cambio.';
    default:
      return 'Ocurrió un error. Intenta de nuevo.';
  }
}
