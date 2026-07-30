const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendMessage(text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" })
  });
}

export default async (req) => {
  if (req.method !== "POST") return new Response("OK");

  try {
    const body = await req.json();
    const payload = body.payload || {};
    const formName = payload.form_name || "desconocido";
    const data = payload.data || {};

    const lines = [`🔔 *[Web personal] Nuevo lead — ${formName}*`, ""];
    for (const [key, value] of Object.entries(data)) {
      if (!value || key === "form-name" || key.endsWith("-hp")) continue;
      lines.push(`*${key}:* ${value}`);
    }

    await sendMessage(lines.join("\n"));
  } catch (e) {
    console.error("lead-notify error:", e);
  }

  return new Response("OK");
};

export const config = { path: "/api/lead-notify" };
