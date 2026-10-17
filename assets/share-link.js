// Share link fallback (404.html): hand the poll id from /p/{id} to Play as install referrer,
// so Picker opens that poll on its first start (PlayInstallReferrer.kt). Anything else keeps the plain link.
(function () {
  var match = location.pathname.match(/^\/p\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/?$/);
  var play = document.getElementById("play");
  if (!match || !play) return;
  var referrer = "poll=" + match[1].toLowerCase() + "&utm_source=share";
  play.href = "https://play.google.com/store/apps/details?id=ch.lutekops.picker&referrer=" + encodeURIComponent(referrer);
})();
