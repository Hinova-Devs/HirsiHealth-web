import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { router } from './router';
import './index.css';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <RouterProvider router={router} />
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);
