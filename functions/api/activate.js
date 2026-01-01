export async function onRequest(context) {
  try {
    const body = await context.request.text();
    const data = JSON.parse(body);
    const { email, code } = data;

    // Проверяем, что ACCOUNTS доступен
    if (!context.env.ACCOUNTS) {
      return new Response(JSON.stringify({ error: "ACCOUNTS не подключён" }), { status: 500 });
    }

    const key = email.toLowerCase();
    const accountData = await context.env.ACCOUNTS.get(key);

    return new Response(JSON.stringify({
      ok: true,
      email,
      accountData: accountData || "null"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка: " + err.message }), { status: 500 });
  }
}
