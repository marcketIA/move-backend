// utils/whatsapp.js — mandar avisos por WhatsApp usando Twilio.
// Solo se usa para avisos internos tuyos (a ti/Kimy), nunca para mandarle
// nada a los alumnos — no hay ninguna lista de números de alumnos guardada
// acá, solo el número fijo que pusiste en TWILIO_WHATSAPP_TO.

import twilio from 'twilio';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw Object.assign(new Error('Twilio no está configurado.'), { code: 'TWILIO_NOT_CONFIGURED' });
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendWhatsappAlert(text) {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TO;
  if (!from || !to) {
    throw Object.assign(new Error('Falta TWILIO_WHATSAPP_FROM o TWILIO_WHATSAPP_TO.'), { code: 'TWILIO_NOT_CONFIGURED' });
  }
  const twilioClient = getClient();
  await twilioClient.messages.create({ from, to, body: text });
}
