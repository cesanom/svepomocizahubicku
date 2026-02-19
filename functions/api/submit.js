export async function onRequestPost(context) {
  try {
    const data = await context.request.formData();
    
    // Extrakce dat z formuláře (musí odpovídat atributům "name" v index.html)
    const formData = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      location: data.get('location'),
      phase: data.get('phase'),
      message: data.get('message'),
    };

    // Zde se v budoucnu napojí odesílání na email.
    // Pro teď data uvidíš v logu v Cloudflare Dashboardu.
    console.log("Přijatá data:", formData);

    // Přesměrování zpět na web po úspěšném odeslání
    // Přidáme parametr ?success=1, abys mohl uživateli zobrazit poděkování
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': '/#kontakt?success=1',
        'Cache-Control': 'no-cache'
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
