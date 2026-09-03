export const cajaProducts = Object.freeze([
  { id: 'choripan', name: 'Choripán', category: 'Comida', price: 1500 },
  { id: 'empanada-pino', name: 'Empanada de pino', category: 'Comida', price: 2500 },
  { id: 'anticucho', name: 'Anticucho', category: 'Comida', price: 3500 },
  { id: 'bebida', name: 'Vaso de bebida', category: 'Sin alcohol', price: 1500 },
  { id: 'red-bull', name: 'Red Bull', category: 'Sin alcohol', price: 2000 },
  { id: 'piscola', name: 'Piscola', category: 'Preparados', price: 3000, bundleSize: 2, bundlePrice: 5000 },
  { id: 'terremoto', name: 'Terremoto', category: 'Preparados', price: 4000, bundleSize: 2, bundlePrice: 7000 },
  { id: 'gin-bebida', name: 'Gin con bebida', category: 'Preparados', price: 4000, bundleSize: 2, bundlePrice: 7000 },
  { id: 'gin-red-bull', name: 'Gin con Red Bull', category: 'Preparados', price: 6000, bundleSize: 2, bundlePrice: 10000 },
  { id: 'becker', name: 'Becker 354 ml', category: 'Cervezas', price: 1000 },
  { id: 'heineken', name: 'Heineken', category: 'Cervezas', price: 1200 },
  { id: 'stella', name: 'Stella Artois 354 ml', category: 'Cervezas', price: 2000 },
  { id: 'chelada', name: 'Preparación chelada', category: 'Extras', price: 1200 },
  { id: 'michelada', name: 'Preparación michelada', category: 'Extras', price: 1500 }
].map(product => Object.freeze(product)));
