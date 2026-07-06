// The poet's account. Admin UI is gated on this client-side; the real security boundary
// is the Firestore rule that checks request.auth.token.email against this same address.
export const ADMIN_EMAIL = 'poeta@letrasdepaz.com';
