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
    where: { email: "admin@wolfieroom.com" },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        nombre: "Admin",
        email: "admin@wolfieroom.com",
        passwordHash: hashSync(adminPassword, 10),
      },
    });
    console.log("✅ Admin user created");
  } else {
    console.log("ℹ️  Admin user already exists, skipping creation");
  }

  const existingCategories = await prisma.category.count();
  if (existingCategories === 0) {
    const estrategia = await prisma.category.create({ data: { nombre: "Estrategia", icono: "🧠", color: "#31D3A9", orden: 1 } });
    const familiar = await prisma.category.create({ data: { nombre: "Familiar", icono: "👨‍👩‍👧‍👦", color: "#FF7BAC", orden: 2 } });
    const party = await prisma.category.create({ data: { nombre: "Party", icono: "🎉", color: "#FBBF24", orden: 3 } });
    const cooperativo = await prisma.category.create({ data: { nombre: "Cooperativo", icono: "🤝", color: "#60A5FA", orden: 4 } });
    const abstracto = await prisma.category.create({ data: { nombre: "Abstracto", icono: "♟️", color: "#A78BFA", orden: 5 } });
    const dexterity = await prisma.category.create({ data: { nombre: "Dexterity", icono: "🎯", color: "#F97316", orden: 6 } });

    const games = [
      { nombre: "Catan", slug: "catan", descripcion: "Comercia y construye en la isla de Catan para convertirte en el mejor colonizador.", categoriaId: estrategia.id, jugadoresMin: 3, jugadoresMax: 4, duracion: "90 min", edad: "10+", dificultad: "Media", precioFinalVenta: "$25.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 1 },
      { nombre: "Ticket to Ride", slug: "ticket-to-ride", descripcion: "Recorre Europa construyendo rutas de tren para conectar las ciudades.", categoriaId: familiar.id, jugadoresMin: 2, jugadoresMax: 5, duracion: "60 min", edad: "8+", dificultad: "Fácil", precioFinalVenta: "$22.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 2 },
      { nombre: "Carcassonne", slug: "carcassonne", descripcion: "Coloca losetas para construir castillos, caminos y monasterios en la campiña francesa.", categoriaId: estrategia.id, jugadoresMin: 2, jugadoresMax: 5, duracion: "45 min", edad: "7+", dificultad: "Fácil", precioFinalVenta: "$18.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 3 },
      { nombre: "Dixit", slug: "dixit", descripcion: "Usa tu imaginación para describir cartas con ilustraciones oníricas.", categoriaId: party.id, jugadoresMin: 3, jugadoresMax: 8, duracion: "30 min", edad: "8+", dificultad: "Fácil", precioFinalVenta: "$19.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 4 },
      { nombre: "Codenames", slug: "codenames", descripcion: "Los espías dan pistas de una palabra para que su equipo adivine los contactos secretos.", categoriaId: party.id, jugadoresMin: 4, jugadoresMax: 8, duracion: "20 min", edad: "10+", dificultad: "Normal", precioFinalVenta: "$14.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 5 },
      { nombre: "Pandemic", slug: "pandemic", descripcion: "Trabaja en equipo para detener la propagación de cuatro enfermedades mortales.", categoriaId: cooperativo.id, jugadoresMin: 2, jugadoresMax: 4, duracion: "60 min", edad: "10+", dificultad: "Alta", precioFinalVenta: "", estado: "Consultar", destacado: true, nuevo: false, disponibleVenta: false, disponibleMesa: true, orden: 6 },
      { nombre: "Azul", slug: "azul", descripcion: "Inspírate en los mosaicos portugueses para crear patrones hermosos.", categoriaId: abstracto.id, jugadoresMin: 2, jugadoresMax: 4, duracion: "40 min", edad: "8+", dificultad: "Fácil", precioFinalVenta: "$17.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 7 },
      { nombre: "Wingspan", slug: "wingspan", descripcion: "Construye un hábitat de aves para atraer la mayor cantidad de especies.", categoriaId: estrategia.id, jugadoresMin: 1, jugadoresMax: 5, duracion: "70 min", edad: "10+", dificultad: "Media", precioFinalVenta: "$28.000", estado: "Disponible", destacado: false, nuevo: true, disponibleVenta: true, disponibleMesa: true, orden: 8 },
      { nombre: "7 Wonders", slug: "7-wonders", descripcion: "Lidera una civilización a través de las edades construyendo maravillas.", categoriaId: estrategia.id, jugadoresMin: 2, jugadoresMax: 7, duracion: "30 min", edad: "10+", dificultad: "Media", precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, disponibleMesa: true, orden: 9 },
      { nombre: "Splendor", slug: "splendor", descripcion: "Gestiona minas y comercios de gemas para ganar prestigio.", categoriaId: estrategia.id, jugadoresMin: 2, jugadoresMax: 4, duracion: "30 min", edad: "10+", dificultad: "Normal", precioFinalVenta: "$16.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 10 },
      { nombre: "King of Tokyo", slug: "king-of-tokyo", descripcion: "Sé el último monstruo en pie para dominar Tokio.", categoriaId: familiar.id, jugadoresMin: 2, jugadoresMax: 6, duracion: "30 min", edad: "8+", dificultad: "Fácil", precioFinalVenta: "$20.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 11 },
      { nombre: "Mysterium", slug: "mysterium", descripcion: "Un fantasma da pistas visuales para que los mediums resuelvan el misterio.", categoriaId: cooperativo.id, jugadoresMin: 2, jugadoresMax: 7, duracion: "45 min", edad: "10+", dificultad: "Normal", precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, disponibleMesa: true, orden: 12 },
      { nombre: "Jenga", slug: "jenga", descripcion: "Retira bloques sin derrumbar la torre. ¡Pura concentración!", categoriaId: dexterity.id, jugadoresMin: 1, jugadoresMax: 10, duracion: "20 min", edad: "6+", dificultad: "Fácil", precioFinalVenta: "$12.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 13 },
      { nombre: "Uno", slug: "uno", descripcion: "El clásico juego de cartas. ¡Sé el primero en quedarte sin cartas!", categoriaId: party.id, jugadoresMin: 2, jugadoresMax: 10, duracion: "30 min", edad: "6+", dificultad: "Fácil", precioFinalVenta: "$5.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 14 },
      { nombre: "Monopoly", slug: "monopoly", descripcion: "Compra, vende e hipoteca propiedades para ser el más rico.", categoriaId: familiar.id, jugadoresMin: 2, jugadoresMax: 8, duracion: "120 min", edad: "8+", dificultad: "Normal", precioFinalVenta: "", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: false, disponibleMesa: true, orden: 15 },
      { nombre: "Risk", slug: "risk", descripcion: "Conquista el mundo con estrategia militar y alianzas.", categoriaId: estrategia.id, jugadoresMin: 2, jugadoresMax: 6, duracion: "180 min", edad: "10+", dificultad: "Alta", precioFinalVenta: "", estado: "Consultar", destacado: false, nuevo: false, disponibleVenta: false, disponibleMesa: true, orden: 16 },
      { nombre: "Uno Flip", slug: "uno-flip", descripcion: "La versión de Uno con cartas de doble cara y reglas nuevas.", categoriaId: party.id, jugadoresMin: 2, jugadoresMax: 10, duracion: "30 min", edad: "7+", dificultad: "Fácil", precioFinalVenta: "$7.000", estado: "Disponible", destacado: false, nuevo: true, disponibleVenta: true, disponibleMesa: true, orden: 17 },
      { nombre: "Loteria", slug: "loteria", descripcion: "El tradicional juego de lotería mexicana. ¡Quién te ganá!", categoriaId: familiar.id, jugadoresMin: 2, jugadoresMax: 10, duracion: "20 min", edad: "5+", dificultad: "Fácil", precioFinalVenta: "$6.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 18 },
      { nombre: "Bananagrams", slug: "bananagrams", descripcion: "Forma palabras cruzadas en una carrera contrarreloj.", categoriaId: abstracto.id, jugadoresMin: 1, jugadoresMax: 8, duracion: "15 min", edad: "7+", dificultad: "Fácil", precioFinalVenta: "$15.000", estado: "Disponible", destacado: false, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 19 },
      { nombre: "Exploding Kittens", slug: "exploding-kittens", descripcion: "Evita los gatos explosivos con estrategia y suerte.", categoriaId: party.id, jugadoresMin: 2, jugadoresMax: 5, duracion: "15 min", edad: "7+", dificultad: "Fácil", precioFinalVenta: "$13.000", estado: "Disponible", destacado: true, nuevo: false, disponibleVenta: true, disponibleMesa: true, orden: 20 },
    ];

    for (const game of games) {
      await prisma.game.create({
        data: { ...game, categorias: { connect: { id: game.categoriaId } } },
      });
    }
    console.log("✅ Categories and games seeded");
  } else {
    console.log("ℹ️  Categories already exist, skipping game seeding");
  }

  const existingSettings = await prisma.setting.count();
  if (existingSettings === 0) {
    const settings = [
      { key: "nombreNegocio", value: "Wolfie Room" },
      { key: "telefono", value: "549XXXXXXXXXX" },
      { key: "instagram", value: "https://www.instagram.com/wolfieroom" },
      { key: "facebook", value: "" },
      { key: "direccion", value: "Patio Lorenza" },
      { key: "ciudad", value: "Mendoza, Argentina" },
      { key: "horarios", value: "Lun - Vie: 10:00 - 20:00 | Sáb: 10:00 - 14:00" },
      { key: "horarios_semana", value: '[{"dia":0,"abierto":false,"apertura":"10:00","cierre":"20:00"},{"dia":1,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":2,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":3,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":4,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":5,"abierto":true,"apertura":"10:00","cierre":"20:00"},{"dia":6,"abierto":true,"apertura":"10:00","cierre":"14:00"}]' },
      { key: "descripcionHero", value: "Jugá en nuestro espacio, reservá una mesa con tus amigos o encontrá ese juego que querés llevarte a casa." },
      { key: "tituloHero", value: "Descubrí tu próximo juego favorito" },
      { key: "textoCTA", value: "Reservá tu mesa o consultanos por cualquiera de nuestros juegos." },
      { key: "urlMaps", value: "" },
      { key: "logoUrl", value: "/images/logo.png" },
      { key: "favicon", value: "/images/ico.png" },
      { key: "iva", value: "21" },
      { key: "otrosImpuestosNacionales", value: "0" },
      { key: "activoCalculoAutomatico", value: "true" },
      { key: "mostrarPrecioSinImpuestos", value: "true" },
      { key: "ga4MeasurementId", value: "G-9HBTQN02YJ" },
      { key: "ga4Enabled", value: "true" },
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
