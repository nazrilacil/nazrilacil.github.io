/*!
 * translate.js v2 — Fitur translate otomatis untuk website portfolio
 * Memakai mesin Google Translate dengan tombol bahasa kustom.
 *
 * Tombol dipasang lewat atribut  data-lang-toggle  pada elemen apa pun
 * (contoh: link di navbar & menu mobile). Kalau tidak ada elemen
 * tersebut, skrip otomatis membuat tombol 🌐 melayang di kiri bawah.
 */
(function () {
  'use strict';

  var SOURCE = 'en'; // bahasa asli konten

  var LANGS = [
    { code: 'en', cc: 'gb', name: 'English (asli)' },
    { code: 'id', cc: 'id', name: 'Indonesia' },
    { code: 'jw', cc: 'id', name: 'Basa Jawa' },
    { code: 'su', cc: 'id', name: 'Basa Sunda' },
    { code: 'ms', cc: 'my', name: 'Melayu' },
    { code: 'ar', cc: 'sa', name: 'العربية' },
    { code: 'ja', cc: 'jp', name: '日本語' },
    { code: 'ko', cc: 'kr', name: '한국어' },
    { code: 'zh-CN', cc: 'cn', name: '中文' },
    { code: 'es', cc: 'es', name: 'Español' },
    { code: 'fr', cc: 'fr', name: 'Français' },
    { code: 'de', cc: 'de', name: 'Deutsch' }
  ];

  var STORAGE_KEY = 'acil_translate_visited';

  // Bendera dimuat sebagai gambar (flagcdn.com) agar tampil sama di semua perangkat,
  // termasuk Windows yang tidak punya emoji bendera.
  function flagHTML(code) {
    var c = LANGS[0].cc;
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code === code) c = LANGS[i].cc;
    }
    return '<img src="https://flagcdn.com/w40/' + c + '.png" ' +
           'srcset="https://flagcdn.com/w80/' + c + '.png 2x" ' +
           'width="20" height="15" alt="" draggable="false">';
  }
  var panel = null;

  /* ---------- Cookie ---------- */
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
    var firstVisit = false;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, '1');
        firstVisit = true;
      }
    } catch (e) {}
    if (!firstVisit) return false;

    var target = browserLang();
    if (target !== SOURCE && getCurrent() === SOURCE) {
      setLang(target);
      return true;
    }
    return false;
  }

  /* ---------- Style ---------- */
  function injectCSS() {
    var css = [
      // Sembunyikan bar & tooltip bawaan Google
      '.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate, iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd{visibility:hidden!important;height:0!important;min-height:0!important;border:0!important}',
      'body{top:0!important}',
      '#goog-gt-tt, .goog-tooltip, .goog-tooltip:hover{display:none!important}',
      '.goog-text-highlight{background:none!important;box-shadow:none!important}',
      '#google_translate_element{position:absolute;left:-9999px;top:0;height:0;overflow:hidden}',

      // Tombol pemicu
      '[data-lang-toggle]{cursor:pointer;user-select:none}',
      '.lang-flag{display:inline-block;margin-right:6px;line-height:1;vertical-align:-0.15em}',
      '.lang-flag img{width:1.3em!important;height:auto!important;display:inline-block;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.25);filter:none!important}',
      '#acil-tr-panel button img{width:20px!important;height:auto!important;margin-right:10px;vertical-align:middle;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.2);filter:none!important}',
      '.lang-li{list-style:none}',

      // Panel pilihan bahasa (popover)
      '#acil-tr-panel{position:fixed;z-index:2147483000;width:210px;max-height:60vh;overflow-y:auto;padding:6px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(20,20,20,.96);backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(0,0,0,.45);display:none;font-family:"Fira Code",system-ui,sans-serif}',
      '#acil-tr-panel.open{display:block}',
      '#acil-tr-panel button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-radius:9px;background:transparent;color:#fff;font:inherit;font-size:13px;cursor:pointer}',
      '#acil-tr-panel button:hover{background:rgba(121,75,196,.35)}',
      '#acil-tr-panel button.active{background:#794bc4}',

      // Tombol melayang (hanya dipakai bila tidak ada data-lang-toggle)
      '#acil-tr-float{position:fixed;left:20px;bottom:20px;z-index:99999;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(20,20,20,.85);color:#fff;font:inherit;font-size:13px;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.35)}',
      '@media (max-width:600px){#acil-tr-float{left:12px;bottom:12px}}'
    ].join('\n');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- Panel bahasa ---------- */
  function buildPanel() {
    var current = getCurrent();
    panel = document.createElement('div');
    panel.id = 'acil-tr-panel';
    panel.className = 'notranslate';
    panel.setAttribute('translate', 'no');

    LANGS.forEach(function (l) {
      var item = document.createElement('button');
      item.type = 'button';
      item.innerHTML = flagHTML(l.code) + '<span></span>';
      item.lastChild.textContent = l.name;
      if (l.code === current) item.className = 'active';
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        if (l.code === current) {
          closePanel();
          return;
        }
        setLang(l.code);
      });
      panel.appendChild(item);
    });

    document.body.appendChild(panel);
  }

  function openPanel(trigger) {
    var r = trigger.getBoundingClientRect();
    var w = 210;
    panel.classList.add('open');

    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + 8;
    var h = panel.offsetHeight;
    if (top + h > window.innerHeight - 8) {
      top = Math.max(8, r.top - h - 8); // buka ke atas bila tidak muat di bawah
    }
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function closePanel() {
    if (panel) panel.classList.remove('open');
  }

  var openedAt = 0;
  var openedScrollY = 0;

  // Delegasi klik di fase capture: berjalan lebih dulu daripada handler
  // lain (mis. smooth-scroll atau tutup-menu di main.js) sehingga tidak
  // bisa membatalkan pembukaan panel.
  function bindGlobalClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-lang-toggle]') : null;

      if (t) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        console.log('[translate] tombol bahasa diklik');
        if (panel.classList.contains('open')) {
          closePanel();
        } else {
          openPanel(t);
          openedAt = Date.now();
          openedScrollY = window.pageYOffset || 0;
        }
        return;
      }

      // klik di dalam panel dibiarkan (ditangani tombol bahasa)
      if (panel.contains(e.target)) return;

      closePanel();
    }, true);

    // tutup saat scroll sungguhan, bukan scroll otomatis sesaat setelah dibuka
    window.addEventListener('scroll', function () {
      if (!panel.classList.contains('open')) return;
      var moved = Math.abs((window.pageYOffset || 0) - openedScrollY);
      if (Date.now() - openedAt > 500 && moved > 40) closePanel();
    }, { passive: true });
  }

  function setupTriggers() {
    var triggers = document.querySelectorAll('[data-lang-toggle]');

    // Cadangan: bila tidak ada tombol di HTML, buat tombol melayang
    if (!triggers.length) {
      var f = document.createElement('button');
      f.id = 'acil-tr-float';
      f.type = 'button';
      f.className = 'notranslate';
      f.setAttribute('translate', 'no');
      f.setAttribute('data-lang-toggle', '');
      f.setAttribute('aria-label', 'Pilih bahasa / Choose language');
      f.innerHTML = '<span class="lang-flag"></span> <span class="lang-code"></span>';
      document.body.appendChild(f);
      triggers = document.querySelectorAll('[data-lang-toggle]');
    }

    var code = getCurrent().toUpperCase().replace('ZH-CN', 'ZH');
    Array.prototype.forEach.call(triggers, function (t) {
      var label = t.querySelector('.lang-code');
      if (label) label.textContent = code;
      var fl = t.querySelector('.lang-flag');
      if (fl) fl.innerHTML = flagHTML(getCurrent());
    });

    bindGlobalClicks();
    window.addEventListener('resize', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  /* ---------- Jangan terjemahkan bagian tertentu ---------- */
  function protectSections() {
    var sel = '#hello-friend, #name, #work, .navbar-tabs, .mobile-navbar-tabs-ul, .footer-bottom, .tooltip, .lang-li';
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('notranslate');
      el.setAttribute('translate', 'no');
    });
  }

  /* ---------- Muat Google Translate (hanya jika perlu) ---------- */
  function loadGoogle() {
    var holder = document.createElement('div');
    holder.id = 'google_translate_element';
    document.body.appendChild(holder);

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
    s.onload = function () {
      console.log('[translate] script Google Translate berhasil dimuat');
      setTimeout(function () {
        if (!document.querySelector('.goog-te-combo')) {
          console.warn('[translate] widget Google belum terbentuk (kemungkinan diblokir ekstensi/jaringan)');
        }
      }, 2500);
    };
    s.onerror = function () {
      console.error('[translate] GAGAL memuat translate.google.com — kemungkinan diblokir adblock, DNS, atau jaringan');
    };
    document.head.appendChild(s);
  }

  /* ---------- Start ---------- */
  function init() {
    if (autoDetect()) return;
    injectCSS();
    protectSections();
    buildPanel();
    setupTriggers();
    console.log('[translate] siap. tombol ditemukan: ' +
      document.querySelectorAll('[data-lang-toggle]').length +
      ', bahasa aktif: ' + getCurrent());
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
