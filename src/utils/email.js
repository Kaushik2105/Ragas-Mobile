export const EMAILJS_SERVICE_ID = 'service_assbfr8';
export const EMAILJS_RESET_TEMPLATE_ID = 'template_2gqin32';
export const EMAILJS_WELCOME_TEMPLATE_ID = 'template_3lq6w1v';
export const EMAILJS_PUBLIC_KEY = 'ocRaySd72sJfW-_7m';
export const EMAILJS_PRIVATE_KEY = 'fARHhyG6Ck5GPECAjJ4OR';
export const WEB_APP_URL = 'https://ragas-frontend.netlify.app/';

const hasEmailConfig = (templateId) =>
  templateId &&
  !templateId.startsWith('TODO_') &&
  EMAILJS_PUBLIC_KEY &&
  !EMAILJS_PUBLIC_KEY.startsWith('TODO_');

const sendEmailJS = async (templateId, templateParams) => {
  if (!hasEmailConfig(templateId)) {
    console.warn(`EmailJS configuration missing or invalid for template: ${templateId}`);
    return;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const message = `EmailJS request failed: ${response.status} ${text}.`;
    console.error(message);
    throw new Error(message);
  }

  return response;
};

export const sendWelcomeEmail = async ({ email, name }) => {
  return sendEmailJS(EMAILJS_WELCOME_TEMPLATE_ID, {
    to_email: email,
    to_name: name || email,
    app_name: 'RAGAS',
    login_link: WEB_APP_URL,
  });
};

export const sendResetEmail = async ({ email, name, resetLink }) => {
  return sendEmailJS(EMAILJS_RESET_TEMPLATE_ID, {
    to_email: email,
    to_name: name || email,
    reset_link: resetLink,
    app_name: 'RAGAS',
  });
};



