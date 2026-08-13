export function buildWhatsAppUrl(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export function getReservationMessage(nombreNegocio: string): string {
  return `Hola. Quisiera hacer una consulta sobre ${nombreNegocio}.`;
}

export function getProductMessage(nombreProducto: string): string {
  return `Hola. Me interesa el producto ${nombreProducto}. ¿Está disponible para comprar?`;
}

export function buildReservationUrl(telefono: string, nombreNegocio: string): string {
  return buildWhatsAppUrl(telefono, getReservationMessage(nombreNegocio));
}

export function buildProductUrl(telefono: string, nombreProducto: string): string {
  return buildWhatsAppUrl(telefono, getProductMessage(nombreProducto));
}
