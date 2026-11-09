// Cloudflare Worker pro ukládání kontaktních formulářů do D1 databáze
// Nasadit přes: wrangler deploy nebo Cloudflare Dashboard
//
// E-mailová notifikace o novém záznamu (volitelná):
//   - binding typu "Send email" s názvem NOTIFY (Settings → Bindings)
//   - proměnná NOTIFY_TO = adresa, kam má notifikace přijít
//     (musí být ověřená v Email Routing → Destination addresses)
//   - proměnná NOTIFY_FROM (nepovinná), výchozí formular@svepomocizahubicku.cz
// Když binding chybí, formulář funguje dál, jen bez notifikace.

import { EmailMessage } from 'cloudflare:email';

const PHASES = {
  'planuji': 'Plánuji (zvažuji výstavbu)',
  'projekt': 'Projekt (již máme projektovou dokumentaci)',
  'hruba-stavba': 'Hrubá stavba (základy, konstrukce)',
  'dokonceni': 'Dokončování (interiér, technologie)'
};

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function cleanHeader(v) {
  return String(v || '').replace(/[\r\n]+/g, ' ').trim();
}

async function sendNotificationEmail(data, id, env) {
  if (!env.NOTIFY || !env.NOTIFY_TO) {
    console.log('Notifikace vypnuta (chybí NOTIFY binding nebo NOTIFY_TO)');
    return;
  }
  const from = env.NOTIFY_FROM || 'formular@svepomocizahubicku.cz';
  const to = env.NOTIFY_TO;
  const subject = `Nová poptávka z webu: ${cleanHeader(data.name)} (${cleanHeader(data.location)})`;
  const body = [
    'Přes kontaktní formulář na svepomocizahubicku.cz přišla nová poptávka.',
    '',
    `Jméno:    ${data.name}`,
    `E-mail:   ${data.email}`,
    `Telefon:  ${data.phone || '—'}`,
    `Lokalita: ${data.location}`,
    `Fáze:     ${PHASES[data.phase] || data.phase}`,
    '',
    'Zpráva:',
    data.message || '—',
    '',
    `ID v databázi: ${id ?? '?'}`,
    `Odesláno: ${new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })}`,
    '',
    'Na tento e-mail můžete rovnou odpovědět – odpověď půjde zájemci.'
  ].join('\r\n');

  const domain = from.split('@')[1];
  const replyTo = cleanHeader(data.email);
  const raw = [
    `From: =?UTF-8?B?${b64utf8('Svépomocí za hubičku – formulář')}?= <${from}>`,
    `To: <${to}>`,
    /^[^\s@<>]+@[^\s@<>]+$/.test(replyTo) ? `Reply-To: <${replyTo}>` : null,
    `Subject: =?UTF-8?B?${b64utf8(subject)}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64utf8(body).replace(/.{76}/g, '$&\r\n')
  ].filter(l => l !== null).join('\r\n');

  await env.NOTIFY.send(new EmailMessage(from, to, raw));
}

export default {
  async fetch(request, env, ctx) {
    // Získání původu (origin) požadavku pro CORS
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = [
      'https://svepomocizahubicku.cz',
      'https://www.svepomocizahubicku.cz',
      'http://localhost:8080',
      'http://localhost:3000',
      'null' // Pro file:// protokol při lokálním testování
    ];
    
    // CORS headers - povolíme konkrétní domény nebo * pro testování
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Kontrola URL cesty - očekáváme /submit-form
    const url = new URL(request.url);
    if (url.pathname !== '/submit-form' && url.pathname !== '/') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    // Pouze POST požadavky
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    try {
      const data = await request.json();
      
      // Validace povinných polí
      if (!data.name || !data.email || !data.location || !data.phase) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Vyplňte prosím všechna povinná pole' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validace emailu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid email',
          message: 'Zadejte platnou emailovou adresu' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Souhlas se zpracováním osobních údajů je povinný
      if (data.consent !== true) {
        return new Response(JSON.stringify({
          error: 'Missing consent',
          message: 'Pro odeslání je nutné souhlasit se zpracováním osobních údajů.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validace telefonu (nepovinný) – český formát +420 XXX XXX XXX
      if (data.phone) {
        let digits = String(data.phone).replace(/\D/g, '');
        if (digits.startsWith('00420')) digits = digits.slice(5);
        else if (digits.length === 12 && digits.startsWith('420')) digits = digits.slice(3);
        if (!/^\d{9}$/.test(digits)) {
          return new Response(JSON.stringify({
            error: 'Invalid phone',
            message: 'Zadejte platné české telefonní číslo (9 číslic)'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        data.phone = '+420 ' + digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      }

      // Uložení do D1 databáze
      // Předpokládá tabulku: CREATE TABLE contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, location TEXT, phase TEXT, message TEXT, consent INTEGER, created_at TEXT)
      const { results } = await env.DB.prepare(
        `INSERT INTO contacts (name, email, phone, location, phase, message, consent, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
      ).bind(
        data.name,
        data.email,
        data.phone || '',
        data.location,
        data.phase,
        data.message || '',
        data.consent ? 1 : 0,
        data.timestamp || new Date().toISOString()
      ).all();

      // Odeslání notifikačního e-mailu – chyba notifikace neovlivní uložení záznamu
      const newId = results[0]?.id;
      ctx.waitUntil(
        sendNotificationEmail(data, newId, env).catch(err => console.error('Notifikace selhala:', err))
      );

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Data uložena',
        id: results[0]?.id 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Server error',
        message: 'Chyba serveru při zpracování požadavku' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
