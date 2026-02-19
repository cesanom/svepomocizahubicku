// Cloudflare Worker pro ukládání kontaktních formulářů do D1 databáze
// Nasadit přes: wrangler deploy nebo Cloudflare Dashboard

export default {
  async fetch(request, env, ctx) {
    // CORS headers pro povolení požadavků z vaší domény
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // V produkci změňte na konkrétní doménu
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

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