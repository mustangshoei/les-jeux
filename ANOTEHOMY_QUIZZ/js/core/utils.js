/* ==========================================================================
   Anotehomy Quizz - core/utils.js
   Utilitaires generiques (DOM, maths, formatage, hasard).
   ========================================================================== */
(function (NS) {
  'use strict';

  const $ = id => document.getElementById(id);
  /* arrondi a 0.1 (coordonnees SVG compactes) */
  const f = n => Math.round(n * 10) / 10;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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

  /* ---------- Normalisation du texte (comparaisons, recherche) ----------
     Plages Unicode construites en ASCII : diacritiques combinants, ligatures œ et æ (que la
     décomposition NFD ne sépare pas : « œil » doit valoir « oeil »). */
  const RE_DIACRITICS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const RE_OE = new RegExp(String.fromCharCode(0x153), 'g'), RE_AE = new RegExp(String.fromCharCode(0xe6), 'g');

  /* minuscules, sans accents ni ligatures : « Œil » -> « oeil », « Hépat(o)- » -> « hepat(o)- » */
  const plier = s => String(s).toLowerCase().normalize('NFD').replace(RE_DIACRITICS, '').replace(RE_OE, 'oe').replace(RE_AE, 'ae');
  /* clé de recherche : pliée, puis réduite aux lettres et aux chiffres (tirets, parenthèses, espaces et
     apostrophes disparaissent) : « hépat(o)- » -> « hepato », « -ite » -> « ite » */
  const cle = s => plier(s).replace(/[^a-z0-9]/g, '');

  Object.assign(NS, { $, f, lerp, clamp, ease, esc, fmt, pickOne, shuffle, plier, cle });
})(AQ.util);
