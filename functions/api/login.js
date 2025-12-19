export async function onRequest(context) {
  try {
    const { email, code } = await context.request.json();
    const key = email.toLowerCase();

    const accountData = await context.env.ACCOUNTS.get(key);
    if (!accountData) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const expiresAtStr = await context.env.CODES.get(code.toUpperCase());
    if (!expiresAtStr) {
      return new Response(JSON.stringify({ error: "Код недействителен или уже использован" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const expiresAt = parseInt(expiresAtStr);
    const account = JSON.parse(accountData);
    account.accessUntil = expiresAt;
    await context.env.ACCOUNTS.put(key, JSON.stringify(account));

    // 🔥 УДАЛЯЕМ КОД — он больше не будет работать!
    await context.env.CODES.delete(code.toUpperCase());

    return new Response(JSON.stringify({ ok: true, accessUntil: expiresAt }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}