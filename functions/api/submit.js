export async function onRequestPost(context) {
  try {
    const data = await context.request.formData();
    
    // Posbíráme data pro kontrolu (uvidíš je v logách Cloudflare)
    const payload = Object.fromEntries(data.entries());
    console.log("Přijatá data:", payload);

    // Tady můžete v budoucnu přidat odesílání na email
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
