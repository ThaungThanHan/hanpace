import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT, CROWD_ROWS, FEATURED_ROW, FEATURED_INDEX } from "./sceneConfig";

export type CrowdItem = {
  id: string;
  rowIndex: number;
  x: number;
  y: number;
  size: number;
  z: number;
  startOffset: number;
  speed: number;
};

type GeneratedCrowd = {
  crowd: CrowdItem[];
  featuredSlot: CrowdItem;
};

export type LottieLoadStatus = "ready" | "error";

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function generateCrowd({
  seed = 12345,
  rows = CROWD_ROWS,
}: {
  seed?: number;
  rows?: ReadonlyArray<(typeof CROWD_ROWS)[number]>;
} = {}): GeneratedCrowd {
  const random = mulberry32(seed);
  const crowd: CrowdItem[] = [];
  let featuredSlot: CrowdItem | undefined;

  rows.forEach((row, rowIndex) => {
    const totalWidth = (row.count - 1) * row.spacing;
    const startX = ARTBOARD_WIDTH / 2 - totalWidth / 2 + row.xOffset;

    for (let i = 0; i < row.count; i += 1) {
      const x = startX + i * row.spacing;
      const y = row.y;
      const size = row.baseSize * (0.95 + random() * 0.1);
      const clampedX = clamp(x, 40, ARTBOARD_WIDTH - 40);
      const clampedY = clamp(y, 40, ARTBOARD_HEIGHT - 40);
      const item = {
        id: `character-${rowIndex}-${i}`,
        rowIndex,
        x: clampedX,
        y: clampedY,
        size,
        z: Math.round(y),
        startOffset: random(),
        speed: row.speedMin + random() * (row.speedMax - row.speedMin),
      };

      if (rowIndex === FEATURED_ROW && i === FEATURED_INDEX) {
        featuredSlot = {
          ...item,
          id: "featured-character",
        };
        continue;
      }

      crowd.push(item);
    }
  });

  if (!featuredSlot) {
    throw new Error("Featured crowd slot was not generated.");
  }

  return {
    crowd,
    featuredSlot,
  };
}
