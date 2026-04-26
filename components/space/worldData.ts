import { DistantObject, MoonConfig, OrbitalBody } from "./types";

export const WORLD_UNITS_PER_AU = 500;
export const AU_PER_LIGHT_YEAR = 10000;

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
    radius: 500,
    size: 36,
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
    radius: 800,
    size: 54,
    color: "#d9a066",
    orbitSpeed: 0.095,
    style: "cloudy",
    info: {
      title: "Venus",
      explanation:
        "Venus may have once had oceans billions of years ago. Now it is extremely hot and dry.",
      lifeSignificance:
        "Evidence of past water on Venus shows that Earth-like conditions may not be permanent. This has led scientists to consider how many planets may have once supported life but later became hostile. It expands the idea that life could emerge in more places than we currently observe.",
      accentColor: "#f2c178",
    },
  },
  {
    id: "earth",
    name: "Earth",
    radius: 1100,
    size: 58,
    color: "#4b8df8",
    orbitSpeed: 0.08,
    style: "cloudy",
    info: {
      title: "Earth",
      explanation: "Earth is the only known planet with life.",
      lifeSignificance:
        "Water is essential to all known life on Earth, making it the foundation for how scientists define habitability. Because life and water are closely linked, scientists use the presence of water elsewhere as a key indicator of potential life. This shifts the question from whether Earth is unique to where similar conditions might exist.",
      accentColor: "#76a7ff",
    },
  },
  {
    id: "mars",
    name: "Mars",
    radius: 1500,
    size: 47,
    color: "#c45a3a",
    orbitSpeed: 0.065,
    style: "rocky",
    info: {
      title: "Mars",
      explanation: "Mars shows evidence of ancient rivers and lakes. Ice still exists at its poles.",
      lifeSignificance:
        "The discovery of ancient water on Mars suggests it may have once had conditions suitable for life. This changed scientific thinking by showing that planets can shift between habitable and uninhabitable states. As a result, scientists now consider that life could have existed elsewhere, even if it does not anymore.",
      accentColor: "#ff7d57",
    },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    radius: 2300,
    size: 106,
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
    radius: 3200,
    size: 98,
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
    radius: 4300,
    size: 74,
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
    radius: 5200,
    size: 72,
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
    radius: 6000,
    size: 34,
    color: "#ceb9a2",
    orbitSpeed: 0.018,
    style: "rocky",
    info: {
      title: "Pluto",
      explanation: "Contains frozen water ice. May have had a subsurface ocean.",
      lifeSignificance:
        "Water on Pluto shows that even distant, cold worlds can contain this essential ingredient. This challenges the idea that only warm planets can support life. Scientists now consider more extreme environments as possible habitats.",
      accentColor: "#e2d2c2",
    },
  },
];

export const moons: MoonConfig[] = [
  {
    id: "europa",
    parentId: "jupiter",
    name: "Europa",
    radius: 230,
    size: 22,
    color: "#aac4d4",
    orbitSpeed: 0.45,
    style: "ice",
    phase: 1.2,
    info: {
      title: "Europa",
      explanation:
        "Europa has a vast ocean beneath its icy surface. Water is kept warm by internal heating.",
      lifeSignificance:
        "Europa’s subsurface ocean shows that liquid water can exist far from the Sun. This challenges the idea that only Earth-like planets can support life. Scientists now consider icy moons as possible habitats.",
      accentColor: "#c6f4ff",
    },
  },
  {
    id: "callisto",
    parentId: "jupiter",
    name: "Callisto",
    radius: 330,
    size: 25,
    color: "#5f5852",
    orbitSpeed: 0.28,
    style: "rocky",
    phase: 0.4,
    info: {
      title: "Callisto",
      explanation:
        "Likely has a subsurface ocean. Less geologically active than Europa.",
      lifeSignificance:
        "The possibility of water on Callisto suggests that water may be more common than once thought. Even without strong geological activity, it may still support stable environments. This broadens what scientists consider potentially habitable.",
      accentColor: "#b9b0aa",
    },
  },
  {
    id: "enceladus",
    parentId: "saturn",
    name: "Enceladus",
    radius: 250,
    size: 20,
    color: "#c8d6e8",
    orbitSpeed: 0.34,
    style: "ice",
    phase: 2.4,
    info: {
      title: "Enceladus",
      explanation:
        "Shoots water vapor into space through geysers. Contains organic molecules.",
      lifeSignificance:
        "Enceladus provides direct evidence of water and key chemical ingredients for life. This makes it one of the strongest examples that life-supporting conditions can exist beyond Earth. It strengthens the argument that such conditions may not be rare.",
      accentColor: "#d7e7ff",
    },
  },
];

export const distantObjects: DistantObject[] = [
  {
    id: "helix-nebula",
    name: "Helix Nebula",
    position: { x: -11000, y: 4000 },
    size: 340,
    color: "#8dd6ff",
    style: "nebula",
    info: {
      title: "Helix Nebula",
      explanation: "Water molecules detected in expelled gas.",
      lifeSignificance:
        "Water in the Helix Nebula shows that it can exist even after stars die. This suggests water is not limited to stable systems. Scientists see it as a widespread component of the universe.",
      accentColor: "#73d7ff",
    },
  },
  {
    id: "orion-nebula",
    name: "Orion Nebula",
    position: { x: 9500, y: 7500 },
    size: 380,
    color: "#c9a3ff",
    style: "nebula",
    info: {
      title: "Orion Nebula",
      explanation: "Contains water vapor in star-forming regions.",
      lifeSignificance:
        "Water in the Orion Nebula shows that it forms naturally where stars and planets are created. This suggests water is common in the universe. If water is widespread, the conditions for life may also be more common.",
      accentColor: "#ea9cff",
    },
  },
  {
    id: "hat-p-11b",
    name: "HAT-P-11 b",
    position: { x: 12000, y: -3000 },
    size: 82,
    color: "#7fd3a4",
    style: "exoplanet",
    info: {
      title: "HAT-P-11 b",
      explanation: "Water vapor detected in its atmosphere.",
      lifeSignificance:
        "This discovery confirms that water exists on planets outside our solar system. It moves the search for life from theory to observation. It strengthens the idea that life-supporting conditions may exist elsewhere.",
      accentColor: "#8ef0be",
    },
  },
  {
    id: "kepler-22b",
    name: "Kepler-22 b",
    position: { x: -8000, y: -9000 },
    size: 88,
    color: "#90b6ff",
    style: "exoplanet",
    info: {
      title: "Kepler-22 b",
      explanation: "Located in the habitable zone. May have liquid water.",
      lifeSignificance:
        "Kepler-22 b is one of the first strong candidates for a potentially habitable exoplanet. Its location suggests liquid water could exist. This supports the idea that Earth-like environments may not be rare.",
      accentColor: "#9cb7ff",
    },
  },
  {
    id: "kepler-452b",
    name: "Kepler-452 b",
    position: { x: 3000, y: -13000 },
    size: 92,
    color: "#ffd38a",
    style: "exoplanet",
    info: {
      title: "Kepler-452 b",
      explanation: "Similar size and orbit to Earth. Likely in a habitable zone.",
      lifeSignificance:
        "Kepler-452 b suggests that Earth-like planets may be common. Its similarities to Earth make it a strong candidate for habitability. As more planets like this are found, the possibility of life beyond Earth becomes more likely.",
      accentColor: "#ffd48b",
    },
  },
];
