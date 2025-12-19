export async function onRequest(context) {
  try {
    const { email, password } = await context.request.json();
    
    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Email и пароль (≥6) обязательны" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const key = email.toLowerCase();
    const existing = await context.env.ACCOUNTS.get(key);
    if (existing) {
      return new Response(JSON.stringify({ error: "Аккаунт уже существует" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    await context.env.ACCOUNTS.put(key, JSON.stringify({ hash: hashHex }));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка сервера", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}