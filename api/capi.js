/* ==========================================================================
   Meta Conversions API (servidor). Vercel la publica en /api/capi.

   La pagina manda aqui cada evento (PageView, InitiateCheckout) con el mismo
   event_id que usa el pixel del navegador; Meta junta los dos y cuenta uno solo.

   Variables de entorno (Vercel > Project > Settings > Environment Variables):
     META_PIXEL_ID          ID del pixel                       (obligatoria)
     META_CAPI_TOKEN        token de acceso de la API de conversiones (obligatoria)
     META_TEST_EVENT_CODE   codigo de "Probar eventos", solo mientras pruebas (opcional)
     META_API_VERSION       version de la Graph API, por defecto v25.0 (opcional)
     SITE_HOSTS             dominios extra permitidos, separados por coma (opcional)

   El token NUNCA va en el codigo ni en el navegador.
   ========================================================================== */

const EVENTOS = new Set(['PageView', 'InitiateCheckout']);
const RE_ID = /^[A-Za-z0-9_.:-]{8,80}$/;
const RE_FB = /^fb\.[0-9]\.[0-9]{10,13}\.[A-Za-z0-9_-]{1,200}$/;

const limpio = (v, re) => (typeof v === 'string' && re.test(v) ? v : undefined);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return res.status(500).json({ ok: false, error: 'sin configurar' });

  /* Solo se aceptan eventos que vengan de esta misma pagina: evita que otros
     sitios (o un script) llenen tu pixel de eventos falsos. */
  const host = String(req.headers.host || '').toLowerCase();
  const permitidos = new Set([host, ...String(process.env.SITE_HOSTS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)]);
  let origenOk = false;
  try { origenOk = permitidos.has(new URL(req.headers.origin).host.toLowerCase()); } catch (e) { /* sin Origin valido */ }
  if (!origenOk) return res.status(403).json({ ok: false });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false });

  if (!EVENTOS.has(b.event_name)) return res.status(400).json({ ok: false, error: 'evento' });
  const eventId = limpio(b.event_id, RE_ID);
  if (!eventId) return res.status(400).json({ ok: false, error: 'event_id' });

  /* URL de la pagina: debe ser de este mismo dominio; si no, se usa la raiz. */
  let url = 'https://' + host + '/';
  try { const u = new URL(b.url); if (permitidos.has(u.host.toLowerCase())) url = u.origin + u.pathname + u.search; } catch (e) { /* se queda la raiz */ }

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();

  const evento = {
    event_name: b.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: url.slice(0, 500),
    action_source: 'website',
    user_data: {
      client_ip_address: ip || undefined,
      client_user_agent: String(req.headers['user-agent'] || '').slice(0, 500) || undefined,
      fbp: limpio(b.fbp, RE_FB),
      fbc: limpio(b.fbc, RE_FB),
    },
  };

  if (b.event_name === 'InitiateCheckout') {
    const value = Number(b.value);
    if (Number.isFinite(value) && value >= 0 && value <= 10000 && /^[A-Z]{3}$/.test(b.currency)) {
      evento.custom_data = { value, currency: b.currency };
    }
  }

  const payload = { data: [evento] };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  const version = /^v\d+\.\d+$/.test(process.env.META_API_VERSION || '') ? process.env.META_API_VERSION : 'v25.0';
  const endpoint = 'https://graph.facebook.com/' + version + '/' + encodeURIComponent(pixel) + '/events?access_token=' + encodeURIComponent(token);

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) {
      /* Se registra el motivo (sin el token) para verlo en Vercel > Logs. */
      const txt = await r.text().catch(() => '');
      console.error('Meta CAPI respondio', r.status, txt.slice(0, 500));
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Meta CAPI fallo:', e && e.name);
    return res.status(502).json({ ok: false });
  }
};
