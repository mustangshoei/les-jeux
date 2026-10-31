/* ==========================================================================
   Natehure Quizz - core/utils.js
   Utilitaires generiques (DOM, formatage, hasard).
   ========================================================================== */
(function (NS) {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* echappement HTML des saisies utilisateur */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  /* secondes -> "mm:ss" */
  const fmt = s => {
    s = Math.max(0, Math.floor(s));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  Object.assign(NS, { $, clamp, esc, fmt, pickOne, shuffle });
})(NQ.util);
