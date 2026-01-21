export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  credit_cost: number;
  icon: string;
  color: string;
}

export const GAMES: Game[] = [
  {
    id: "perk-racer",
    name: "Perk Racer",
    slug: "racer",
    description: "Dodge obstacles and collect coins in this endless racing game!",
    credit_cost: 15,
    icon: "car",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "perk-jump",
    name: "Perk Jump",
    slug: "jump",
    description: "Jump across platforms Mario-style! Don't fall!",
    credit_cost: 15,
    icon: "arrow-up",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "perk-stack",
    name: "Perk Stack",
    slug: "stack",
    description: "Stack blocks perfectly to build the tallest tower!",
    credit_cost: 10,
    icon: "layers",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "perk-match",
    name: "Perk Match",
    slug: "match",
    description: "Find matching pairs before time runs out!",
    credit_cost: 10,
    icon: "grid",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "perk-pong",
    name: "Perk Pong",
    slug: "pong",
    description: "Land the ball in the cups! Beer pong champion awaits!",
    credit_cost: 12,
    icon: "target",
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "perk-snake",
    name: "Perk Snake",
    slug: "snake",
    description: "Classic snake! Eat to grow, don't hit yourself!",
    credit_cost: 8,
    icon: "move",
    color: "from-teal-500 to-green-500",
  },
];

export function getGameBySlug(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
