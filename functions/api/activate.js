export async function onRequest(context) {
  try {
    // 1. Получаем данные
    const { email, code } = await context.request.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email и код обязательны" }), { status: 400 });
    }

    const key = email.toLowerCase();

    // 2. Проверяем аккаунт
    const accountData = await context.env.ACCOUNTS.get(key);
    if (!accountData) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), { status: 404 });
    }

    // 3. Проверяем код
    const expiresAtStr = await context.env.CODES.get(code.toUpperCase());
    if (expiresAtStr === null) {
      return new Response(JSON.stringify({ error: "Код недействителен или уже использован" }), { status: 400 });
    }

    // 4. Преобразуем срок
    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) {
      return new Response(JSON.stringify({ error: "Некорректный срок действия кода" }), { status: 500 });
    }

    // 5. Обновляем аккаунт
    const account = JSON.parse(accountData);
    account.accessUntil = expiresAt;

    // 6. Сохраняем + удаляем код
    await context.env.ACCOUNTS.put(key, JSON.stringify(account));
    await context.env.CODES.delete(code.toUpperCase());

    // 7. Успех!
    return new Response(JSON.stringify({
      ok: true,
      accessUntil: expiresAt
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    // Логируем ошибку в Cloudflare (если понадобится)
    console.error("Ошибка в activate.js:", err.message);
    return new Response(JSON.stringify({
      error: "Ошибка активации",
      details: err.message
    }), { status: 500 });
  }
}
