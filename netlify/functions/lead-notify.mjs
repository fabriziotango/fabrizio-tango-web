const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const EXCLUDE_KEYS = ["form-name", "ip", "user_agent", "referrer", "id", "number", "created_at"];

const LABELS = {
  nombre: "Nombre",
  email: "Email",
  telefono: "Teléfono",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  servicio: "Servicio",
  turno: "Turno"
};

const TITLES = {
  diagnostico: "Diagnóstico personalizado",
  agendar: "Agenda de llamada"
};

async function sendMessage(text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
}

function extractData(body) {
  const candidates = [body?.payload?.data, body?.data, body?.payload?.human_fields, body?.human_fields];
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
    null
  );
}

export default async (req) => {
  if (req.method !== "POST") return new Response("OK");

  try {
    const body = await req.json();
    const formName = extractFormName(body);
    const data = extractData(body);

    const title = TITLES[formName] || "Nuevo contacto desde la web";
    const lines = [`Nuevo lead: ${title}`, ""];

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (!value || EXCLUDE_KEYS.includes(key) || key.endsWith("-hp")) continue;

        if (key === "respuestas") {
          lines.push("Respuestas del cuestionario:");
          String(value).split(" | ").forEach(r => lines.push("- " + r));
          continue;
        }

        const label = LABELS[key] || key;
        lines.push(`${label}: ${value}`);
      }
    } else {
      lines.push("No se pudieron leer los datos del formulario.");
    }

    await sendMessage(lines.join("\n"));
  } catch (e) {
    console.error("lead-notify error:", e);
  }

  return new Response("OK");
};

export const config = { path: "/api/lead-notify" };
