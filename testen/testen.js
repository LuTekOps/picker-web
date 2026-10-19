// Tester sign-up page (testen/index.html) for the closed test on Google Play.
//
// Fills the page in the visitor's language (window.pickerLang from assets/lang.js) and sends the form to the
// edge function tester-signup: a Cloudflare Turnstile token proves it is a person, the function checks it,
// stores the sign-up in tester_signups and emails it to the developer. No account and no guest access are
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

  const STRINGS = {
    en: {
      pageTitle: 'Picker · Become a tester',
      eyebrow: 'Closed test',
      title: 'Become a Picker tester',
      intro: 'Picker is about to launch on Google Play. Before that, Google wants testers who keep the app for 14 days in a row. We are looking for 15 people. Will you help?',
      androidOnly: "You need an Android phone with Google Play. iPhone doesn't work for this test.",
      howTitle: 'How it works',
      s1t: 'Sign up',
      s1b: 'Fill in the form below. Use the Google address you are signed in with on Google Play.',
      s2t: 'Wait to be added',
      s2b: 'Luca adds you to the test on Google Play and lets you know by WhatsApp or email.',
      s3t: 'Join the test',
      s3b: 'Open the link below with that same Google address, tap “Become a tester”, then “Download it on Google Play” and install Picker.',
      optin: 'Open the test on Google Play',
      optinNote: 'The link only works once you have been added.',
      s4t: 'Keep it, then 14 days',
      s4b: 'As soon as 15 testers are in, Luca gives the go for the 14 days. Until then, just keep Picker on your phone: it is light on battery and data, and it was built with security in mind.',
      s4c: "After the go: leave Picker installed for 14 days, open it now and then and don't leave the test.",
      s5t: 'Tell us what you think',
      s5b: 'Bugs, ideas, praise: in the app under Settings → Feedback, or just send Luca a message.',
      adsTitle: 'Ads: only tap test ads',
      adsBody: "Picker shows a few ads. As a tester, only tap an ad if it says “Test Ad” at the top. Clicks on real ads by testers can get the developer's ad account banned. Seeing them is fine.",
      adidTitle: 'Find your advertising ID',
      adidBody: 'With it, your phone only gets test ads. It is optional, but it helps a lot.',
      adidPath1: 'Most phones (Samsung and others): Settings → Google → All services → Ads',
      adidPath2: 'Pixel and Android 12 or later: Settings → Security & privacy → More privacy settings → Ads',
      adidNote: 'Copy “Your advertising ID” and paste it below. If it only shows zeros, the ID was deleted: tap “Get new advertising ID” or leave the field empty.',
      formTitle: 'Sign up',
      name: 'Name',
      email: 'Google address (Gmail)',
      emailHint: 'The address you use on Google Play.',
      adid: 'Advertising ID (optional)',
      adidHint: 'See “Find your advertising ID” above.',
      phone: 'Mobile number (optional)',
      phoneHint: 'So Luca can tell you by WhatsApp when you have been added.',
      age: 'I am at least 16 years old.',
      consent: 'I agree that my details are stored for this test, as described below.',
      submit: 'Sign up as a tester',
      doneTitle: "Thanks, you're signed up!",
      doneBody: 'Luca adds you to the test and lets you know. Then carry on with step 3.',
      privacyTitle: 'What happens with your details',
      privacyBody: 'Luca Parise (LuTekOps), the developer of Picker, uses your name, Google address, advertising ID and mobile number only for this test: to add you as a tester on Google Play and as a test device in Google AdMob, and to reach you by WhatsApp or email. They are stored with Supabase (EU) and sent to Luca by email via Resend (USA). They are deleted 6 months after you sign up at the latest, or right away if you ask: picker-smartdecisions@lutekops.ch.',
      imprint: 'Legal notice',
      privacy: 'Privacy Policy',
      errorName: 'Please enter your name.',
      errorEmail: 'Please enter a valid email address.',
      errorAdid: 'This is not an advertising ID. It looks like 38400000-8cf0-11bd-b23e-10b96e40000d. Leave the field empty if you are not sure.',
      errorAge: 'You must be at least 16 to take part.',
      errorConsent: 'Please agree to the storage of your details.',
      errorCaptcha: "The security check didn't work. Please try again.",
      errorNetwork: 'No connection. Check your internet and try again.',
      errorRateLimit: 'Too many attempts. Please wait a moment and try again.',
      errorFull: 'The test is full right now. Thanks for wanting to help!',
      errorGeneric: 'Something went wrong. Please try again.',
    },
    de: {
      pageTitle: 'Picker · Tester werden',
      eyebrow: 'Geschlossener Test',
      title: 'Werde Picker-Tester',
      intro: 'Picker kommt bald in den Google Play Store. Vorher will Google Tester sehen, die die App 14 Tage am Stück behalten. Wir suchen 15 Leute. Machst du mit?',
      androidOnly: 'Du brauchst ein Android-Handy mit Google Play. Mit dem iPhone geht dieser Test nicht.',
      howTitle: "So geht's",
      s1t: 'Anmelden',
      s1b: 'Füll unten das Formular aus. Nimm die Google-Adresse, mit der du bei Google Play angemeldet bist.',
      s2t: 'Auf die Freischaltung warten',
      s2b: 'Luca trägt dich bei Google Play als Tester ein und meldet sich per WhatsApp oder Mail.',
      s3t: 'Dem Test beitreten',
      s3b: 'Öffne den Link unten mit derselben Google-Adresse, tippe auf «Tester werden», dann auf «Bei Google Play herunterladen» und installiere Picker.',
      optin: 'Test bei Google Play öffnen',
      optinNote: 'Der Link funktioniert erst, wenn du freigeschaltet bist.',
      s4t: 'Behalten, dann 14 Tage',
      s4b: 'Sobald 15 Tester dabei sind, gibt Luca das Go für die 14 Tage. Bis dahin lässt du Picker einfach auf dem Handy: Die App braucht wenig Akku und Daten und wurde mit viel Wert auf Sicherheit gebaut.',
      s4c: 'Nach dem Go: Picker 14 Tage installiert lassen, ab und zu öffnen und nicht aus dem Test austreten.',
      s5t: 'Sag uns deine Meinung',
      s5b: 'Fehler, Ideen, Lob: in der App unter Einstellungen → Feedback, oder schreib Luca einfach direkt.',
      adsTitle: 'Werbung: nur Testanzeigen antippen',
      adsBody: 'Picker zeigt ein paar Anzeigen. Als Tester tippst du eine Anzeige nur an, wenn oben «Test Ad» steht. Klicks von Testern auf echte Anzeigen können das Werbekonto des Entwicklers sperren lassen. Anschauen ist kein Problem.',
      adidTitle: 'Deine Werbe-ID finden',
      adidBody: 'Damit bekommt dein Handy nur Testanzeigen. Sie ist freiwillig, hilft aber sehr.',
      adidPath1: 'Die meisten Handys (Samsung und andere): Einstellungen → Google → Alle Dienste → Werbung',
      adidPath2: 'Pixel und ab Android 12: Einstellungen → Sicherheit & Datenschutz → Weitere Datenschutzeinstellungen → Werbung',
      adidNote: 'Kopiere «Deine Werbe-ID» und füge sie unten ein. Stehen dort nur Nullen, wurde die ID gelöscht: Tippe auf «Neue Werbe-ID anfordern» oder lass das Feld leer.',
      formTitle: 'Anmelden',
      name: 'Name',
      email: 'Google-Adresse (Gmail)',
      emailHint: 'Die Adresse, die du bei Google Play nutzt.',
      adid: 'Werbe-ID (freiwillig)',
      adidHint: 'Siehe oben «Deine Werbe-ID finden».',
      phone: 'Handynummer (freiwillig)',
      phoneHint: 'Damit Luca dir per WhatsApp Bescheid geben kann, wenn du freigeschaltet bist.',
      age: 'Ich bin mindestens 16 Jahre alt.',
      consent: 'Ich bin einverstanden, dass meine Angaben für diesen Test gespeichert werden, wie unten beschrieben.',
      submit: 'Als Tester anmelden',
      doneTitle: 'Danke, du bist angemeldet!',
      doneBody: "Luca schaltet dich frei und meldet sich. Danach geht's mit Schritt 3 weiter.",
      privacyTitle: 'Was mit deinen Angaben passiert',
      privacyBody: 'Luca Parise (LuTekOps), der Entwickler von Picker, nutzt Name, Google-Adresse, Werbe-ID und Handynummer nur für diesen Test: um dich bei Google Play als Tester und bei Google AdMob als Testgerät einzutragen und dich per WhatsApp oder Mail zu erreichen. Gespeichert wird bei Supabase (EU), die Benachrichtigung an Luca geht per Mail über Resend (USA). Gelöscht wird spätestens 6 Monate nach der Anmeldung, auf Wunsch sofort: picker-smartdecisions@lutekops.ch.',
      imprint: 'Impressum',
      privacy: 'Datenschutzerklärung',
      errorName: 'Bitte gib deinen Namen ein.',
      errorEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      errorAdid: 'Das ist keine Werbe-ID. Sie sieht so aus: 38400000-8cf0-11bd-b23e-10b96e40000d. Lass das Feld leer, wenn du unsicher bist.',
      errorAge: 'Mitmachen kannst du ab 16 Jahren.',
      errorConsent: 'Bitte stimm der Speicherung deiner Angaben zu.',
      errorCaptcha: 'Die Sicherheitsprüfung hat nicht geklappt. Bitte versuch es nochmal.',
      errorNetwork: 'Keine Verbindung. Prüf dein Internet und versuch es nochmal.',
      errorRateLimit: 'Zu viele Versuche. Warte kurz und versuch es nochmal.',
      errorFull: 'Der Test ist gerade voll. Danke, dass du helfen wolltest!',
      errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuch es nochmal.',
    },
    fr: {
      pageTitle: 'Picker · Devenir testeur',
      eyebrow: 'Test fermé',
      title: 'Deviens testeur de Picker',
      intro: 'Picker arrive bientôt sur Google Play. Avant cela, Google veut des testeurs qui gardent l\'app 14 jours d\'affilée. Nous cherchons 15 personnes. Tu nous aides?',
      androidOnly: 'Il te faut un téléphone Android avec Google Play. Ce test ne fonctionne pas sur iPhone.',
      howTitle: 'Comment ça marche',
      s1t: 'Inscris-toi',
      s1b: 'Remplis le formulaire ci-dessous avec l\'adresse Google que tu utilises sur Google Play.',
      s2t: 'Attends ton ajout',
      s2b: 'Luca t\'ajoute au test sur Google Play et te prévient par WhatsApp ou par e-mail.',
      s3t: 'Rejoins le test',
      s3b: 'Ouvre le lien ci-dessous avec la même adresse Google, appuie sur « Devenir testeur », puis sur « Télécharger sur Google Play » et installe Picker.',
      optin: 'Ouvrir le test sur Google Play',
      optinNote: 'Le lien ne fonctionne qu\'une fois que tu as été ajouté.',
      s4t: 'Garde-la, puis 14 jours',
      s4b: 'Dès que 15 testeurs sont là, Luca donne le feu vert pour les 14 jours. D\'ici là, garde simplement Picker sur ton téléphone : l\'app consomme peu de batterie et de données, et la sécurité a été une priorité.',
      s4c: 'Après le feu vert : garde Picker installée 14 jours, ouvre-la de temps en temps et ne quitte pas le test.',
      s5t: 'Donne ton avis',
      s5b: 'Bugs, idées, compliments : dans l\'app sous Réglages → Feedback, ou écris directement à Luca.',
      adsTitle: 'Pubs : appuie seulement sur les pubs de test',
      adsBody: 'Picker affiche quelques pubs. En tant que testeur, n\'appuie sur une pub que si « Test Ad » est écrit en haut. Des clics de testeurs sur de vraies pubs peuvent faire bloquer le compte publicitaire du développeur. Les regarder ne pose aucun problème.',
      adidTitle: 'Trouver ton identifiant publicitaire',
      adidBody: 'Avec lui, ton téléphone ne reçoit que des pubs de test. C\'est facultatif, mais ça aide beaucoup.',
      adidPath1: 'La plupart des téléphones (Samsung et autres) : Paramètres → Google → Tous les services → Annonces',
      adidPath2: 'Pixel et Android 12 ou plus : Paramètres → Sécurité et confidentialité → Autres paramètres de confidentialité → Annonces',
      adidNote: 'Copie « Ton identifiant publicitaire » et colle-le ci-dessous. S\'il n\'affiche que des zéros, il a été supprimé : appuie sur « Obtenir un nouvel identifiant publicitaire » ou laisse le champ vide.',
      formTitle: 'Inscription',
      name: 'Nom',
      email: 'Adresse Google (Gmail)',
      emailHint: 'L\'adresse que tu utilises sur Google Play.',
      adid: 'Identifiant publicitaire (facultatif)',
      adidHint: 'Voir « Trouver ton identifiant publicitaire » plus haut.',
      phone: 'Numéro de portable (facultatif)',
      phoneHint: 'Pour que Luca puisse te prévenir par WhatsApp quand tu es ajouté.',
      age: 'J\'ai au moins 16 ans.',
      consent: 'J\'accepte que mes données soient enregistrées pour ce test, comme décrit ci-dessous.',
      submit: 'M\'inscrire comme testeur',
      doneTitle: 'Merci, tu es inscrit!',
      doneBody: 'Luca t\'ajoute au test et te prévient. Continue ensuite avec l\'étape 3.',
      privacyTitle: 'Ce qui se passe avec tes données',
      privacyBody: 'Luca Parise (LuTekOps), le développeur de Picker, utilise ton nom, ton adresse Google, ton identifiant publicitaire et ton numéro de portable uniquement pour ce test : pour t\'ajouter comme testeur sur Google Play et comme appareil de test dans Google AdMob, et pour te joindre par WhatsApp ou e-mail. Elles sont stockées chez Supabase (UE) et envoyées à Luca par e-mail via Resend (États-Unis). Elles sont supprimées au plus tard 6 mois après ton inscription, ou tout de suite sur demande : picker-smartdecisions@lutekops.ch.',
      imprint: 'Mentions légales',
      privacy: 'Politique de confidentialité',
      errorName: 'Indique ton nom.',
      errorEmail: 'Indique une adresse e-mail valide.',
      errorAdid: 'Ce n\'est pas un identifiant publicitaire. Il ressemble à 38400000-8cf0-11bd-b23e-10b96e40000d. Laisse le champ vide si tu n\'es pas sûr.',
      errorAge: 'Il faut avoir au moins 16 ans pour participer.',
      errorConsent: 'Accepte l\'enregistrement de tes données.',
      errorCaptcha: 'La vérification de sécurité a échoué. Réessaie.',
      errorNetwork: 'Pas de connexion. Vérifie ton internet et réessaie.',
      errorRateLimit: 'Trop de tentatives. Attends un instant et réessaie.',
      errorFull: 'Le test est complet pour le moment. Merci de vouloir aider!',
      errorGeneric: 'Une erreur s\'est produite. Réessaie.',
    },
    it: {
      pageTitle: 'Picker · Diventa tester',
      eyebrow: 'Test chiuso',
      title: 'Diventa tester di Picker',
      intro: 'Picker arriva presto su Google Play. Prima Google vuole dei tester che tengano l\'app per 14 giorni di fila. Cerchiamo 15 persone. Ci aiuti?',
      androidOnly: 'Ti serve un telefono Android con Google Play. Con l\'iPhone questo test non funziona.',
      howTitle: 'Come funziona',
      s1t: 'Iscriviti',
      s1b: 'Compila il modulo qui sotto con l\'indirizzo Google che usi su Google Play.',
      s2t: 'Aspetta l\'abilitazione',
      s2b: 'Luca ti aggiunge al test su Google Play e ti avvisa via WhatsApp o e-mail.',
      s3t: 'Entra nel test',
      s3b: 'Apri il link qui sotto con lo stesso indirizzo Google, tocca «Diventa un tester», poi «Scarica da Google Play» e installa Picker.',
      optin: 'Apri il test su Google Play',
      optinNote: 'Il link funziona solo dopo che sei stato aggiunto.',
      s4t: 'Tienila, poi 14 giorni',
      s4b: 'Appena ci sono 15 tester, Luca dà il via ai 14 giorni. Fino ad allora tieni semplicemente Picker sul telefono: consuma poca batteria e pochi dati ed è stata costruita con grande attenzione alla sicurezza.',
      s4c: 'Dopo il via: tieni Picker installata per 14 giorni, aprila ogni tanto e non uscire dal test.',
      s5t: 'Dicci cosa ne pensi',
      s5b: 'Errori, idee, complimenti: nell\'app in Impostazioni → Feedback, oppure scrivi direttamente a Luca.',
      adsTitle: 'Pubblicità: tocca solo gli annunci di prova',
      adsBody: 'Picker mostra alcuni annunci. Come tester tocca un annuncio solo se in alto c\'è scritto «Test Ad». I clic dei tester su annunci veri possono far bloccare l\'account pubblicitario dello sviluppatore. Guardarli va benissimo.',
      adidTitle: 'Trova il tuo ID pubblicità',
      adidBody: 'Con questo il tuo telefono riceve solo annunci di prova. È facoltativo, ma aiuta molto.',
      adidPath1: 'La maggior parte dei telefoni (Samsung e altri): Impostazioni → Google → Tutti i servizi → Annunci',
      adidPath2: 'Pixel e Android 12 o successivi: Impostazioni → Sicurezza e privacy → Altre impostazioni di privacy → Annunci',
      adidNote: 'Copia «Il tuo ID pubblicità» e incollalo qui sotto. Se mostra solo zeri, l\'ID è stato eliminato: tocca «Ottieni un nuovo ID pubblicità» o lascia vuoto il campo.',
      formTitle: 'Iscrizione',
      name: 'Nome',
      email: 'Indirizzo Google (Gmail)',
      emailHint: 'L\'indirizzo che usi su Google Play.',
      adid: 'ID pubblicità (facoltativo)',
      adidHint: 'Vedi «Trova il tuo ID pubblicità» più sopra.',
      phone: 'Numero di cellulare (facoltativo)',
      phoneHint: 'Così Luca può avvisarti via WhatsApp quando sei stato aggiunto.',
      age: 'Ho almeno 16 anni.',
      consent: 'Accetto che i miei dati vengano salvati per questo test, come descritto qui sotto.',
      submit: 'Iscrivimi come tester',
      doneTitle: 'Grazie, sei iscritto!',
      doneBody: 'Luca ti aggiunge al test e ti avvisa. Poi continua con il passo 3.',
      privacyTitle: 'Cosa succede con i tuoi dati',
      privacyBody: 'Luca Parise (LuTekOps), lo sviluppatore di Picker, usa nome, indirizzo Google, ID pubblicità e numero di cellulare solo per questo test: per aggiungerti come tester su Google Play e come dispositivo di prova in Google AdMob, e per contattarti via WhatsApp o e-mail. Sono salvati presso Supabase (UE) e inviati a Luca per e-mail tramite Resend (USA). Vengono cancellati al più tardi 6 mesi dopo l\'iscrizione, o subito su richiesta: picker-smartdecisions@lutekops.ch.',
      imprint: 'Note legali',
      privacy: 'Informativa sulla privacy',
      errorName: 'Inserisci il tuo nome.',
      errorEmail: 'Inserisci un indirizzo e-mail valido.',
      errorAdid: 'Questo non è un ID pubblicità. Ha questo aspetto: 38400000-8cf0-11bd-b23e-10b96e40000d. Lascia vuoto il campo se non sei sicuro.',
      errorAge: 'Per partecipare devi avere almeno 16 anni.',
      errorConsent: 'Accetta il salvataggio dei tuoi dati.',
      errorCaptcha: 'Il controllo di sicurezza non è riuscito. Riprova.',
      errorNetwork: 'Nessuna connessione. Controlla internet e riprova.',
      errorRateLimit: 'Troppi tentativi. Aspetta un attimo e riprova.',
      errorFull: 'Il test al momento è al completo. Grazie per voler aiutare!',
      errorGeneric: 'Qualcosa è andato storto. Riprova.',
    },
    es: {
      pageTitle: 'Picker · Hazte tester',
      eyebrow: 'Prueba cerrada',
      title: 'Hazte tester de Picker',
      intro: 'Picker llega pronto a Google Play. Antes, Google quiere testers que mantengan la app 14 días seguidos. Buscamos 15 personas. ¿Nos ayudas?',
      androidOnly: 'Necesitas un móvil Android con Google Play. Esta prueba no funciona en iPhone.',
      howTitle: 'Cómo funciona',
      s1t: 'Apúntate',
      s1b: 'Rellena el formulario de abajo con la dirección de Google que usas en Google Play.',
      s2t: 'Espera a que te añadan',
      s2b: 'Luca te añade a la prueba en Google Play y te avisa por WhatsApp o por correo.',
      s3t: 'Únete a la prueba',
      s3b: 'Abre el enlace de abajo con esa misma dirección de Google, toca «Convertirse en tester», luego «Descargar en Google Play» e instala Picker.',
      optin: 'Abrir la prueba en Google Play',
      optinNote: 'El enlace solo funciona cuando ya te han añadido.',
      s4t: 'Consérvala, luego 14 días',
      s4b: 'En cuanto haya 15 testers, Luca da la señal para los 14 días. Hasta entonces, deja Picker en tu móvil: gasta poca batería y pocos datos, y se ha construido con mucha atención a la seguridad.',
      s4c: 'Después de la señal: deja Picker instalada 14 días, ábrela de vez en cuando y no abandones la prueba.',
      s5t: 'Cuéntanos qué te parece',
      s5b: 'Errores, ideas, elogios: en la app en Ajustes → Feedback, o escríbele directamente a Luca.',
      adsTitle: 'Anuncios: toca solo los de prueba',
      adsBody: 'Picker muestra algunos anuncios. Como tester, toca un anuncio solo si arriba pone «Test Ad». Los clics de testers en anuncios reales pueden hacer que bloqueen la cuenta publicitaria del desarrollador. Verlos no es ningún problema.',
      adidTitle: 'Encuentra tu ID de publicidad',
      adidBody: 'Con él, tu móvil solo recibe anuncios de prueba. Es opcional, pero ayuda mucho.',
      adidPath1: 'La mayoría de móviles (Samsung y otros): Ajustes → Google → Todos los servicios → Anuncios',
      adidPath2: 'Pixel y Android 12 o posterior: Ajustes → Seguridad y privacidad → Más ajustes de privacidad → Anuncios',
      adidNote: 'Copia «Tu ID de publicidad» y pégalo abajo. Si solo muestra ceros, el ID se eliminó: toca «Obtener nuevo ID de publicidad» o deja el campo vacío.',
      formTitle: 'Inscripción',
      name: 'Nombre',
      email: 'Dirección de Google (Gmail)',
      emailHint: 'La dirección que usas en Google Play.',
      adid: 'ID de publicidad (opcional)',
      adidHint: 'Mira «Encuentra tu ID de publicidad» más arriba.',
      phone: 'Número de móvil (opcional)',
      phoneHint: 'Para que Luca te avise por WhatsApp cuando te haya añadido.',
      age: 'Tengo al menos 16 años.',
      consent: 'Acepto que mis datos se guarden para esta prueba, como se describe abajo.',
      submit: 'Apuntarme como tester',
      doneTitle: '¡Gracias, ya estás apuntado!',
      doneBody: 'Luca te añade a la prueba y te avisa. Después sigue con el paso 3.',
      privacyTitle: 'Qué pasa con tus datos',
      privacyBody: 'Luca Parise (LuTekOps), el desarrollador de Picker, usa tu nombre, dirección de Google, ID de publicidad y número de móvil solo para esta prueba: para añadirte como tester en Google Play y como dispositivo de prueba en Google AdMob, y para contactarte por WhatsApp o correo. Se guardan en Supabase (UE) y se envían a Luca por correo a través de Resend (EE. UU.). Se borran como muy tarde 6 meses después de tu inscripción, o enseguida si lo pides: picker-smartdecisions@lutekops.ch.',
      imprint: 'Aviso legal',
      privacy: 'Política de privacidad',
      errorName: 'Escribe tu nombre.',
      errorEmail: 'Escribe una dirección de correo válida.',
      errorAdid: 'Esto no es un ID de publicidad. Tiene este aspecto: 38400000-8cf0-11bd-b23e-10b96e40000d. Deja el campo vacío si no estás seguro.',
      errorAge: 'Para participar necesitas tener al menos 16 años.',
      errorConsent: 'Acepta que se guarden tus datos.',
      errorCaptcha: 'La comprobación de seguridad no ha funcionado. Inténtalo de nuevo.',
      errorNetwork: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
      errorRateLimit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
      errorFull: 'La prueba está completa ahora mismo. ¡Gracias por querer ayudar!',
      errorGeneric: 'Algo ha salido mal. Inténtalo de nuevo.',
    },
    pt: {
      pageTitle: 'Picker · Seja testador',
      eyebrow: 'Teste fechado',
      title: 'Seja testador do Picker',
      intro: 'O Picker chega em breve ao Google Play. Antes disso, o Google quer testadores que mantenham o app por 14 dias seguidos. Procuramos 15 pessoas. Você ajuda?',
      androidOnly: 'Você precisa de um celular Android com Google Play. Este teste não funciona no iPhone.',
      howTitle: 'Como funciona',
      s1t: 'Inscreva-se',
      s1b: 'Preencha o formulário abaixo com o endereço Google que você usa no Google Play.',
      s2t: 'Aguarde ser adicionado',
      s2b: 'O Luca adiciona você ao teste no Google Play e avisa por WhatsApp ou e-mail.',
      s3t: 'Entre no teste',
      s3b: 'Abra o link abaixo com o mesmo endereço Google, toque em «Tornar-se testador», depois em «Baixar no Google Play» e instale o Picker.',
      optin: 'Abrir o teste no Google Play',
      optinNote: 'O link só funciona depois que você for adicionado.',
      s4t: 'Mantenha, depois 14 dias',
      s4b: 'Assim que houver 15 testadores, o Luca dá o sinal para os 14 dias. Até lá, é só manter o Picker no celular: ele gasta pouca bateria e poucos dados e foi feito com muita atenção à segurança.',
      s4c: 'Depois do sinal: mantenha o Picker instalado por 14 dias, abra de vez em quando e não saia do teste.',
      s5t: 'Diga o que achou',
      s5b: 'Erros, ideias, elogios: no app em Configurações → Feedback, ou mande uma mensagem direto para o Luca.',
      adsTitle: 'Anúncios: toque só nos de teste',
      adsBody: 'O Picker mostra alguns anúncios. Como testador, toque em um anúncio só se estiver escrito «Test Ad» em cima. Cliques de testadores em anúncios reais podem fazer a conta de anúncios do desenvolvedor ser bloqueada. Ver os anúncios não tem problema.',
      adidTitle: 'Encontre seu ID de publicidade',
      adidBody: 'Com ele, seu celular só recebe anúncios de teste. É opcional, mas ajuda muito.',
      adidPath1: 'A maioria dos celulares (Samsung e outros): Configurações → Google → Todos os serviços → Anúncios',
      adidPath2: 'Pixel e Android 12 ou mais novo: Configurações → Segurança e privacidade → Mais configurações de privacidade → Anúncios',
      adidNote: 'Copie «Seu ID de publicidade» e cole abaixo. Se aparecerem só zeros, o ID foi excluído: toque em «Gerar novo ID de publicidade» ou deixe o campo vazio.',
      formTitle: 'Inscrição',
      name: 'Nome',
      email: 'Endereço Google (Gmail)',
      emailHint: 'O endereço que você usa no Google Play.',
      adid: 'ID de publicidade (opcional)',
      adidHint: 'Veja «Encontre seu ID de publicidade» acima.',
      phone: 'Número de celular (opcional)',
      phoneHint: 'Para o Luca avisar por WhatsApp quando você for adicionado.',
      age: 'Tenho pelo menos 16 anos.',
      consent: 'Concordo que meus dados sejam guardados para este teste, como descrito abaixo.',
      submit: 'Inscrever-me como testador',
      doneTitle: 'Obrigado, você está inscrito!',
      doneBody: 'O Luca adiciona você ao teste e avisa. Depois continue com o passo 3.',
      privacyTitle: 'O que acontece com seus dados',
      privacyBody: 'Luca Parise (LuTekOps), o desenvolvedor do Picker, usa seu nome, endereço Google, ID de publicidade e número de celular só para este teste: para adicionar você como testador no Google Play e como dispositivo de teste no Google AdMob, e para falar com você por WhatsApp ou e-mail. Eles ficam guardados na Supabase (UE) e são enviados ao Luca por e-mail via Resend (EUA). São apagados no máximo 6 meses após a inscrição, ou na hora se você pedir: picker-smartdecisions@lutekops.ch.',
      imprint: 'Informações legais',
      privacy: 'Política de privacidade',
      errorName: 'Digite seu nome.',
      errorEmail: 'Digite um endereço de e-mail válido.',
      errorAdid: 'Isto não é um ID de publicidade. Ele tem esta cara: 38400000-8cf0-11bd-b23e-10b96e40000d. Deixe o campo vazio se não tiver certeza.',
      errorAge: 'Para participar você precisa ter pelo menos 16 anos.',
      errorConsent: 'Concorde com o armazenamento dos seus dados.',
      errorCaptcha: 'A verificação de segurança não funcionou. Tente de novo.',
      errorNetwork: 'Sem conexão. Verifique sua internet e tente de novo.',
      errorRateLimit: 'Tentativas demais. Espere um pouco e tente de novo.',
      errorFull: 'O teste está cheio no momento. Obrigado por querer ajudar!',
      errorGeneric: 'Algo deu errado. Tente de novo.',
    },
  };

  const lang = STRINGS[window.pickerLang] ? window.pickerLang : 'en';
  const t = STRINGS[lang];
  const $ = (id) => document.getElementById(id);

  document.title = t.pageTitle;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = t[el.dataset.i18n];
    if (text) el.textContent = text;
  });
  document.querySelectorAll('.footer a').forEach((a) => { a.href = a.getAttribute('href').split('#')[0] + '#' + lang; });

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
    if (adId && !AD_ID_PATTERN.test(adId)) { setError(t.errorAdid, 'field-adid'); $('adid').focus(); return; }
    if (!$('age').checked) { setError(t.errorAge); return; }
    if (!$('consent').checked) { setError(t.errorConsent); return; }
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
          body: JSON.stringify({ name, email, ad_id: adId || null, phone: phone || null, lang, captcha_token: token }),
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
      else setError(t.errorGeneric);
    } finally {
      busy(false);
    }
  });
})();
