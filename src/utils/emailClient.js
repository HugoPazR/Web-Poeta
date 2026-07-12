// EmailJS wrapper for the contact form and new-poem subscriber notifications.
// Configure in .env.local (see .env.local.example).

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const NOTIFY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_NOTIFY_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function hasEmailConfig() {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

// Contact form template must define variables: from_name, reply_to, message.
export async function sendContactMessage({ name, email, message }) {
  if (!hasEmailConfig()) {
    throw new Error('EmailJS not configured');
  }
  const { default: emailjs } = await import('@emailjs/browser');
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { from_name: name, reply_to: email, message },
    { publicKey: PUBLIC_KEY }
  );
}

export function hasNotifyConfig() {
  return Boolean(SERVICE_ID && NOTIFY_TEMPLATE_ID && PUBLIC_KEY);
}

// New-poem notification template must define variables: to_email, poem_title,
// poem_excerpt, poem_url — and its "To Email" field must be set to {{to_email}}.
export async function notifySubscriber(toEmail, { title, excerpt, url }) {
  if (!hasNotifyConfig()) {
    throw new Error('EmailJS notify template not configured');
  }
  const { default: emailjs } = await import('@emailjs/browser');
  await emailjs.send(
    SERVICE_ID,
    NOTIFY_TEMPLATE_ID,
    { to_email: toEmail, poem_title: title, poem_excerpt: excerpt, poem_url: url },
    { publicKey: PUBLIC_KEY }
  );
}
