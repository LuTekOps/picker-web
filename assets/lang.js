// Page language for every page of the site, loaded before the page's own script.
//
// Order: ?lang=xx, then the browser's preferred languages (navigator.languages), else English. The choice goes
// into <html lang> and <html data-lang>; picker.css then shows only the matching text of static translations:
//   <span class="i18n"><span lang="en">…</span><span lang="de">…</span>…</span>   (English without JavaScript)
//   <article lang="xx"> on the legal pages                                        (all languages without JavaScript)
// <html data-title-xx> sets the tab title. The page scripts read window.pickerLang for their STRINGS tables.
// On the legal pages a link to another language's section (#fr, #de-verantwortlicher) switches the language.
(() => {
  'use strict';
  const SUPPORTED = ['en', 'de', 'fr', 'it', 'es', 'pt'];
  const root = document.documentElement;
  const code = (tag) => SUPPORTED.find((c) => String(tag || '').toLowerCase().split('-')[0] === c);

  // Only the legal pages: elsewhere the fragment can carry tokens (confirm/, reset-password/).
  function fromHash() {
    if (root.dataset.langHash !== 'true') return undefined;
    return code(location.hash.slice(1).split('-')[0]);
  }

  function apply(lang) {
    window.pickerLang = lang;
    root.lang = lang;
    root.dataset.lang = lang;
    const title = root.dataset['title' + lang[0].toUpperCase() + lang.slice(1)]; // <html data-title-de="…">
    if (title) document.title = title;
    document.querySelectorAll('.lang-switch a[lang]').forEach((a) => {
      if (a.lang === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  const wanted = [new URLSearchParams(location.search).get('lang')]
    .concat(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]);
  const browser = wanted.map(code).find(Boolean) || 'en';
  apply(fromHash() || browser);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(window.pickerLang));
  }
  window.addEventListener('hashchange', () => {
    const lang = fromHash();
    if (!lang || lang === window.pickerLang) return;
    apply(lang);
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  });
})();
