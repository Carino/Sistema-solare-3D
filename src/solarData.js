// Dati astronomici reali e parametri di simulazione per il Sistema Solare

export const G_REAL = 6.67430e-11; // N m^2 / kg^2

// Valori scalati per una simulazione visiva piacevole e numericamente stabile
export const SIM_G = 1200; // Costante gravitazionale scalata per il motore di simulazione

export const CELESTIAL_BODIES = [
  {
    id: 'sun',
    name: 'Sole',
    type: 'star',
    realMassKg: 1.9885e30,
    realRadiusKm: 696340,
    rotationPeriodHours: 609.6, // ~25.4 giorni
    axialTiltDeg: 7.25,
    color: '#ffaa00',
    emissive: '#ff7700',
    visualRadius: 18,
    simMass: 8000,
    orbitDistance: 0,
    orbitalPeriodDays: 0,
    orbitalInclinationDeg: 0,
    description: 'La stella madre del nostro sistema, che racchiude il 99.86% della massa totale del sistema solare. La sua gravità tiene legati tutti i pianeti nelle loro orbite.'
  },
  {
    id: 'mercury',
    name: 'Mercurio',
    type: 'planet',
    realMassKg: 3.3011e23,
    realRadiusKm: 2439.7,
    rotationPeriodHours: 1407.6, // 58.6 giorni
    axialTiltDeg: 0.034,
    color: '#a19d94',
    visualRadius: 2.2,
    simMass: 1.3,
    orbitDistance: 38,
    orbitalPeriodDays: 87.97,
    orbitalInclinationDeg: 7.0,
    description: 'Il pianeta più vicino al Sole e il più piccolo del sistema solare. Subisce la più forte attrazione gravitazionale solare con la massima velocità di rivoluzione.'
  },
  {
    id: 'venus',
    name: 'Venere',
    type: 'planet',
    realMassKg: 4.8675e24,
    realRadiusKm: 6051.8,
    rotationPeriodHours: -5832.5, // 243 giorni retrogrado
    axialTiltDeg: 177.3,
    color: '#e3bb76',
    visualRadius: 3.8,
    simMass: 19.5,
    orbitDistance: 56,
    orbitalPeriodDays: 224.7,
    orbitalInclinationDeg: 3.39,
    description: 'Pianeta roccioso avvolto da una densa atmosfera di CO₂ con effetto serra incontrollato. Ruota su se stesso in senso orario (moto retrogrado).'
  },
  {
    id: 'earth',
    name: 'Terra',
    type: 'planet',
    realMassKg: 5.97237e24,
    realRadiusKm: 6371.0,
    rotationPeriodHours: 23.934,
    axialTiltDeg: 23.44,
    color: '#2a75d3',
    visualRadius: 4.0,
    simMass: 24.0,
    orbitDistance: 78,
    orbitalPeriodDays: 365.25,
    orbitalInclinationDeg: 0.0,
    hasAtmosphere: true,
    description: 'Il nostro pianeta, l\'unico noto ad ospitare la vita, con oceani d\'acqua liquida, atmosfera ricca d\'ossigeno e un campo magnetico protettivo.'
  },
  {
    id: 'moon',
    name: 'Luna',
    type: 'moon',
    parent: 'earth',
    realMassKg: 7.342e22,
    realRadiusKm: 1737.4,
    rotationPeriodHours: 655.7,
    axialTiltDeg: 6.68,
    color: '#cccccc',
    visualRadius: 1.2,
    simMass: 0.3,
    orbitDistance: 9.0, // relativa alla terra
    orbitalPeriodDays: 27.3,
    orbitalInclinationDeg: 5.14,
    description: 'L\'unico satellite naturale della Terra. Esercita forze mareali gravitazionali reciproche responsabili delle maree oceaniche terrestri.'
  },
  {
    id: 'mars',
    name: 'Marte',
    type: 'planet',
    realMassKg: 6.4171e23,
    realRadiusKm: 3389.5,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    color: '#c1440e',
    visualRadius: 2.8,
    simMass: 2.6,
    orbitDistance: 104,
    orbitalPeriodDays: 686.98,
    orbitalInclinationDeg: 1.85,
    description: 'Il Pianeta Rosso, ricco di ossidi di ferro sulla superficie. Ha calotte polari di ghiaccio secco e la montagna vulcanica più alta del sistema solare: Olympus Mons.'
  },
  {
    id: 'jupiter',
    name: 'Giove',
    type: 'planet',
    realMassKg: 1.8982e27,
    realRadiusKm: 69911,
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    color: '#d4a373',
    visualRadius: 10.5,
    simMass: 760,
    orbitDistance: 155,
    orbitalPeriodDays: 4332.59, // 11.86 anni
    orbitalInclinationDeg: 1.3,
    hasBands: true,
    description: 'Il gigante gassoso più massiccio del sistema solare: la sua gravità fa da scudo protettivo per i pianeti interni catturando comete e asteroidi.'
  },
  {
    id: 'saturn',
    name: 'Saturno',
    type: 'planet',
    realMassKg: 5.6834e26,
    realRadiusKm: 58232,
    rotationPeriodHours: 10.7,
    axialTiltDeg: 26.73,
    color: '#ead6a6',
    visualRadius: 8.8,
    simMass: 228,
    orbitDistance: 215,
    orbitalPeriodDays: 10759.22, // 29.45 anni
    orbitalInclinationDeg: 2.48,
    hasRings: true,
    description: 'Famoso per i suoi spettacolari anelli composti da miliardi di particelle di ghiaccio e roccia mantenute stabili dall\'equilibrio gravitazionale.'
  },
  {
    id: 'uranus',
    name: 'Urano',
    type: 'planet',
    realMassKg: 8.6810e25,
    realRadiusKm: 25362,
    rotationPeriodHours: -17.24,
    axialTiltDeg: 97.77, // ruota praticamente coricato
    color: '#70d6ff',
    visualRadius: 5.5,
    simMass: 35,
    orbitDistance: 275,
    orbitalPeriodDays: 30685.4, // 84 anni
    orbitalInclinationDeg: 0.77,
    hasRings: true,
    description: 'Gigante di ghiaccio con asse di rotazione inclinato di quasi 98 gradi: \'rotola\' sul piano orbitale durante la sua rivoluzione attorno al Sole.'
  },
  {
    id: 'neptune',
    name: 'Nettuno',
    type: 'planet',
    realMassKg: 1.02413e26,
    realRadiusKm: 24622,
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    color: '#3a86ff',
    visualRadius: 5.3,
    simMass: 41,
    orbitDistance: 335,
    orbitalPeriodDays: 60189.0, // 164.8 anni
    orbitalInclinationDeg: 1.77,
    description: 'Il pianeta più esterno del sistema solare, con venti supersonici e un intenso colore blu dovuto alla presenza di metano nell\'atmosfera.'
  },
  {
    id: 'pluto',
    name: 'Plutone',
    type: 'dwarf_planet',
    realMassKg: 1.303e22,
    realRadiusKm: 1188.3,
    rotationPeriodHours: -153.3,
    axialTiltDeg: 122.5,
    color: '#bfa588',
    visualRadius: 1.6,
    simMass: 0.05,
    orbitDistance: 395,
    orbitalPeriodDays: 90560.0, // 248 anni
    orbitalInclinationDeg: 17.16,
    description: 'Pianeta nano situato nella Fascia di Kuiper, con un\'orbita molto eccentrica e inclinata di oltre 17 gradi rispetto all\'eclittica.'
  }
];

export function formatScientific(num, decimals = 2) {
  if (num === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(num)));
  const mantissa = (num / Math.pow(10, exponent)).toFixed(decimals);
  return `${mantissa} × 10<sup>${exponent}</sup>`;
}

export function formatNumber(num, decimals = 1) {
  return num.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
