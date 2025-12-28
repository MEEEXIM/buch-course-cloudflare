export async function onRequest(context) {
  try {
    const { email, password } = await context.request.json();
    const key = email.toLowerCase();

    const data = await context.env.ACCOUNTS.get(key);
    if (!data) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { hash, accessUntil } = JSON.parse(data);
    
    const inputHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const inputHashHex = Array.from(new Uint8Array(inputHashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (inputHashHex !== hash) {
      return new Response(JSON.stringify({ error: "Неверный пароль" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      hasAccess: accessUntil && Date.now() < accessUntil,
      accessUntil: accessUntil || null
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}