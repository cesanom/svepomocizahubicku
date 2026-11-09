// Cloudflare Worker pro ukládání kontaktních formulářů do D1 databáze
// Nasadit přes: wrangler deploy nebo Cloudflare Dashboard

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

      // Odeslání notifikačního emailu (volitelné - pomocí Cloudflare Email Routing nebo externí služby)
      // await sendNotificationEmail(data, env);

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
