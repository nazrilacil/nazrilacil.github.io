/*!
 * translate.js — Fitur translate otomatis untuk website portfolio
 * Memakai mesin Google Translate, dengan tampilan tombol sendiri.
 * Cara pakai: tambahkan  <script src="translate.js" defer></script>  di index.html
 */
(function () {
  'use strict';

  // Bahasa asli konten website (mayoritas teks di halaman berbahasa Inggris)
  var SOURCE = 'en';

  // Daftar bahasa. Kode mengikuti Google Translate.
  var LANGS = [
    { code: 'en', name: 'English (asli)' },
    { code: 'id', name: 'Indonesia' },
    { code: 'jw', name: 'Basa Jawa' },
    { code: 'su', name: 'Basa Sunda' },
    { code: 'ms', name: 'Melayu' },
    { code: 'ar', name: 'العربية' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh-CN', name: '中文' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];

  var STORAGE_KEY = 'acil_translate_visited';

  /* ---------- Cookie helper ---------- */
  function getCurrent() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return SOURCE;
    var parts = decodeURIComponent(m[1]).split('/');
    return parts[2] || SOURCE;
  }

  function writeCookie(value, expires) {
    var base = 'googtrans=' + value + '; path=/' + (expires ? '; expires=' + expires : '');
    document.cookie = base;
    try {
      document.cookie = base + '; domain=' + location.hostname;
    } catch (e) {}
  }

  function setLang(code) {
    if (code === SOURCE) {
      writeCookie('', 'Thu, 01 Jan 1970 00:00:00 GMT');
    } else {
      writeCookie('/' + SOURCE + '/' + code);
    }
    location.reload();
  }

  /* ---------- Deteksi bahasa browser (kunjungan pertama) ---------- */
  function browserLang() {
    var l = (navigator.language || SOURCE).toLowerCase();
    var short = l.split('-')[0];
    if (short === 'zh') return 'zh-CN';
    if (short === 'jv') return 'jw';
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code.toLowerCase() === short) return LANGS[i].code;
    }
    return SOURCE;
  }

  function autoDetect() {
    var canStore = false;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, '1');
        canStore = true;
      }
    } catch (e) {}
    if (!canStore) return false;

    var target = browserLang();
    if (target !== SOURCE && getCurrent() === SOURCE) {
      setLang(target); // reload sekali, lalu tidak diulang
      return true;
    }
    return false;
  }

  /* ---------- Style ---------- */
  function injectCSS() {
    var css = [
      // Sembunyikan bar & tooltip bawaan Google
      '.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate, iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd{display:none!important}',
      'body{top:0!important}',
      '#goog-gt-tt, .goog-tooltip, .goog-tooltip:hover{display:none!important}',
      '.goog-text-highlight{background:none!important;box-shadow:none!important}',
      '#google_translate_element{position:absolute;left:-9999px;top:0;height:0;overflow:hidden}',

      // Tombol & panel kustom
      '#acil-tr{position:fixed;left:20px;bottom:20px;z-index:99999;font-family:"Fira Code",system-ui,sans-serif}',
      '#acil-tr button{font:inherit;cursor:pointer}',
      '#acil-tr-btn{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(20,20,20,.85);color:#fff;backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.35);font-size:13px}',
      '#acil-tr-btn:hover{border-color:#794bc4}',
      '#acil-tr-panel{position:absolute;left:0;bottom:calc(100% + 10px);width:200px;max-height:60vh;overflow-y:auto;padding:6px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(20,20,20,.95);backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(0,0,0,.45);display:none}',
      '#acil-tr.open #acil-tr-panel{display:block}',
      '#acil-tr-panel button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-radius:9px;background:transparent;color:#fff;font-size:13px}',
      '#acil-tr-panel button:hover{background:rgba(121,75,196,.35)}',
      '#acil-tr-panel button.active{background:#794bc4}',
      '@media (max-width:600px){#acil-tr{left:12px;bottom:12px}}'
    ].join('\n');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- UI ---------- */
  function buildUI() {
    var current = getCurrent();
    var currentName = SOURCE;
    LANGS.forEach(function (l) {
      if (l.code === current) currentName = l.code.toUpperCase();
    });

    var wrap = document.createElement('div');
    wrap.id = 'acil-tr';
    wrap.className = 'notranslate';
    wrap.setAttribute('translate', 'no');

    var btn = document.createElement('button');
    btn.id = 'acil-tr-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Pilih bahasa / Choose language');
    btn.textContent = '\uD83C\uDF10 ' + currentName;

    var panel = document.createElement('div');
    panel.id = 'acil-tr-panel';

    LANGS.forEach(function (l) {
      var item = document.createElement('button');
      item.type = 'button';
      item.textContent = l.name;
      if (l.code === current) item.className = 'active';
      item.addEventListener('click', function () {
        if (l.code === current) {
          wrap.classList.remove('open');
          return;
        }
        setLang(l.code);
      });
      panel.appendChild(item);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      wrap.classList.remove('open');
    });

    wrap.appendChild(panel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);

    // Container yang dibutuhkan Google Translate
    var holder = document.createElement('div');
    holder.id = 'google_translate_element';
    document.body.appendChild(holder);
  }

  /* ---------- Jangan terjemahkan bagian tertentu ---------- */
  function protectSections() {
    // Teks animasi huruf-per-huruf & menu tab (agar tidak rusak)
    var sel = '#hello-friend, #name, #work, .navbar-tabs, .mobile-navbar-tabs-ul, .footer-bottom, .tooltip';
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('notranslate');
      el.setAttribute('translate', 'no');
    });
  }

  /* ---------- Muat Google Translate (hanya jika perlu) ---------- */
  function loadGoogle() {
    var codes = LANGS.map(function (l) { return l.code; }).join(',');
    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement(
        { pageLanguage: SOURCE, includedLanguages: codes, autoDisplay: false },
        'google_translate_element'
      );
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }

  /* ---------- Start ---------- */
  function init() {
    if (autoDetect()) return;
    injectCSS();
    protectSections();
    buildUI();
    if (getCurrent() !== SOURCE) {
      document.documentElement.setAttribute('lang', getCurrent());
      loadGoogle();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
