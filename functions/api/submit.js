export async function onRequestPost(context) {
  try {
    const data = await context.request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const phone = data.get('phone');
    const location = data.get('location');
    const phase = data.get('phase');
    const message = data.get('message');

    // ZDE MŮŽEŠ PŘIDAT ODESÍLÁNÍ (např. přes Email API nebo Webhook)
    // Pro začátek jen vypíšeme do konzole Cloudflare a přesměrujeme uživatele
    
    console.log(`Nový kontakt: ${name} (${email}) - ${location}`);

    // Přesměrování na děkovací stránku (vytvoř si např. thanks.html)
    // Nebo se vrať zpět na hlavní stránku s parametrem success
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/?success=true#kontakt' },
    });

  } catch (err) {
    return new Response('Chyba při odesílání: ' + err.message, { status: 500 });
  }
}
