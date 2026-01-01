export async function onRequest(context) {
  return new Response(JSON.stringify({
    ACCOUNTS: !!context.env.ACCOUNTS,
    CODES: !!context.env.CODES
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
