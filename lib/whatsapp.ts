export function buildWhatsAppUrl(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export function getReservationMessage(nombreNegocio: string): string {
  return `Hola. Quisiera consultar para reservar una mesa en ${nombreNegocio}.`;
}

export function getGameMessage(nombreJuego: string): string {
  return `Hola. Me interesa el juego ${nombreJuego}. ¿Está disponible para jugar o comprar? También quisiera consultar por una reserva.`;
}

export function buildReservationUrl(telefono: string, nombreNegocio: string): string {
  return buildWhatsAppUrl(telefono, getReservationMessage(nombreNegocio));
}

export function buildGameUrl(telefono: string, nombreJuego: string): string {
  return buildWhatsAppUrl(telefono, getGameMessage(nombreJuego));
}
