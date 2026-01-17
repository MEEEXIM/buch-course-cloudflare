export async function onRequest(context) {
  try {
    const { email, code, deviceId } = await context.request.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email и код обязательны" }), { status: 400 });
    }

    const key = email.toLowerCase();

    const accountData = await context.env.ACCOUNTS.get(key);
    if (!accountData) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), { status: 404 });
    }

    // Проверяем, что код существует (но НЕ используем его значение как срок!)
    const codeExists = await context.env.CODES.get(code.toUpperCase());
    if (codeExists === null) {
      return new Response(JSON.stringify({ error: "Код недействителен или уже использован" }), { status: 400 });
    }

    // ✅ ВСЕГДА даём доступ на 30 дней с момента активации
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const accessUntil = Date.now() + THIRTY_DAYS_MS;

    const account = JSON.parse(accountData);
    account.accessUntil = accessUntil;

    if (deviceId) {
      account.deviceId = deviceId;
    }

    // Сохраняем аккаунт и удаляем код
    await context.env.ACCOUNTS.put(key, JSON.stringify(account));
    await context.env.CODES.delete(code.toUpperCase());

    return new Response(JSON.stringify({
      ok: true,
      accessUntil: accessUntil
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Ошибка в activate.js:", err.message);
    return new Response(JSON.stringify({
      error: "Ошибка активации",
      details: err.message
    }), { status: 500 });
  }
}
