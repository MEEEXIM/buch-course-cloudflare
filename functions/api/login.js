export async function onRequest(context) {
  const { email, password } = await context.request.json();
  
  const accountData = await context.env.ACCOUNTS.get(email.toLowerCase());
  if (!accountData) {
    return new Response(JSON.stringify({ error: "Аккаунт не найден" }), { status: 404 });
  }

  const { hash, accessUntil } = JSON.parse(accountData);
  
  const inputHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const inputHex = Array.from(new Uint8Array(inputHash)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (inputHex !== hash) {
    return new Response(JSON.stringify({ error: "Неверный пароль" }), { status: 401 });
  }

  const hasAccess = accessUntil && Date.now() < accessUntil;
  return new Response(JSON.stringify({ ok: true, hasAccess, accessUntil }), {
    headers: { "Content-Type": "application/json" }
  });
}