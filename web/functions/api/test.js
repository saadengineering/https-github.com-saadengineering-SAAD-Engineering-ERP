export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      success: true,
      message: "SAAD Engineering API is working!",
      database: !!context.env.DB
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
