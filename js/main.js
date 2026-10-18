/* ==========================================================================
   MegaPack Excel + IA 2026 - comportamiento de la pagina de ventas
   ========================================================================== */

/* ==========================  CONFIGURACION  ==============================
   Todo lo que normalmente editas esta aqui.

   IMPORTANTE (urgencia y escasez):
   La fecha de cierre y los cupos que aparecen en la pagina DEBEN ser reales.
   Si el precio de oferta no termina en esa fecha, o los bonos no se agotan,
   mostrar un contador o "quedan X cupos" es publicidad enganosa: puede
   costarte reclamos, reembolsos y la suspension de tu cuenta de afiliado.
   Los valores de abajo son de EJEMPLO. Ponlos reales o apaga la oferta con
   oferta.activa = false (se ocultan barra superior, contadores y cupos).
   ======================================================================= */
const CONFIG = {
  /* Enlace de compra de TODOS los botones. Pega aqui tu enlace oficial de
     afiliado de Hotmart (para que la comision quede a tu nombre). Si queda
     en null se usa el enlace que ya trae el HTML (checkout directo). */
  checkoutUrl: null,

  /* Precios mostrados. precioAntes debe ser el precio normal verdadero. */
  moneda: 'US$',
  precioAhora: 19,
  precioAntes: 29,

  oferta: {
    activa: true,
    /* Fecha y hora en que termina la promocion (hora local del visitante).
       Formato: 'AAAA-MM-DDTHH:MM:SS'. Al llegar, todo lo de urgencia se oculta. */
    termina: '2026-10-31T23:59:59',
    /* Cupos de los bonos de accion rapida. Actualiza "restantes" a mano. */
    cupos: { activo: true, total: 100, restantes: 37 },
  },

  /* WhatsApp de soporte con codigo de pais y sin "+", ej. '5215512345678'.
     Si queda vacio, la tarjeta de WhatsApp no se muestra. */
  whatsapp: '',

  /* TESTIMONIOS. Las 5 opiniones de abajo se tomaron de la pagina oficial del
     curso (informaticadigital.org/cursoexcel), con el nombre y la foto con los
     que alli aparecen. Antes de publicar:
       1) confirma con el productor que puedes usarlas, y
       2) cuando tengas opiniones de TUS propios compradores (con su permiso),
          reemplazalas o agregalas aqui: es lo que mas confianza genera.
     Si dejas la lista vacia, la seccion completa se oculta.
     Cada opinion: { texto, nombre, detalle, foto (opcional) }. Sin foto se
     muestra la inicial del nombre. */
  testimonios: [
    { texto: 'Gracias a este curso, aprendi a usar Excel y conseguí el trabajo que quería', nombre: 'Luis Quintana', detalle: 'Alumno del curso', foto: 'assets/img/alumnos/alumno-1.jpg' },
    { texto: 'Uy buenísima información, el curso de Excel me ayudó muchísimo para llevar mis cuentas de la Importaciones y ya voy por mi segunda importación', nombre: 'Ernesto Guevara', detalle: 'Alumno del curso', foto: 'assets/img/alumnos/alumno-3.jpg' },
    { texto: 'Los recomiendo al 100% muy bien explicado, los entendí más fácil que a mi profesor. Si es verdad lo que prometen.', nombre: 'Enrique García', detalle: 'Alumno del curso', foto: 'assets/img/alumnos/alumno-4.png' },
    { texto: 'No pensé que era cierto, por que está muy barato, pero si cumplieron y superaron mis expectativas. 5 estrellas.', nombre: 'Diana Verastegui', detalle: 'Alumna del curso', foto: 'assets/img/alumnos/alumno-5.jpg' },
    { texto: 'Quiero darte las gracias infinitas.. me has enseñado mucho.. Tengo 30 años soy profesional y no sabía nada de excel... me siento más seguro ya que entraré a un nuevo empleo y los nervios me embargaban terriblemente de dar una entrevistas y hacer pruebas sin saber excel...', nombre: 'Oscar Carrillo', detalle: 'Alumno del curso', foto: 'assets/img/alumnos/alumno-2.jpg' },
  ],

  /* RESULTADOS de alumnos ("Lo que nos van enviando"): trabajos, dashboards,
     certificados. Pon las imagenes en assets/img/resultados/. Vacio = oculto.
     { img: 'assets/img/resultados/a.png', alt: 'Dashboard de un alumno', nota: 'Enviado por un alumno' } */
  resultados: [],

  /* CAPTURAS DE CHAT ("Lo que nos escriben"): mensajes reales de WhatsApp o
     correo, con permiso. Pon las imagenes en assets/img/chats/. Vacio = oculto.
     { img: 'assets/img/chats/a.png', alt: 'Conversacion con un alumno' } */
  chats: [],
};

(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const money = (n) => CONFIG.moneda + ' ' + (Number.isInteger(n) ? String(n) : n.toFixed(2));

  /* ---- Enlaces de compra ---------------------------------------------- */
  if (CONFIG.checkoutUrl) $$('[data-buy]').forEach((a) => { a.href = CONFIG.checkoutUrl; });

  /* ---- Precios --------------------------------------------------------- */
  $$('[data-price-now]').forEach((el) => { el.textContent = money(CONFIG.precioAhora); });
  $$('[data-price-before]').forEach((el) => { el.textContent = money(CONFIG.precioAntes); });
  const pct = Math.max(0, Math.round((1 - CONFIG.precioAhora / CONFIG.precioAntes) * 100));
  $$('[data-save-pct]').forEach((el) => { el.textContent = String(pct); });

  /* ---- Oferta: cuenta regresiva y cupos --------------------------------- */
  const topbar = $('#topbar');
  const setBarHeight = () => document.documentElement.style.setProperty('--bar-h', (topbar && !topbar.hidden ? topbar.offsetHeight : 0) + 'px');

  const endAt = new Date(CONFIG.oferta.termina).getTime();
  const validDate = Number.isFinite(endAt);
  if (CONFIG.oferta.activa && !validDate) console.warn('[oferta] CONFIG.oferta.termina no es una fecha valida:', CONFIG.oferta.termina);

  let offerOn = CONFIG.oferta.activa && validDate && endAt > Date.now();
  const hideOffer = () => {
    offerOn = false;
    $$('[data-offer-only]').forEach((el) => { el.hidden = true; });
    setBarHeight();
  };

  const counters = $$('[data-countdown]');
  const texts = $$('[data-countdown-text]');
  const tick = () => {
    const left = endAt - Date.now();
    if (left <= 0) { hideOffer(); clearInterval(timer); return; }
    const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    counters.forEach((c) => {
      $('[data-u="d"]', c).textContent = pad(d);
      $('[data-u="h"]', c).textContent = pad(h);
      $('[data-u="m"]', c).textContent = pad(m);
      $('[data-u="s"]', c).textContent = pad(s);
    });
    texts.forEach((t) => { t.textContent = (d > 0 ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s); });
  };
  let timer;
  if (offerOn) { tick(); timer = setInterval(tick, 1000); } else { hideOffer(); }

  /* Cupos */
  const spots = $('[data-spots]');
  if (spots) {
    const { activo, total, restantes } = CONFIG.oferta.cupos;
    if (!activo || !(total > 0)) { spots.hidden = true; }
    else {
      $('[data-spots-left]', spots).textContent = String(restantes);
      $('[data-spots-total]', spots).textContent = String(total);
      const fill = $('[data-spots-fill]', spots);
      const used = Math.min(100, Math.max(0, ((total - restantes) / total) * 100));
      const apply = () => { fill.style.width = used + '%'; };
      if (reduceMotion || !('IntersectionObserver' in window)) apply();
      else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { apply(); o.disconnect(); } }, { threshold: 0.4 }).observe(spots);
    }
  }

  setBarHeight();
  addEventListener('resize', setBarHeight, { passive: true });

  /* ---- Revelado al hacer scroll --------------------------------------- */
  const revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- Contadores animados (cifras reales del curso) ------------------- */
  const countEls = $$('[data-count]');
  const render = (el, v) => { el.textContent = (el.dataset.prefix || '') + Math.round(v); };
  const runCount = (el) => {
    const target = +el.dataset.count; const dur = 1600; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      render(el, target * (1 - Math.pow(2, -10 * p)));   // easeOutExpo
      if (p < 1) requestAnimationFrame(step); else render(el, target);
    };
    requestAnimationFrame(step);
  };
  if (reduceMotion || !('IntersectionObserver' in window)) {
    countEls.forEach((el) => render(el, +el.dataset.count));
  } else {
    countEls.forEach((el) => render(el, 0));
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    countEls.forEach((el) => cio.observe(el));
  }

  /* ---- Videos: solo uno reproduciendose a la vez ----------------------- */
  const videos = $$('video');
  videos.forEach((v) => v.addEventListener('play', () => videos.forEach((o) => { if (o !== v) o.pause(); })));

  /* ---- Barra de compra fija en movil ----------------------------------- */
  const sticky = $('#stickyBuy');
  const heroCta = $('#heroCta');
  if (sticky && heroCta && 'IntersectionObserver' in window) {
    let heroGone = false; const covered = new Set();
    const update = () => sticky.classList.toggle('is-on', heroGone && covered.size === 0);
    new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(heroCta);
    ['#oferta', '#final'].forEach((sel) => {
      const el = $(sel); if (!el) return;
      new IntersectionObserver(([e]) => { e.isIntersecting ? covered.add(sel) : covered.delete(sel); update(); }, { threshold: 0.25 }).observe(el);
    });
  }

  /* ---- WhatsApp de soporte (opcional) ---------------------------------- */
  if (CONFIG.whatsapp) {
    const card = $('#supWhats'); const link = $('#whatsLink');
    if (card && link) {
      link.href = 'https://wa.me/' + String(CONFIG.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, tengo una duda sobre el curso de Excel.');
      card.hidden = false;
    }
  }

  /* ---- Testimonios: dos filas en sentidos opuestos (formato de la referencia) --- */
  const section = $('#opiniones');
  const trackA = $('#trackA'); const trackB = $('#trackB');
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const starRow = () => {
    const s = el('span', 'stars'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', '5 de 5 estrellas');
    for (let i = 0; i < 5; i++) { const i2 = el('span', 'icon i-star-fill'); i2.setAttribute('aria-hidden', 'true'); s.append(i2); }
    return s;
  };
  const card = (t, dup) => {
    const c = el('article', 'tcard');
    if (dup) { c.setAttribute('aria-hidden', 'true'); c.dataset.dup = ''; }
    const q = el('p', null, '“' + t.texto + '”');
    const f = el('footer');
    if (t.foto) { const im = el('img'); im.src = t.foto; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 48; im.height = 48; f.append(im); }
    else { f.append(el('span', 'avatar', (t.nombre || '?').trim().charAt(0).toUpperCase())); }
    const who = el('div'); who.append(el('b', null, t.nombre || ''), t.detalle || ''); f.append(who);
    c.append(starRow(), q, f);
    if (t.demo) c.append(el('span', 'demo-flag', 'Demo'));
    return c;
  };
  const demo = new URLSearchParams(location.search).has('demo');
  const items = CONFIG.testimonios.filter((t) => t && t.texto && t.nombre);

  if (section && trackA && trackB && items.length) {
    const rotate = (a, n) => a.slice(n % a.length).concat(a.slice(0, n % a.length));
    const fill = (track, list) => {
      const dur = Math.max(40, list.length * 14) + 's';
      track.style.setProperty('--dur', dur);
      list.forEach((t) => track.append(card(t, false)));
      list.forEach((t) => track.append(card(t, true)));      // copia para que el bucle no tenga saltos
    };
    fill(trackA, items);
    fill(trackB, rotate(items, Math.ceil(items.length / 2)));
  } else if (section) {
    section.hidden = true;
  }

  /* ---- Resultados de alumnos y capturas de chat (solo con imagenes reales) --- */
  const galR = $('#galResultados'); const results = $('#results');
  const galC = $('#galChats'); const chats = $('#chats');
  const ph = (txt) => el('div', 'ph', txt);
  const R = CONFIG.resultados.length ? CONFIG.resultados : (demo ? [{ demo: true }, { demo: true }, { demo: true }] : []);
  if (galR && results && R.length) {
    R.forEach((r) => {
      const fig = el('figure', 'result');
      if (r.img) { const im = el('img'); im.src = r.img; im.alt = r.alt || 'Resultado de un alumno'; im.loading = 'lazy'; fig.append(im); }
      else fig.append(ph('Aquí va la imagen de un trabajo o resultado real de un alumno'));
      fig.append(el('figcaption', null, r.nota || (r.demo ? 'Enviado por un alumno' : '')));
      if (r.demo) fig.append(el('span', 'demo-flag', 'Demo'));
      results.append(fig);
    });
    galR.hidden = false;
  }
  const C = CONFIG.chats.length ? CONFIG.chats : (demo ? [{ demo: true }, { demo: true }, { demo: true }, { demo: true }] : []);
  if (galC && chats && C.length) {
    C.forEach((c) => {
      const d = el('div', 'chat');
      if (c.img) { const im = el('img'); im.src = c.img; im.alt = c.alt || 'Conversación con un alumno'; im.loading = 'lazy'; d.append(im); }
      else d.append(ph('Aquí va una captura real de WhatsApp o correo'));
      if (c.demo) d.append(el('span', 'demo-flag', 'Demo'));
      chats.append(d);
    });
    galC.hidden = false;
  }
})();
