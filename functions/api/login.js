export async function onRequest(context) {
  try {
    const { email, password, deviceId } = await context.request.json(); // ← ДОБАВЛЕНО: deviceId

    const key = email.toLowerCase();

    const data = await context.env.ACCOUNTS.get(key);
    if (!data) {
      return new Response(JSON.stringify({ error: "Аккаунт не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const account = JSON.parse(data);
    const { hash, accessUntil, deviceId: savedDeviceId } = account; // ← ДОБАВЛЕНО: savedDeviceId

    // 🔒 ПРОВЕРКА УСТРОЙСТВА (новое)
    if (savedDeviceId && deviceId !== savedDeviceId) {
      console.log("🚫 [LOG] Отказ входа: deviceId не совпадает", { 
        received: deviceId, 
        saved: savedDeviceId 
      });
      return new Response(JSON.stringify({ 
        error: "Доступ с этого устройства запрещён. Подписка привязана к другому устройству." 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

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
