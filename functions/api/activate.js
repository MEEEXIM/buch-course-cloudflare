export async function onRequest(context) {
  try {
    const data = await context.request.json();
    const { email, code } = data;

    const accountData = await context.env.ACCOUNTS.get(email.toLowerCase());
    const codeData = await context.env.CODES.get(code.toUpperCase());

    return new Response(JSON.stringify({
      ok: true,
      account: !!accountData,
      code: codeData || "не найден"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Ошибка: " + err.message }), { status: 500 });
  }
}
