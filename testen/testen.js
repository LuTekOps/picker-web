// Tester sign-up page (testen/index.html) for the closed test on Google Play.
//
// German only. Sends the form to the edge function tester-signup: a Cloudflare Turnstile token proves it is
// a person, the function checks it, stores the sign-up in tester_signups and emails it to the developer. No account and no guest access are
// created, and nothing is kept in this browser.
(() => {
  'use strict';

  // Clickjacking guard, as on the other pages: never run inside another site's frame.
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location = window.self.location.href; } catch (e) { /* stays hidden */ }
    return;
  }

  // Public by design (the same site key ships in the app and on the share link page).
  const FUNCTION_URL = 'https://glebczptvyoojznohtsc.supabase.co/functions/v1/tester-signup';
  const TURNSTILE_SITE_KEY = '0x4AAAAAAFRKi8pTcNPGzBfH';
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const AD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  const t = {
    errorName: 'Bitte gib deinen Namen ein.',
    errorEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    errorAdid: 'Das ist keine Werbe-ID. Sie sieht so aus: 38400000-8cf0-11bd-b23e-10b96e40000d. Wo du sie findest, steht oben unter «Deine Werbe-ID finden».',
    errorPhone: 'Bitte gib deine Handynummer ein.',
    errorCaptcha: 'Die Sicherheitsprüfung hat nicht geklappt. Bitte versuch es nochmal.',
    errorNetwork: 'Keine Verbindung. Prüf dein Internet und versuch es nochmal.',
    errorRateLimit: 'Zu viele Versuche. Warte kurz und versuch es nochmal.',
    errorFull: 'Der Test ist gerade voll. Danke, dass du helfen wolltest!',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuch es nochmal.',
  };
  const lang = 'de';
  const $ = (id) => document.getElementById(id);

  function setError(message, fieldId) {
    document.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    if (fieldId) $(fieldId).classList.add('invalid');
    $('signup-error').textContent = message || '';
    $('signup-error').hidden = !message;
  }
  function busy(on) {
    const button = $('signup-submit');
    button.disabled = on;
    button.querySelector('.spinner').hidden = !on;
  }

  // ---- Turnstile: loaded only when the form is sent.
  let turnstileLoaded = null;
  function loadTurnstile() {
    turnstileLoaded = turnstileLoaded || new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => { turnstileLoaded = null; reject(new Error('turnstile')); };
      document.head.appendChild(script);
    });
    return turnstileLoaded;
  }
  async function captchaToken() {
    const turnstile = await loadTurnstile();
    return new Promise((resolve, reject) => {
      $('captcha').replaceChildren();
      turnstile.render('#captcha', {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: 'interaction-only',
        language: lang,
        callback: resolve,
        'error-callback': () => reject(new Error('turnstile')),
        'expired-callback': () => reject(new Error('turnstile')),
      });
    });
  }

  $('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('name').value.trim();
    const email = $('email').value.trim().toLowerCase();
    const adId = $('adid').value.trim().toLowerCase();
    const phone = $('phone').value.trim();
    if (!name) { setError(t.errorName, 'field-name'); $('name').focus(); return; }
    if (!EMAIL_PATTERN.test(email)) { setError(t.errorEmail, 'field-email'); $('email').focus(); return; }
    if (!AD_ID_PATTERN.test(adId) || /^[0-]+$/.test(adId)) { setError(t.errorAdid, 'field-adid'); $('adid').focus(); return; }
    if (phone.replace(/\D/g, '').length < 6) { setError(t.errorPhone, 'field-phone'); $('phone').focus(); return; }
    setError(null);

    busy(true);
    try {
      let token;
      try { token = await captchaToken(); } catch (e) { setError(t.errorCaptcha); return; }
      let res;
      try {
        res = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, ad_id: adId, phone, lang, captcha_token: token }),
          cache: 'no-store',
        });
      } catch (e) {
        setError(t.errorNetwork);
        return;
      }
      let json = null;
      try { json = await res.json(); } catch (e) { /* empty body */ }
      if (res.ok) {
        $('view-form').hidden = true;
        $('view-done').hidden = false;
        $('done-title').focus();
        return;
      }
      const code = json && json.error;
      if (res.status === 429) setError(t.errorRateLimit);
      else if (code === 'captcha') setError(t.errorCaptcha);
      else if (code === 'full') setError(t.errorFull);
      else if (code === 'invalid_email') setError(t.errorEmail, 'field-email');
      else if (code === 'invalid_ad_id') setError(t.errorAdid, 'field-adid');
      else if (code === 'invalid_phone') setError(t.errorPhone, 'field-phone');
      else setError(t.errorGeneric);
    } finally {
      busy(false);
    }
  });
})();
