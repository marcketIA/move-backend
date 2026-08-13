// utils/terms.js — el texto legal versionado que se le muestra al
// comprador antes de pagar. Se guarda completo (no solo un link) junto
// con su hash, exactamente como recomienda Stripe para evidencia de
// disputas: el comprador debe poder leerlo TODO antes de aceptar, no
// solo marcar una casilla con un enlace que nadie abre.

export const TERMS_VERSION = '2026-08-08-v1';

export const TERMS_AUTHORIZATION = {
  type: 'PURCHASE_AUTHORIZATION',
  title: 'Autorización de compra',
  text: `Confirmo que revisé el resumen de esta compra y autorizo expresamente el cargo mostrado. Confirmo que la información proporcionada es correcta y que tengo autorización para usar el método de pago seleccionado.`
};

export const TERMS_DIGITAL_ACCESS = {
  type: 'DIGITAL_ACCESS_NO_REFUND_POLICY',
  title: 'Entrega digital inmediata y política de reembolso',
  text: `Entiendo que estoy adquiriendo acceso a contenido educativo digital (plantillas, videos, clases en vivo y grabaciones) que se entrega y queda disponible de forma inmediata apenas se confirma el pago.

Solicito expresamente que la entrega de este contenido digital comience de inmediato, sin esperar ningún plazo adicional.

Entiendo y acepto que, por tratarse de contenido digital de propiedad intelectual que queda disponible al instante, esta compra no es reembolsable una vez confirmado el pago y concedido el acceso — de la misma forma en que operan Netflix, Udemy y otras plataformas de contenido digital, sin perjuicio de los derechos que no puedan excluirse o limitarse legalmente en mi jurisdicción.

Confirmo que ya asistí al programa base de 2 días antes de esta compra, que tuve oportunidad de conocer la metodología, el equipo y el formato del contenido, y que decido avanzar a este nivel con esa información completa.

He tenido oportunidad de revisar esta política completa antes de completar el pago.`
};
