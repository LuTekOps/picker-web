// Picker share link page (404.html, served for /p/{pollId}): vote in the browser without the app.
//
// For people who can't install the app (iPhone, desktop) or don't want to. Same rules as the app's guest access:
// 1. Year of birth + terms first (minimum age 16, as in the app). Under 16: nothing is created (an existing guest
//    access is deleted), the browser remembers only a "blocked" flag. A guest whose accepted terms version is
//    older than TERMS_VERSION is asked again, like in the app, and the new version goes into the same guest access.
// 2. A guest access (Supabase anonymous sign-in, with a Cloudflare Turnstile token like the app) carrying the
//    accepted terms version and client "web" in its metadata; run_retention deletes such guests 6 months after
//    their creation (privacy policy, section 10). The session stays in this browser's localStorage, so coming back
//    shows the own vote and the results.
// 3. get_poll / cast_vote, the same RPCs the app uses; RLS and the functions decide what may be seen.
// The Play badge passes the poll id on as install referrer, so the app opens the poll on its first start. On wide
// screens with a mouse a QR code (assets/vendor/qrcode.js, drawn here, no external service) carries the poll's link
// to a phone: there it opens in the app if installed, else on this page again.
(() => {
  'use strict';

  // Clickjacking guard, as on the other pages: never run inside another site's frame.
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location = window.self.location.href; } catch (e) { /* stays hidden */ }
    return;
  }

  // Public by design (the same anon key and site key ship in the app); access control lives in RLS.
  const SUPABASE_URL = 'https://glebczptvyoojznohtsc.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZWJjenB0dnlvb2p6bm9odHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzIwMjQsImV4cCI6MjEwNDIwODAyNH0.BGpBfEiayPSc5xAj8LYw-cqEZcRqIB4GFLYE6vGGS90';
  const TURNSTILE_SITE_KEY = '0x4AAAAAAFRKi8pTcNPGzBfH';
  // Must match Legal.TERMS_VERSION in the app: a guest created here counts as having accepted this version.
  const TERMS_VERSION = '2026-10-18';
  const MINIMUM_AGE = 16;
  const PLAY_URL = 'https://play.google.com/store/apps/details?id=ch.lutekops.picker';
  const SHARE_URL = 'https://picker.lutekops.ch/p/'; // App Links host (/.well-known/assetlinks.json)
  const SESSION_KEY = 'picker.webSession';
  const BLOCKED_KEY = 'picker.ageBlocked';

  const STRINGS = {
    en: {
      title: 'Picker · Poll',
      consentTitle: "You're invited to a poll",
      consentBody: 'Vote right here in your browser, no app and no account needed. Works on iPhone too.',
      consentUpdated: 'We have updated the Terms of Use and the Privacy Policy. Please confirm them to keep voting.',
      birthYear: 'Year of birth',
      birthYearPick: 'Choose',
      accept: 'I am at least {age} years old, accept the {terms} and have read the {privacy}.',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      continue: 'Continue to the poll',
      errorBirthYear: 'Please choose your year of birth.',
      errorAccept: 'Please accept the Terms of Use to continue.',
      errorNetwork: 'No connection. Check your internet and try again.',
      errorRateLimit: 'Too many attempts. Please wait a moment and try again.',
      errorCaptcha: "The security check didn't work. Please try again.",
      errorGeneric: 'Something went wrong. Please try again.',
      vote: 'Vote',
      by: 'by @{name}',
      endsAt: 'ends {date}',
      ended: 'ended',
      votesOne: '1 vote',
      votesOther: '{n} votes',
      yourVote: 'your vote',
      coinFlip: 'coin flip',
      votedStatus: 'Thanks for voting! Votes are final.',
      closedStatus: 'This poll has ended.',
      missingTitle: 'Poll not found',
      missingBody: 'It was deleted or hidden, or it is private. Private polls only open in the app for the people they were sent to.',
      blockedTitle: 'Picker is for ages 16 and up',
      blockedBody: "Based on your year of birth you can't use Picker yet. We keep no data about you; this browser only remembers this notice.",
      promo: 'Want to ask your own questions? Get the Picker app. It is Android-only for now.',
    },
    de: {
      title: 'Picker · Umfrage',
      consentTitle: 'Du bist zu einer Umfrage eingeladen',
      consentBody: 'Stimm direkt hier im Browser ab, ohne App und ohne Konto. Das geht auch auf dem iPhone.',
      consentUpdated: 'Wir haben die Nutzungsbedingungen und die Datenschutzerklärung aktualisiert. Bitte bestätige sie, um weiter abzustimmen.',
      birthYear: 'Geburtsjahr',
      birthYearPick: 'Auswählen',
      accept: 'Ich bin mindestens {age} Jahre alt, akzeptiere die {terms} und habe die {privacy} gelesen.',
      terms: 'Nutzungsbedingungen',
      privacy: 'Datenschutzerklärung',
      continue: 'Weiter zur Umfrage',
      errorBirthYear: 'Bitte wähle dein Geburtsjahr.',
      errorAccept: 'Bitte akzeptiere die Nutzungsbedingungen, um weiterzumachen.',
      errorNetwork: 'Keine Verbindung. Prüf dein Internet und versuch es nochmal.',
      errorRateLimit: 'Zu viele Versuche. Warte kurz und versuch es dann nochmal.',
      errorCaptcha: 'Die Sicherheitsprüfung hat nicht geklappt. Versuch es bitte nochmal.',
      errorGeneric: 'Etwas ist schiefgelaufen. Versuch es bitte nochmal.',
      vote: 'Abstimmen',
      by: 'von @{name}',
      endsAt: 'endet {date}',
      ended: 'beendet',
      votesOne: '1 Stimme',
      votesOther: '{n} Stimmen',
      yourVote: 'deine Wahl',
      coinFlip: 'Münzwurf',
      votedStatus: 'Danke fürs Abstimmen! Deine Stimme ist endgültig.',
      closedStatus: 'Diese Umfrage ist beendet.',
      missingTitle: 'Umfrage nicht gefunden',
      missingBody: 'Sie wurde gelöscht oder ausgeblendet, oder sie ist privat. Private Umfragen öffnen sich nur in der App und nur für die Leute, an die sie geschickt wurden.',
      blockedTitle: 'Picker ist ab 16',
      blockedBody: 'Nach deinem Geburtsjahr kannst du Picker noch nicht nutzen. Wir behalten keine Daten über dich; dieser Browser merkt sich nur diesen Hinweis.',
      promo: 'Selbst etwas fragen? Hol dir die Picker-App. Sie gibt es vorerst nur für Android.',
    },
    fr: {
      title: 'Picker · Sondage',
      consentTitle: 'Tu es invité·e à un sondage',
      consentBody: 'Vote directement ici dans ton navigateur, sans app et sans compte. Ça marche aussi sur iPhone.',
      consentUpdated: "Nous avons mis à jour les conditions d'utilisation et la politique de confidentialité. Confirme-les pour continuer à voter.",
      birthYear: 'Année de naissance',
      birthYearPick: 'Choisir',
      accept: "J'ai au moins {age} ans, j'accepte les {terms} et j'ai lu la {privacy}.",
      terms: "Conditions d'utilisation",
      privacy: 'Politique de confidentialité',
      continue: 'Continuer vers le sondage',
      errorBirthYear: 'Choisis ton année de naissance.',
      errorAccept: "Accepte les conditions d'utilisation pour continuer.",
      errorNetwork: 'Pas de connexion. Vérifie ton internet et réessaie.',
      errorRateLimit: 'Trop de tentatives. Attends un instant et réessaie.',
      errorCaptcha: "La vérification de sécurité n'a pas fonctionné. Réessaie.",
      errorGeneric: "Quelque chose n'a pas marché. Réessaie.",
      vote: 'Voter',
      by: 'par @{name}',
      endsAt: 'se termine le {date}',
      ended: 'terminé',
      votesOne: '1 vote',
      votesOther: '{n} votes',
      yourVote: 'ton choix',
      coinFlip: 'pile ou face',
      votedStatus: 'Merci pour ton vote! Il est définitif.',
      closedStatus: 'Ce sondage est terminé.',
      missingTitle: 'Sondage introuvable',
      missingBody: "Il a été supprimé ou masqué, ou il est privé. Les sondages privés s'ouvrent seulement dans l'app, pour les personnes à qui ils ont été envoyés.",
      blockedTitle: 'Picker, c’est à partir de 16 ans',
      blockedBody: "Selon ton année de naissance, tu ne peux pas encore utiliser Picker. Nous ne conservons aucun renseignement à ton sujet; ce navigateur se souvient seulement de cet avis.",
      promo: "Envie de poser tes propres questions? Télécharge l'app Picker. Elle existe pour l'instant seulement sur Android.",
    },
    it: {
      title: 'Picker · Sondaggio',
      consentTitle: 'Sei invitato/a a un sondaggio',
      consentBody: 'Vota direttamente qui nel browser, senza app e senza account. Funziona anche su iPhone.',
      consentUpdated: "Abbiamo aggiornato le Condizioni d'uso e l'Informativa sulla privacy. Confermale per continuare a votare.",
      birthYear: 'Anno di nascita',
      birthYearPick: 'Scegli',
      accept: 'Ho almeno {age} anni, accetto le {terms} e ho letto l’{privacy}.',
      terms: 'Condizioni d’uso',
      privacy: 'Informativa sulla privacy',
      continue: 'Vai al sondaggio',
      errorBirthYear: 'Scegli il tuo anno di nascita.',
      errorAccept: 'Accetta le condizioni d’uso per continuare.',
      errorNetwork: 'Nessuna connessione. Controlla internet e riprova.',
      errorRateLimit: 'Troppi tentativi. Aspetta un attimo e riprova.',
      errorCaptcha: 'Il controllo di sicurezza non è riuscito. Riprova.',
      errorGeneric: 'Qualcosa è andato storto. Riprova.',
      vote: 'Vota',
      by: 'di @{name}',
      endsAt: 'termina il {date}',
      ended: 'terminato',
      votesOne: '1 voto',
      votesOther: '{n} voti',
      yourVote: 'la tua scelta',
      coinFlip: 'lancio della moneta',
      votedStatus: 'Grazie per aver votato! Il voto è definitivo.',
      closedStatus: 'Questo sondaggio è terminato.',
      missingTitle: 'Sondaggio non trovato',
      missingBody: 'È stato eliminato o nascosto, oppure è privato. I sondaggi privati si aprono solo nell’app, per le persone a cui sono stati inviati.',
      blockedTitle: 'Picker è dai 16 anni in su',
      blockedBody: 'In base al tuo anno di nascita non puoi ancora usare Picker. Non conserviamo alcun dato su di te; questo browser ricorda solo questo avviso.',
      promo: 'Vuoi fare le tue domande? Scarica l’app Picker. Per ora esiste solo per Android.',
    },
    es: {
      title: 'Picker · Encuesta',
      consentTitle: 'Te invitaron a una encuesta',
      consentBody: 'Vota aquí mismo en tu navegador, sin app y sin cuenta. También funciona en iPhone.',
      consentUpdated: 'Hemos actualizado las condiciones de uso y la política de privacidad. Confírmalas para seguir votando.',
      birthYear: 'Año de nacimiento',
      birthYearPick: 'Elegir',
      accept: 'Tengo al menos {age} años, acepto las {terms} y he leído la {privacy}.',
      terms: 'Condiciones de uso',
      privacy: 'Política de privacidad',
      continue: 'Ir a la encuesta',
      errorBirthYear: 'Elige tu año de nacimiento.',
      errorAccept: 'Acepta las condiciones de uso para continuar.',
      errorNetwork: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
      errorRateLimit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
      errorCaptcha: 'La verificación de seguridad no funcionó. Inténtalo de nuevo.',
      errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
      vote: 'Votar',
      by: 'de @{name}',
      endsAt: 'termina el {date}',
      ended: 'terminada',
      votesOne: '1 voto',
      votesOther: '{n} votos',
      yourVote: 'tu elección',
      coinFlip: 'cara o cruz',
      votedStatus: '¡Gracias por votar! Tu voto es definitivo.',
      closedStatus: 'Esta encuesta ha terminado.',
      missingTitle: 'Encuesta no encontrada',
      missingBody: 'Se eliminó u ocultó, o es privada. Las encuestas privadas solo se abren en la app, para las personas a quienes se enviaron.',
      blockedTitle: 'Picker es a partir de 16 años',
      blockedBody: 'Según tu año de nacimiento todavía no puedes usar Picker. No conservamos ningún dato sobre ti; este navegador solo recuerda este aviso.',
      promo: '¿Quieres hacer tus propias preguntas? Descarga la app Picker. Por ahora solo existe para Android.',
    },
    pt: {
      title: 'Picker · Enquete',
      consentTitle: 'Você foi convidado/a para uma enquete',
      consentBody: 'Vote aqui mesmo no navegador, sem app e sem conta. Funciona também no iPhone.',
      consentUpdated: 'Atualizamos os Termos de uso e a Política de privacidade. Confirme-os para continuar votando.',
      birthYear: 'Ano de nascimento',
      birthYearPick: 'Escolher',
      accept: 'Tenho pelo menos {age} anos, aceito os {terms} e li a {privacy}.',
      terms: 'Termos de Uso',
      privacy: 'Política de Privacidade',
      continue: 'Ir para a enquete',
      errorBirthYear: 'Escolha seu ano de nascimento.',
      errorAccept: 'Aceite os Termos de Uso para continuar.',
      errorNetwork: 'Sem conexão. Verifique sua internet e tente de novo.',
      errorRateLimit: 'Tentativas demais. Espere um pouco e tente de novo.',
      errorCaptcha: 'A verificação de segurança não funcionou. Tente de novo.',
      errorGeneric: 'Algo deu errado. Tente de novo.',
      vote: 'Votar',
      by: 'de @{name}',
      endsAt: 'termina em {date}',
      ended: 'encerrada',
      votesOne: '1 voto',
      votesOther: '{n} votos',
      yourVote: 'sua escolha',
      coinFlip: 'cara ou coroa',
      votedStatus: 'Obrigado por votar! Seu voto é definitivo.',
      closedStatus: 'Esta enquete foi encerrada.',
      missingTitle: 'Enquete não encontrada',
      missingBody: 'Ela foi excluída ou ocultada, ou é privada. Enquetes privadas só abrem no app, para as pessoas a quem foram enviadas.',
      blockedTitle: 'O Picker é a partir de 16 anos',
      blockedBody: 'Pelo seu ano de nascimento você ainda não pode usar o Picker. Não guardamos nenhum dado sobre você; este navegador só lembra este aviso.',
      promo: 'Quer fazer suas próprias perguntas? Baixe o app Picker. Por enquanto ele só existe para Android.',
    },
  };

  const $ = (id) => document.getElementById(id);
  const match = location.pathname.match(/^\/p\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/?$/);
  if (!match) return; // Any other unknown path: the static page stays as it is.
  const pollId = match[1].toLowerCase();

  // ---- Language: chosen by assets/lang.js (?lang=…, else the browser's languages, else English).
  const lang = STRINGS[window.pickerLang] ? window.pickerLang : 'en'; // assets/lang.js
  const t = STRINGS[lang];
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t[el.dataset.i18n]; });

  // ---- The app: Play link with the poll as install referrer, one line in the page's language, QR code to the poll.
  $('play').href = PLAY_URL + '&referrer=' + encodeURIComponent('poll=' + pollId + '&utm_source=share');
  $('promo-note').textContent = t.promo;
  drawQr($('qr-code'), SHARE_URL + pollId);

  // Dark modules as one SVG path on a white square with the standard 4-module quiet zone (white in dark mode too,
  // so every camera reads it). Only DOM calls, no markup strings.
  function drawQr(svg, text) {
    if (typeof qrcode !== 'function') return; // vendor script missing: the badge is enough
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const size = n + 8;
    const d = 'M0 0h' + size + 'v' + size + 'h-' + size + 'z';
    let ink = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ink += 'M' + (c + 4) + ' ' + (r + 4) + 'h1v1h-1z';
      }
    }
    const NS = 'http://www.w3.org/2000/svg';
    const bg = document.createElementNS(NS, 'path');
    bg.setAttribute('d', d);
    bg.setAttribute('fill', '#ffffff');
    const fg = document.createElementNS(NS, 'path');
    fg.setAttribute('d', ink);
    fg.setAttribute('fill', '#0f172a');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.replaceChildren(bg, fg);
    $('qr').hidden = false;
  }

  // ---- Storage: every access can throw (private mode, blocked site data); the page then just forgets.
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* not kept */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* nothing to do */ } },
  };

  const views = ['view-intro', 'view-consent', 'view-poll', 'view-missing', 'view-blocked'];
  function show(view) {
    views.forEach((v) => { $(v).hidden = v !== view; });
    // No app advertising to someone who is too young for it.
    document.querySelector('.promo').hidden = view === 'view-blocked';
  }
  function setError(id, message) {
    $(id).textContent = message || '';
    $(id).hidden = !message;
  }
  function busy(button, on) {
    button.disabled = on;
    button.querySelector('.spinner').hidden = !on;
  }

  // ---- HTTP
  async function request(path, { method = 'POST', body, token } = {}) {
    let res;
    try {
      res = await fetch(SUPABASE_URL + path, {
        method,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + (token || SUPABASE_ANON_KEY),
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
      });
    } catch (e) {
      return { ok: false, network: true };
    }
    let json = null;
    try { json = await res.json(); } catch (e) { /* empty body */ }
    return { ok: res.ok, status: res.status, json };
  }

  // ---- Session (guest access), kept in this browser
  let session = null;
  try { session = JSON.parse(store.get(SESSION_KEY) || 'null'); } catch (e) { session = null; }

  function keep(json) {
    session = {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: json.expires_at || Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
    };
    store.set(SESSION_KEY, JSON.stringify(session));
  }
  function forget() {
    session = null;
    store.remove(SESSION_KEY);
  }
  async function refresh() {
    const res = await request('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } });
    if (res.network) return 'network';
    if (!res.ok || !res.json || !res.json.access_token) { forget(); return 'gone'; }
    keep(res.json);
    return 'ok';
  }
  async function rpc(name, body) {
    if (session.expires_at - 60 < Date.now() / 1000) {
      const r = await refresh();
      if (r !== 'ok') return { ok: false, network: r === 'network', gone: r === 'gone' };
    }
    let res = await request('/rest/v1/rpc/' + name, { body, token: session.access_token });
    if (res.status === 401) {
      const r = await refresh();
      if (r !== 'ok') return { ok: false, network: r === 'network', gone: r === 'gone' };
      res = await request('/rest/v1/rpc/' + name, { body, token: session.access_token });
    }
    return res;
  }

  // The terms version this guest accepted, from the access token's user_metadata (null: unreadable or none).
  function acceptedVersion(token) {
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(part + '='.repeat((4 - (part.length % 4)) % 4)), (c) => c.charCodeAt(0));
      const claims = JSON.parse(new TextDecoder().decode(bytes));
      return (claims.user_metadata && claims.user_metadata.terms_version) || null;
    } catch (e) {
      return null;
    }
  }
  const needsConsent = () => {
    const accepted = session && acceptedVersion(session.access_token);
    return !accepted || accepted < TERMS_VERSION;
  };

  // Records the current terms version in the existing guest access (as acceptTerms does in the app).
  // 'ok', 'network', or 'gone' when the guest access no longer exists.
  async function acceptAgain() {
    const body = { data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() } };
    let res = await request('/auth/v1/user', { method: 'PUT', body, token: session.access_token });
    if (res.status === 401 || res.status === 403) {
      const r = await refresh();
      if (r !== 'ok') return r;
      res = await request('/auth/v1/user', { method: 'PUT', body, token: session.access_token });
    }
    if (res.network) return 'network';
    if (!res.ok) { forget(); return 'gone'; }
    // A fresh token carries the new version, so the next visit does not ask again.
    const r = await refresh();
    return r === 'network' ? 'ok' : r;
  }

  // Under 16 with an existing guest access: delete it, as the app does (best effort; it expires anyway).
  async function deleteGuest() {
    if (!session) return;
    await rpc('delete_guest', {});
    forget();
  }

  // ---- Turnstile: loaded only when a guest access is about to be created.
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

  // ---- 1. Consent
  function showConsent() {
    const select = $('birth-year');
    if (select.options.length === 1) {
      // All years, so the list itself doesn't give away the answer (as in the app).
      const year = new Date().getFullYear();
      for (let y = year; y >= year - 100; y--) select.add(new Option(String(y), String(y)));
    }
    const link = (href, text) => { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text; return a; };
    const parts = t.accept.split(/(\{\w+\})/);
    $('accept-text').replaceChildren(...parts.map((part) => {
      if (part === '{age}') return String(MINIMUM_AGE);
      if (part === '{terms}') return link('/terms/#' + lang, t.terms);
      if (part === '{privacy}') return link('/privacy/#' + lang, t.privacy);
      return part;
    }));
    document.querySelector('#view-consent [data-i18n="consentBody"]').textContent = session ? t.consentUpdated : t.consentBody;
    show('view-consent');
  }

  $('consent-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('consent-error', null);
    const birthYear = parseInt($('birth-year').value, 10);
    if (!birthYear) { setError('consent-error', t.errorBirthYear); return; }
    // Born in that year, someone is at least 16 by the end of this year; the checkbox covers the rest (as in the app).
    if (new Date().getFullYear() - birthYear < MINIMUM_AGE) {
      store.set(BLOCKED_KEY, '1');
      show('view-blocked');
      deleteGuest();
      return;
    }
    if (!$('accept').checked) { setError('consent-error', t.errorAccept); return; }

    const button = $('consent-submit');
    busy(button, true);
    try {
      if (session) {
        // A returning guest accepts the new version in the same guest access.
        const r = await acceptAgain();
        if (r === 'network') { setError('consent-error', t.errorNetwork); return; }
        if (r === 'ok') { await loadPoll(); return; }
        // 'gone': the guest access was deleted meanwhile; create a new one below.
      }
      let token;
      try { token = await captchaToken(); } catch (e) { setError('consent-error', t.errorCaptcha); return; }
      const res = await request('/auth/v1/signup', {
        body: {
          data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString(), client: 'web' },
          gotrue_meta_security: { captcha_token: token },
        },
      });
      if (res.network) { setError('consent-error', t.errorNetwork); return; }
      if (res.status === 429) { setError('consent-error', t.errorRateLimit); return; }
      if (!res.ok || !res.json || !res.json.access_token) {
        const captcha = res.json && /captcha/i.test(JSON.stringify(res.json));
        setError('consent-error', captcha ? t.errorCaptcha : t.errorGeneric);
        return;
      }
      keep(res.json);
      await loadPoll();
    } finally {
      busy(button, false);
    }
  });

  // ---- 2. The poll
  const dateFormat = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' });
  let poll = null;
  let chosen = null;

  async function loadPoll() {
    const res = await rpc('get_poll', { p_poll_id: pollId });
    if (res.gone) { showConsent(); return; }
    if (res.network) { show('view-poll'); setError('vote-error', t.errorNetwork); return; }
    if (res.status === 404 || res.status === 400) { show('view-missing'); return; }
    if (!res.ok || !res.json) { show('view-poll'); setError('vote-error', t.errorGeneric); return; }
    render(res.json);
  }

  async function image(path) {
    const img = document.createElement('img');
    img.alt = '';
    img.className = 'thumb';
    try {
      const res = await fetch(SUPABASE_URL + '/storage/v1/object/authenticated/poll-media/' + path.split('/').map(encodeURIComponent).join('/'), {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + session.access_token },
      });
      if (res.ok) img.src = URL.createObjectURL(await res.blob());
    } catch (e) { /* no picture, the label still shows */ }
    return img;
  }

  function render(data) {
    poll = data;
    chosen = null;
    setError('vote-error', null);
    const ended = poll.closed_at || new Date(poll.expires_at) <= new Date();
    const meta = [];
    if (poll.creator_username) meta.push(fill(t.by, { name: poll.creator_username }));
    meta.push(ended ? t.ended : fill(t.endsAt, { date: dateFormat.format(new Date(poll.expires_at)) }));
    $('poll-meta').textContent = meta.join(' · ');
    $('poll-title').textContent = poll.title;

    const options = (poll.options || []).slice().sort((a, b) => a.position - b.position);
    const voted = !!poll.my_option_id;
    const canVote = !voted && !ended;
    $('vote-form').hidden = !canVote;
    $('results').hidden = canVote;
    $('poll-status').textContent = voted ? t.votedStatus : ended ? t.closedStatus : '';

    if (canVote) {
      $('vote-submit').disabled = true;
      $('choices').replaceChildren(...options.map((o) => {
        const row = document.createElement('label');
        row.className = 'choice';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = o.id;
        input.addEventListener('change', () => { chosen = o.id; $('vote-submit').disabled = false; });
        const text = document.createElement('span');
        text.textContent = o.label || '';
        row.append(input);
        if (o.image_path) image(o.image_path).then((img) => row.insertBefore(img, text));
        row.append(text);
        return row;
      }));
    } else {
      const total = poll.vote_total || 0;
      const head = document.createElement('p');
      head.className = 'note';
      head.textContent = total === 1 ? t.votesOne : fill(t.votesOther, { n: total });
      $('results').replaceChildren(head, ...options.map((o) => {
        const count = typeof o.vote_count === 'number' ? o.vote_count : null;
        const pct = count === null || total === 0 ? 0 : Math.round((count / total) * 100);
        const row = document.createElement('div');
        row.className = 'result' + (o.id === poll.my_option_id ? ' mine' : '');
        const line = document.createElement('div');
        line.className = 'result-line';
        const label = document.createElement('span');
        label.className = 'result-label';
        const tags = [];
        if (o.id === poll.my_option_id) tags.push(t.yourVote);
        if (o.id === poll.tiebreak_option_id) tags.push(t.coinFlip);
        label.textContent = (o.label || '') + (tags.length ? ' · ' + tags.join(' · ') : '');
        const value = document.createElement('span');
        value.className = 'pct';
        value.textContent = count === null ? '' : pct + ' %';
        line.append(label, value);
        if (o.image_path) image(o.image_path).then((img) => line.prepend(img));
        const bar = document.createElement('div');
        bar.className = 'bar';
        const fillEl = document.createElement('div');
        fillEl.style.width = pct + '%';
        bar.append(fillEl);
        row.append(line, bar);
        return row;
      }));
    }
    show('view-poll');
  }

  $('vote-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!chosen) return;
    setError('vote-error', null);
    const button = $('vote-submit');
    busy(button, true);
    try {
      const res = await rpc('cast_vote', { p_poll_id: pollId, p_option_id: chosen });
      if (res.gone) { showConsent(); return; }
      if (res.network) { setError('vote-error', t.errorNetwork); return; }
      if (res.status === 404) { show('view-missing'); return; }
      const hint = res.json && res.json.hint;
      if (hint === 'already_voted' || hint === 'poll_closed') { await loadPoll(); return; }
      if (!res.ok || !res.json) { setError('vote-error', t.errorGeneric); return; }
      render(res.json);
    } finally {
      busy(button, false);
    }
  });

  // ---- Start
  if (store.get(BLOCKED_KEY)) { show('view-blocked'); return; }
  if (session && !(session.access_token && session.refresh_token)) forget();
  if (session && !needsConsent()) { loadPoll(); } else { showConsent(); }
})();
