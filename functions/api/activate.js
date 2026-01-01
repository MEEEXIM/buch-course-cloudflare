export async function onRequest(context) {
  try {
    // 1. Получаем тело запроса БЕЗОПАСНО
    let data;
    try {
      data = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Некорректный JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { email, code } = data;

    // 2. Валидация входных данных
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email и код обязательны" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const key = email.toLowerCase();

    // 3. Проверяем аккаунт
    const accountData = await context.env.ACCOUNTS.get(key);
    if (!accountData) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Проверяем код ДО parseInt!
    const expiresAtStr = await context.env.CODES.get(code.toUpperCase());
    if (expiresAtStr === null) {
      return new Response(JSON.stringify({ error: "Код недействителен или уже использован" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. БЕЗОПАСНЫЙ парсинг числа
    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) {
      return new Response(JSON.stringify({ error: "Некорректный срок действия кода" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 6. Обновляем аккаунт
    let account;
    try {
      account = JSON.parse(accountData);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Повреждённые данные аккаунта" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    account.accessUntil = expiresAt;

    // 7. Сохраняем и удаляем код
    await context.env.ACCOUNTS.put(key, JSON.stringify(account));
    await context.env.CODES.delete(code.toUpperCase());

    return new Response(JSON.stringify({ 
      ok: true, 
      accessUntil: expiresAt 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    // 🔥 ЛОГИРУЕМ ОШИБКУ ДЛЯ ДИАГНОСТИКИ
    console.error("❌ activate.js error:", err.message, err.stack);
    
    return new Response(JSON.stringify({ 
      error: "Ошибка сервера", 
      details: "Проверьте логи в Cloudflare" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
