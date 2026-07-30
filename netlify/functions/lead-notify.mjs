const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendMessage(text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
}

function extractData(body) {
  const candidates = [
    body?.payload?.data,
    body?.payload?.human_fields,
    body?.data,
    body?.human_fields
  ];
  for (const c of candidates) {
    if (c && typeof c === "object" && Object.keys(c).length) return c;
  }
  return null;
}

function extractFormName(body) {
  return (
    body?.payload?.form_name ||
    body?.form_name ||
    body?.payload?.data?.["form-name"] ||
    body?.data?.["form-name"] ||
    "desconocido"
  );
}

export default async (req) => {
  if (req.method !== "POST") return new Response("OK");

  try {
    const body = await req.json();
    console.log("lead-notify raw body:", JSON.stringify(body));

    const formName = extractFormName(body);
    const data = extractData(body);

    const lines = [`Nuevo lead - Web personal - ${formName}`, ""];

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (!value || key === "form-name" || key.endsWith("-hp")) continue;
        lines.push(`${key}: ${value}`);
      }
    } else {
      lines.push("(no se pudieron leer los campos, revisar logs de la funcion)");
      lines.push("");
      lines.push(JSON.stringify(body).slice(0, 500));
    }

    await sendMessage(lines.join("\n"));
  } catch (e) {
    console.error("lead-notify error:", e);
  }

  return new Response("OK");
};

export const config = { path: "/api/lead-notify" };
