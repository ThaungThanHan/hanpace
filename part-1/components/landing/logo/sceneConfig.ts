export const ARTBOARD_WIDTH = 1920;
export const ARTBOARD_HEIGHT = 1080;
export const FEATURED_ROW = 2;
export const FEATURED_INDEX = 3;
export const FEATURED_ROTATION = -90;
export const FEATURED_FINAL_SPEED_RATIO = 0.3;
export const FEATURED_HOVER_SPEED_RATIO = 2.5;
export const CROWD_EXIT_DURATION = 0.58;
export const CROWD_ROW_OFFSET = 0.06;
export const CROWD_CHARACTER_STAGGER = 0.018;

export const FLOATING_ASSETS = [
  {
    src: "/assets/images/leaf.svg",
    left: "5%",
    width: "clamp(130px, 14vw, 320px)",
    duration: 4.8,
    progress: 0.05,
    driftX: "10vw",
    rotation: [-12, 18],
    opacity: 0.54,
  },
  {
    src: "/assets/images/plant.svg",
    left: "17%",
    width: "clamp(150px, 16vw, 360px)",
    duration: 5.7,
    progress: 0.22,
    driftX: "-7vw",
    rotation: [7, -14],
    opacity: 0.48,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "31%",
    width: "clamp(118px, 13vw, 300px)",
    duration: 5.1,
    progress: 0.44,
    driftX: "8vw",
    rotation: [20, -12],
    opacity: 0.5,
  },
  {
    src: "/assets/images/plant.svg",
    left: "43%",
    width: "clamp(160px, 17vw, 380px)",
    duration: 6.2,
    progress: 0.66,
    driftX: "-10vw",
    rotation: [-8, 16],
    opacity: 0.44,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "56%",
    width: "clamp(126px, 14vw, 315px)",
    duration: 4.6,
    progress: 0.82,
    driftX: "7vw",
    rotation: [18, -10],
    opacity: 0.52,
  },
  {
    src: "/assets/images/plant.svg",
    left: "68%",
    width: "clamp(146px, 15vw, 350px)",
    duration: 5.4,
    progress: 0.12,
    driftX: "-8vw",
    rotation: [-6, 12],
    opacity: 0.46,
  },
  {
    src: "/assets/images/leaf.svg",
    left: "80%",
    width: "clamp(116px, 13vw, 290px)",
    duration: 5,
    progress: 0.34,
    driftX: "9vw",
    rotation: [-18, 10],
    opacity: 0.5,
  },
  {
    src: "/assets/images/plant.svg",
    left: "91%",
    width: "clamp(140px, 15vw, 340px)",
    duration: 5.9,
    progress: 0.58,
    driftX: "-6vw",
    rotation: [12, -10],
    opacity: 0.43,
  },
] as const;

export const FEATURED_TARGET = {
  x: 960,
  y: 500,
  scale: 0.35,
};

export const ARTBOARD_LOGO = {
  x: 210,
  y: 108,
  width: 420,
  height: 150,
  targetX: 1255,
  targetY: 405,
  targetScale: 2.35,
};

export const CROWD_ROWS = [
  {
    y: 350,
    count: 7,
    baseSize: 900,
    spacing: 300,
    xOffset: 50,
    speedMin: 0.93,
    speedMax: 1.07,
  },

  {
    y: 620,
    count: 7,
    baseSize: 1200,
    spacing: 330,
    xOffset: -50,
    speedMin: 0.96,
    speedMax: 1.1,
  },

  {
    y: 900,
    count: 6,
    baseSize: 1500,
    spacing: 390,
    xOffset: -150,
    speedMin: 1,
    speedMax: 1.12,
  },
] as const;
