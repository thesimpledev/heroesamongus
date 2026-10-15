// Classic script, loaded synchronously in <head> so the chosen theme applies before
// first paint. The Content Security Policy forbids inline scripts, hence a file.
(function () {
  'use strict';

  var KEY = 'goodpeople:theme';
  var THEME_COLORS = { light: '#f5f1e9', dark: '#2b2b29' };

  function resolveTheme(stored, systemDark) {
    if (stored === 'light' || stored === 'dark') return stored;
    return systemDark ? 'dark' : 'light';
  }

  function nextTheme(current) {
    return current === 'dark' ? 'light' : 'dark';
  }

  if (typeof module !== 'undefined') {
    module.exports = { resolveTheme: resolveTheme, nextTheme: nextTheme };
    return;
  }
  if (typeof document === 'undefined') return;

  function readStored() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(theme) {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch (e) {
      // Storage can be blocked; the choice then lasts for this page only.
    }
  }

  function systemDark() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function currentTheme() {
    return resolveTheme(readStored(), systemDark());
  }

  function reflect(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = THEME_COLORS[theme];
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    var dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.querySelector('.theme-glyph').textContent = dark ? '☀' : '☾';
    button.querySelector('.visually-hidden').textContent = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  var stored = readStored();
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.dataset.theme = stored;
  }

  document.addEventListener('DOMContentLoaded', function () {
    reflect(currentTheme());
    var button = document.getElementById('theme-toggle');
    if (button) {
      button.addEventListener('click', function () {
        var theme = nextTheme(currentTheme());
        writeStored(theme);
        document.documentElement.dataset.theme = theme;
        reflect(theme);
      });
    }
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!document.documentElement.dataset.theme) reflect(currentTheme());
      });
    }
  });
})();
