export async function onRequest(context) {
  // 🔍 1. Лог: функция запущена
  console.log("🚀 [LOG] register.js: функция запущена");
  
  try {
    // 🔍 2. Лог: тело запроса
    const body = await context.request.text();
    console.log("📩 [LOG] Тело запроса:", body);
    
    // Парсим JSON вручную — чтобы избежать ошибок при пустом теле
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.log("❌ [LOG] Ошибка парсинга JSON:", e.message);
      return new Response(JSON.stringify({ error: "Некорректный JSON" }), { status: 400 });
    }

    const { email, password, deviceId } = data; // ← ДОБАВЛЕНО: deviceId
    console.log("📧 [LOG] Email:", email, "| Пароль (длина):", password?.length, "| DeviceId:", deviceId);

    if (!email || !password || password.length < 6) {
      console.log("⚠️ [LOG] Валидация не пройдена");
      return new Response(JSON.stringify({ error: "Email и пароль (≥6) обязательны" }), { status: 400 });
    }

    const key = email.toLowerCase();

    // 🔍 3. Лог: читаем из KV
    const existing = await context.env.ACCOUNTS.get(key);
    console.log("📖 [LOG] ACCOUNTS.get('" + key + "') →", existing);

    if (existing) {
      console.log("❗ [LOG] Аккаунт уже существует");
      return new Response(JSON.stringify({ error: "Аккаунт уже существует" }), { status: 409 });
    }

    // Хешируем пароль
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    console.log("🔐 [LOG] Хеш пароля:", hashHex.substring(0, 8) + "...");

    // 🔍 4. Лог: пишем в KV — с deviceId, если есть
    const account = { hash: hashHex };
    if (deviceId) {
      account.deviceId = deviceId;
      console.log("📱 [LOG] Привязка устройства:", deviceId);
    }

    await context.env.ACCOUNTS.put(key, JSON.stringify(account));
    console.log("✅ [LOG] ACCOUNTS.put('" + key + "') — УСПЕШНО");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("💥 [LOG] КРИТИЧЕСКАЯ ОШИБКА:", err.message, err.stack);
    return new Response(JSON.stringify({ error: "Ошибка сервера", details: err.message }), { status: 500 });
  }
}
  } catch (err) {
    // Логируем ошибку в Cloudflare (если понадобится)
    console.error("Ошибка в activate.js:", err.message);
    return new Response(JSON.stringify({
      error: "Ошибка активации",
      details: err.message
    }), { status: 500 });
  }
}
