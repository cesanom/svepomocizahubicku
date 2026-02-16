export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  const { name, email, phone, message } = data;

  if (!name || !email) {
    return new Response("Missing required fields", { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO contacts (name, email, phone, message)
     VALUES (?, ?, ?, ?)`
  )
    .bind(name, email, phone, message)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
