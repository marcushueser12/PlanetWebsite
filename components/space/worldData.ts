import { DistantObject, MoonConfig, OrbitalBody } from "./types";

export const WORLD_UNITS_PER_AU = 4;
export const AU_PER_LIGHT_YEAR = 63241;

export const sun = {
  id: "sun",
  name: "Sun",
  size: 10,
  color: "#f7b733",
  info: {
    title: "The Sun",
    explanation:
      "The Sun is our local star and the gravitational anchor of the solar system.",
    lifeSignificance:
      "It powers Earth's climate and photosynthesis, making nearly all known life possible.",
    accentColor: "#ffcb6b",
  },
};

export const planets: OrbitalBody[] = [
  {
    id: "mercury",
    name: "Mercury",
    radius: 18,
    size: 1.5,
    color: "#b5b5b5",
    orbitSpeed: 0.12,
    style: "rocky",
    info: {
      title: "Mercury",
      explanation: "Mercury is the smallest planet and closest to the Sun.",
      lifeSignificance:
        "Its extreme environment helps scientists test where habitability boundaries begin.",
      accentColor: "#c6c6c6",
    },
  },
  {
    id: "venus",
    name: "Venus",
    radius: 26,
    size: 2.8,
    color: "#d9a066",
    orbitSpeed: 0.095,
    style: "cloudy",
    info: {
      title: "Venus",
      explanation: "Venus has a dense atmosphere and runaway greenhouse conditions.",
      lifeSignificance:
        "It is a cautionary model for climate evolution and planetary habitability limits.",
      accentColor: "#f2c178",
    },
  },
  {
    id: "earth",
    name: "Earth",
    radius: 36,
    size: 3.1,
    color: "#4b8df8",
    orbitSpeed: 0.08,
    style: "cloudy",
    info: {
      title: "Earth",
      explanation: "Earth is the only known world with stable surface liquid water and life.",
      lifeSignificance:
        "It is the baseline for understanding biosignatures and habitable conditions elsewhere.",
      accentColor: "#76a7ff",
    },
  },
  {
    id: "mars",
    name: "Mars",
    radius: 47,
    size: 2.3,
    color: "#c45a3a",
    orbitSpeed: 0.065,
    style: "rocky",
    info: {
      title: "Mars",
      explanation: "Mars preserves signs of ancient rivers, lakes, and water-rich minerals.",
      lifeSignificance:
        "Past water on Mars suggests habitable environments can emerge beyond Earth.",
      accentColor: "#ff7d57",
    },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    radius: 67,
    size: 6.8,
    color: "#d2b08a",
    orbitSpeed: 0.045,
    style: "banded",
    info: {
      title: "Jupiter",
      explanation: "Jupiter is a giant gas planet with a powerful magnetic and gravity system.",
      lifeSignificance:
        "Its moons may hide subsurface oceans that are prime targets in the search for life.",
      accentColor: "#e5c8a7",
    },
  },
  {
    id: "saturn",
    name: "Saturn",
    radius: 91,
    size: 6.1,
    color: "#e4c88b",
    orbitSpeed: 0.036,
    style: "banded",
    info: {
      title: "Saturn",
      explanation: "Saturn is known for its rings and diverse icy moons.",
      lifeSignificance:
        "Saturn's moon Enceladus vents water-rich plumes, making it highly relevant to astrobiology.",
      accentColor: "#f2dda7",
    },
  },
  {
    id: "uranus",
    name: "Uranus",
    radius: 116,
    size: 4.5,
    color: "#8bd9dc",
    orbitSpeed: 0.028,
    style: "ice",
    info: {
      title: "Uranus",
      explanation: "Uranus is an ice giant with an unusual axial tilt.",
      lifeSignificance:
        "Ice giants broaden our understanding of planetary systems and potential ocean worlds.",
      accentColor: "#95f1eb",
    },
  },
  {
    id: "neptune",
    name: "Neptune",
    radius: 142,
    size: 4.2,
    color: "#4a7bd2",
    orbitSpeed: 0.023,
    style: "ice",
    info: {
      title: "Neptune",
      explanation: "Neptune is the outermost major planet, with intense winds and storms.",
      lifeSignificance:
        "Its system helps constrain where and how habitable moons might exist far from a star.",
      accentColor: "#79a6ff",
    },
  },
  {
    id: "pluto",
    name: "Pluto",
    radius: 172,
    size: 1.5,
    color: "#ceb9a2",
    orbitSpeed: 0.018,
    style: "rocky",
    info: {
      title: "Pluto",
      explanation: "Pluto is a distant dwarf planet in the Kuiper Belt.",
      lifeSignificance:
        "Even tiny icy worlds can host complex chemistry, expanding habitability thinking.",
      accentColor: "#e2d2c2",
    },
  },
];

export const moons: MoonConfig[] = [
  {
    id: "europa",
    parentId: "jupiter",
    name: "Europa",
    radius: 10,
    size: 1.1,
    color: "#d8dede",
    orbitSpeed: 0.45,
    style: "ice",
    phase: 1.2,
    info: {
      title: "Europa",
      explanation: "Europa likely has a salty ocean beneath its icy crust.",
      lifeSignificance:
        "Subsurface oceans with energy gradients are one of the strongest habitats for potential life.",
      accentColor: "#c6f4ff",
    },
  },
  {
    id: "callisto",
    parentId: "jupiter",
    name: "Callisto",
    radius: 14,
    size: 1.3,
    color: "#9e9891",
    orbitSpeed: 0.28,
    style: "rocky",
    phase: 0.4,
    info: {
      title: "Callisto",
      explanation: "Callisto is heavily cratered and may have a deep subsurface ocean.",
      lifeSignificance:
        "It adds evidence that ocean-bearing moons may be common in giant planet systems.",
      accentColor: "#b9b0aa",
    },
  },
  {
    id: "enceladus",
    parentId: "saturn",
    name: "Enceladus",
    radius: 11,
    size: 1,
    color: "#f5f7ff",
    orbitSpeed: 0.34,
    style: "ice",
    phase: 2.4,
    info: {
      title: "Enceladus",
      explanation: "Enceladus ejects water-rich plumes from a global subsurface ocean.",
      lifeSignificance:
        "Its plumes contain key ingredients for life, making it a top astrobiology target.",
      accentColor: "#d7e7ff",
    },
  },
];

export const distantObjects: DistantObject[] = [
  {
    id: "helix-nebula",
    name: "Helix Nebula",
    position: { x: 2100, y: -1700 },
    size: 18,
    color: "#8dd6ff",
    style: "nebula",
    info: {
      title: "Helix Nebula",
      explanation:
        "A planetary nebula formed when a dying star shed its outer layers into space.",
      lifeSignificance:
        "Nebulae enrich space with heavy elements that later become planets and life chemistry.",
      accentColor: "#73d7ff",
    },
  },
  {
    id: "orion-nebula",
    name: "Orion Nebula",
    position: { x: -2400, y: 1900 },
    size: 22,
    color: "#c9a3ff",
    style: "nebula",
    info: {
      title: "Orion Nebula",
      explanation: "A nearby stellar nursery where new stars and protoplanetary disks form.",
      lifeSignificance:
        "It reveals how the raw materials of water-rich planets can emerge early in star systems.",
      accentColor: "#ea9cff",
    },
  },
  {
    id: "hat-p-11b",
    name: "HAT-P-11 b",
    position: { x: 2900, y: 1300 },
    size: 10,
    color: "#7fd3a4",
    style: "exoplanet",
    info: {
      title: "HAT-P-11 b",
      explanation:
        "An exoplanet where atmospheric water vapor has been detected by spectroscopy.",
      lifeSignificance:
        "It demonstrates that water-bearing atmospheres exist beyond our solar system.",
      accentColor: "#8ef0be",
    },
  },
  {
    id: "kepler-22b",
    name: "Kepler-22 b",
    position: { x: -3200, y: -1600 },
    size: 12,
    color: "#90b6ff",
    style: "exoplanet",
    info: {
      title: "Kepler-22 b",
      explanation:
        "A candidate exoplanet in the habitable zone of its parent star.",
      lifeSignificance:
        "Habitable-zone worlds are key candidates when assessing where life might persist.",
      accentColor: "#9cb7ff",
    },
  },
  {
    id: "kepler-452b",
    name: "Kepler-452 b",
    position: { x: 3400, y: -2200 },
    size: 12.5,
    color: "#ffd38a",
    style: "exoplanet",
    info: {
      title: "Kepler-452 b",
      explanation: "An Earth-size candidate orbiting in a Sun-like star's habitable region.",
      lifeSignificance:
        "It is part of the evidence that Earth-like orbital conditions may not be rare.",
      accentColor: "#ffd48b",
    },
  },
];
