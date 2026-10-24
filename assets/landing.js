// Try-it poll on the landing page (index.html): a made-up poll that starts at 31 to 19. Each tap adds one vote to
// that option and moves the bars. Counted in the page only, nothing is stored or sent.
(() => {
  'use strict';
  document.querySelectorAll('[data-poll]').forEach((poll) => {
    const votes = { a: 31, b: 19 };
    const buttons = poll.querySelectorAll('[data-opt]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        votes[button.dataset.opt] += 1;
        const total = votes.a + votes.b;
        buttons.forEach((b) => {
          const pct = Math.round((votes[b.dataset.opt] / total) * 100);
          b.querySelector('[data-pct]').textContent = pct + '%';
          b.querySelector('.fill').style.width = pct + '%';
          b.setAttribute('aria-pressed', String(b === button));
        });
        const count = poll.querySelector('[data-total]');
        if (count) count.textContent = String(total);
      });
    });
  });
})();
