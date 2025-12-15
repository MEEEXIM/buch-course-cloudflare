export async function onRequest(context) {
  const { email, password } = await context.request.json();
  if (!email || !password || password.length < 6) {
    return new Response(JSON.stringify({ error: "Email и пароль (≥6) обязательны" }), { status: 400 });
  }

  const accounts = await context.env.ACCOUNTS.get(email.toLowerCase());
  if (accounts) {
    return new Response(JSON.stringify({ error: "Аккаунт уже существует" }), { status: 409 });
  }

  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");

  await context.env.ACCOUNTS.put(email.toLowerCase(), JSON.stringify({ hash: hashHex }));

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}