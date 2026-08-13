import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";

const dbUrl = (process.env.DATABASE_URL || `file:${path.resolve("dev.db")}`).replace(
  /^"|"$/g,
  ""
);
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@catalogoapp.com" },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        nombre: "Admin",
        email: "admin@catalogoapp.com",
        passwordHash: hashSync(adminPassword, 10),
      },
    });
    console.log("✅ Admin user created");
  } else {
    console.log("ℹ️  Admin user already exists, skipping creation");
  }

  const existingCategories = await prisma.category.count();
  if (existingCategories === 0) {
    const tecnologia = await prisma.category.create({ data: { nombre: "Tecnología", icono: "📱", color: "#31D3A9", orden: 1 } });
    const hogar = await prisma.category.create({ data: { nombre: "Hogar", icono: "🏠", color: "#FF7BAC", orden: 2 } });
    const moda = await prisma.category.create({ data: { nombre: "Moda", icono: "👕", color: "#FBBF24", orden: 3 } });
    const accesorios = await prisma.category.create({ data: { nombre: "Accesorios", icono: "🎧", color: "#60A5FA", orden: 4 } });
    const libreria = await prisma.category.create({ data: { nombre: "Librería", icono: "📚", color: "#A78BFA", orden: 5 } });
    const deportes = await prisma.category.create({ data: { nombre: "Deportes", icono: "⚽", color: "#F97316", orden: 6 } });

    const products = [
      { nombre: "Auriculares Bluetooth", slug: "auriculares-bluetooth", descripcion: "Auriculares inalámbricos con cancelación de ruido y batería de larga duración.", categoriaId: tecnologia.id, precioFinalVenta: "$45.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, orden: 1 },
      { nombre: "Smartwatch Deportivo", slug: "smartwatch-deportivo", descripcion: "Reloj inteligente con GPS, monitor de ritmo cardíaco y resistencia al agua.", categoriaId: tecnologia.id, precioFinalVenta: "$38.000", estado: "Disponible", destacado: false, nuevo: true, disponibleVenta: true, orden: 2 },
      { nombre: "Lámpara LED de Escritorio", slug: "lampara-led-escritorio", descripcion: "Lámpara regulable con luz cálida y fría, ideal para trabajar o estudiar.", categoriaId: hogar.id, precioFinalVenta: "$12.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 3 },
      { nombre: "Mochila Impermeable", slug: "mochila-impermeable", descripcion: "Mochila urbana resistente al agua con compartimento para notebook de 15 pulgadas.", categoriaId: moda.id, precioFinalVenta: "$28.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, orden: 4 },
      { nombre: "Taza Térmica", slug: "taza-termica", descripcion: "Taza aislante que mantiene tu bebida caliente hasta 6 horas.", categoriaId: hogar.id, precioFinalVenta: "$9.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 5 },
      { nombre: "Parlante Portátil", slug: "parlante-portatil", descripcion: "Parlante Bluetooth resistente al agua con sonido envolvente.", categoriaId: tecnologia.id, precioFinalVenta: "", estado: "Consultar", destacado: true, nuevo: false, disponibleVenta: false, orden: 6 },
      { nombre: "Set de Mate", slug: "set-de-mate", descripcion: "Set completo con termo, mate y bombilla de acero inoxidable.", categoriaId: hogar.id, precioFinalVenta: "$15.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 7 },
      { nombre: "Zapatillas Urbanas", slug: "zapatillas-urbanas", descripcion: "Zapatillas cómodas y versátiles para el día a día.", categoriaId: moda.id, precioFinalVenta: "$52.000", estado: "Disponible", destacado: false, nuevo: true, disponibleVenta: true, orden: 8 },
      { nombre: "Cafetera Express", slug: "cafetera-express", descripcion: "Cafetera de espresso con vaporizador de leche incorporado.", categoriaId: hogar.id, precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, orden: 9 },
      { nombre: "Cuaderno Inteligente", slug: "cuaderno-inteligente", descripcion: "Cuaderno reutilizable con aplicación para digitalizar tus notas.", categoriaId: libreria.id, precioFinalVenta: "$11.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 10 },
      { nombre: "Kit de Organizadores", slug: "kit-de-organizadores", descripcion: "Set de cajas organizadoras para mantener tu espacio ordenado.", categoriaId: hogar.id, precioFinalVenta: "$7.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 11 },
      { nombre: "Termo de Acero", slug: "termo-de-acero", descripcion: "Termo de acero inoxidable que conserva la temperatura por 12 horas.", categoriaId: hogar.id, precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, orden: 12 },
      { nombre: "Bicicleta Plegable", slug: "bicicleta-plegable", descripcion: "Bicicleta plegable ideal para la ciudad.", categoriaId: deportes.id, precioFinalVenta: "$120.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 13 },
      { nombre: "Vaso Térmico", slug: "vaso-termico", descripcion: "Vaso térmico con sorbete reutilizable para tus bebidas.", categoriaId: hogar.id, precioFinalVenta: "$8.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, orden: 14 },
      { nombre: "Gorra Clásica", slug: "gorra-clasica", descripcion: "Gorra urbana con ajuste regulable.", categoriaId: moda.id, precioFinalVenta: "", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: false, orden: 15 },
      { nombre: "Mouse Inalámbrico", slug: "mouse-inalambrico", descripcion: "Mouse ergonómico inalámbrico para mayor comodidad.", categoriaId: tecnologia.id, precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, orden: 16 },
      { nombre: "Vela Aromática", slug: "vela-aromatica", descripcion: "Vela aromática de soja con esencias naturales.", categoriaId: hogar.id, precioFinalVenta: "$6.000", estado: "Disponible", destacado: false, nuevo: true, disponibleVenta: true, orden: 17 },
      { nombre: "Campera Ligera", slug: "campera-ligera", descripcion: "Campera cortaviento y plegable para todas las estaciones.", categoriaId: moda.id, precioFinalVenta: "$35.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 18 },
      { nombre: "Agenda 2027", slug: "agenda-2027", descripcion: "Agenda anual con tapa dura y separadores de colores.", categoriaId: libreria.id, precioFinalVenta: "$10.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, orden: 19 },
      { nombre: "Soporte para Notebook", slug: "soporte-notebook", descripcion: "Soporte plegable de aluminio para mejorar la ergonomía.", categoriaId: tecnologia.id, precioFinalVenta: "$13.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, orden: 20 },
    ];

    for (const product of products) {
      await prisma.product.create({
        data: { ...product, categorias: { connect: { id: product.categoriaId } } },
      });
    }
    console.log("✅ Categories and products seeded");
  } else {
    console.log("ℹ️  Categories already exist, skipping product seeding");
  }

  const existingSettings = await prisma.setting.count();
  if (existingSettings === 0) {
    const settings = [
      { key: "nombreNegocio", value: "Catalogo App" },
      { key: "telefono", value: "549XXXXXXXXXX" },
      { key: "instagram", value: "" },
      { key: "facebook", value: "" },
      { key: "direccion", value: "" },
      { key: "ciudad", value: "" },
      { key: "horarios", value: "Lun - Vie: 10:00 - 20:00 | Sáb: 10:00 - 14:00" },
      { key: "horarios_semana", value: '[{"dia":0,"abierto":false,"apertura":"10:00","cierre":"20:00"},{"dia":1,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":2,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":3,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":4,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":5,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":6,"abierto":true,"apertura":"10:00","cierre":"14:00"}]' },
      { key: "descripcionHero", value: "Descubrí nuestro catálogo y encontrá lo que buscás para llevártelo a casa." },
      { key: "tituloHero", value: "Explorá nuestro catálogo de productos" },
      { key: "textoCTA", value: "Consultanos por cualquiera de nuestros productos." },
      { key: "urlMaps", value: "" },
      { key: "logoUrl", value: "/images/logo.png" },
      { key: "favicon", value: "/images/ico.png" },
      { key: "iva", value: "21" },
      { key: "otrosImpuestosNacionales", value: "0" },
      { key: "activoCalculoAutomatico", value: "true" },
      { key: "mostrarPrecioSinImpuestos", value: "true" },
      { key: "ga4MeasurementId", value: "" },
      { key: "ga4Enabled", value: "false" },
      { key: "ga4PropertyId", value: "" },
      { key: "ga4ServiceAccountEmail", value: "" },
      { key: "metaPixelId", value: "" },
      { key: "metaPixelEnabled", value: "false" },
      { key: "metaCapiEnabled", value: "false" },
      { key: "metaTestEventCode", value: "" },
      { key: "metaBusinessId", value: "" },
      { key: "metaCatalogId", value: "" },
      { key: "clarityProjectId", value: "" },
      { key: "clarityEnabled", value: "false" },
      { key: "cuotasHabilitadas", value: "true" },
      { key: "cuotasMax", value: "3" },
      { key: "cuotasInteresMensual", value: "0" },
      { key: "cuotasMinimoPrecio", value: "10000" },
    ];

    for (const setting of settings) {
      await prisma.setting.create({ data: setting });
    }
    console.log("✅ Settings seeded");
  } else {
    console.log("ℹ️  Settings already exist, skipping");
  }

  const cuotasDefaults: Array<{ key: string; value: string }> = [
    { key: "cuotasHabilitadas", value: "true" },
    { key: "cuotasMax", value: "3" },
    { key: "cuotasInteresMensual", value: "0" },
    { key: "cuotasMinimoPrecio", value: "10000" },
  ];
  for (const { key, value } of cuotasDefaults) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({ data: { key, value } });
      console.log(`✅ Setting ${key} seeded`);
    }
  }

  const existingPayments = await prisma.paymentMethod.count();
  if (existingPayments === 0) {
    const paymentMethods = [
      {
        titulo: "Visa",
        descripcion: "Aceptamos tarjetas Visa de débito y crédito.",
        icono: "visa",
        activo: true,
        orden: 1,
        promocional: false,
      },
      {
        titulo: "Mastercard",
        descripcion: "Aceptamos tarjetas Mastercard de débito y crédito.",
        icono: "mastercard",
        activo: true,
        orden: 2,
        promocional: false,
      },
      {
        titulo: "Mercado Pago",
        descripcion: "Pagá con tu cuenta o billetera Mercado Pago.",
        icono: "mercado_pago",
        activo: true,
        orden: 3,
        promocional: false,
      },
      {
        titulo: "Santander Río",
        descripcion: "Aceptamos tarjetas Santander Río.",
        icono: "santander",
        activo: true,
        orden: 4,
        promocional: false,
      },
      {
        titulo: "Pago contra entrega",
        descripcion: "Podés pagar al momento de recibir tu pedido.",
        icono: "truck",
        activo: true,
        orden: 5,
        promocional: false,
      },
      {
        titulo: "Efectivo contra entrega",
        descripcion: "También aceptamos efectivo contra entrega.",
        icono: "banknote",
        activo: true,
        orden: 6,
        promocional: false,
      },
      {
        titulo: "Promociones bancarias",
        descripcion: "Consultá por promociones bancarias vigentes.",
        icono: "landmark",
        activo: true,
        orden: 7,
        promocional: true,
      },
    ];

    for (const paymentMethod of paymentMethods) {
      await prisma.paymentMethod.create({ data: paymentMethod });
    }
    console.log("✅ Payment methods seeded");
  } else {
    console.log("ℹ️  Payment methods already exist, skipping");
  }

  const existingZones = await prisma.shippingZone.count();
  if (existingZones === 0) {
    const zones = [
      {
        name: "Retiro en local",
        cost: 0,
        freeFrom: 0,
        active: true,
        order: 1,
      },
      {
        name: "Envío Mendoza",
        cost: 3000,
        freeFrom: 60000,
        active: true,
        order: 2,
      },
      {
        name: "Envío Nacional",
        cost: 8000,
        freeFrom: 100000,
        consultar: true,
        active: true,
        order: 3,
      },
    ];

    for (const zone of zones) {
      await prisma.shippingZone.create({ data: zone });
    }
    console.log("✅ Shipping zones seeded");
  } else {
    console.log("ℹ️  Shipping zones already exist, skipping");
  }

  console.log("✅ Database seeded successfully!");
}

main().then(async () => { await prisma.$disconnect(); }).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
