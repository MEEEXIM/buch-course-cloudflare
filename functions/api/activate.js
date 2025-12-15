export async function onRequest(context) {
  const { email, code } = await context.request.json();
  
  const accountData = await context.env.ACCOUNTS.get(email.toLowerCase());
  if (!accountData) {
    return new Response(JSON.stringify({ error: "Аккаунт не найден" }), { status: 404 });
  }

  const expiresAtStr = await context.env.CODES.get(code.toUpperCase());
  if (!expiresAtStr) {
    return new Response(JSON.stringify({ error: "Код недействителен или уже использован" }), { status: 400 });
  }

  const expiresAt = parseInt(expiresAtStr);
  const account = JSON.parse(accountData);
  account.accessUntil = expiresAt;
  await context.env.ACCOUNTS.put(email.toLowerCase(), JSON.stringify(account));

  // 🔥 УДАЛЯЕМ КОД — он больше не будет работать!
  await context.env.CODES.delete(code.toUpperCase());

  return new Response(JSON.stringify({ ok: true, accessUntil: expiresAt }), {
    headers: { "Content-Type": "application/json" }
  });
}