export async function onRequest(context) {
  try {
    // 1. Получаем и логируем тело запроса
    const body = await context.request.text();
    console.log("📥 Тело запроса:", body);

    // 2. Парсим JSON вручную (без .json() — чтобы избежать ошибок)
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Некорректный JSON: " + e.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      received: data
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка: " + err.message }), { status: 500 });
  }
}
