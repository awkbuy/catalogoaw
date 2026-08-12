import { Resend } from "resend";

export interface WelcomeEmailConfig {
  businessName: string;
  whatsappNumber?: string;
}

export async function sendWelcomeEmail(
  to: string,
  config: WelcomeEmailConfig
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);
  const whatsapp =
    config.whatsappNumber && /^\d+$/.test(config.whatsappNumber)
      ? `https://wa.me/${config.whatsappNumber}`
      : undefined;

  await resend.emails.send({
    from,
    to: [to],
    subject: `¡Bienvenido a ${config.businessName}! 🎲`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1F2937">
        <h1 style="font-size:22px;margin:0 0 12px">¡Gracias por sumarte a ${config.businessName}!</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px">
          Quedaste registrado en nuestra lista. Te avisaremos cuando lleguen novedades,
          ofertas y juegos nuevos.
        </p>
        ${whatsapp ? `<p style="font-size:15px;line-height:1.6;margin:0 0 16px">¿Tenés alguna consulta? <a href="${whatsapp}" style="color:#31D3A9">Escríbenos por WhatsApp</a>.</p>` : ""}
        <p style="font-size:13px;line-height:1.6;color:#6B7280;margin:0">
          ${config.businessName} · Si no querés recibir más mails, ignorá este mensaje.
        </p>
      </div>
    `,
  });
}
