# Part 1: Pace Landing Experience

An animated landing page experience built with Next.js and TypeScript. It uses local images and Lottie files; no backend or API is needed. The reference website is https://nft.fluffyhugs.io/

## Setup

From the repository root:

```bash
cd part-1
pnpm install
pnpm dev
```

Open http://localhost:3000 and start viewing a flow connecting three screens: loading, hero and logo.

## Three Slides

1. **Loading intro:** A walking character and animated loading text appear while the main scene becomes ready. The intro stays visible for at least three seconds, with a ten-second fallback if the scene does not report ready.
2. **Crowd hero:** Rows of animated walking characters fill the screen, with one featured character and the Pace logo above them.
3. **Logo finale:** The crowd moves away, the featured character changes position to mimic falling, and the logo becomes the focus. Floating leaves and plants, social buttons, and a Join us button complete the scene.

The intro is a temporary screen. The hero and finale are the two sections users can move between.

## Libraries

- **Next.js, React, and TypeScript** provide the app structure, components, and typed animation code.
- **Tailwind CSS** handles layout, colors, and responsive sizes.
- **GSAP** runs the coordinated hero-to-finale timeline and the floating background motion.
- **Motion** fades between the intro and main scene and animates the loading text.
- **lottie-web** plays the walking-character JSON animation. A small React wrapper controls playback and speed.

## Animation, Navigation, and Responsiveness

This is a fixed-screen experience, not a long document with native smooth scrolling. Mouse-wheel movement, touch swipes, and the section dots initiate transisition between the hero and finale. GSAP animates the change so it feels like smooth, full-page scrolling.

The scene is laid out on a 1920 x 1080 artboard and scaled to cover the viewport. Percentage positions keep the main artwork together, while responsive CSS adjusts overlay sizes and spacing on smaller screens. The scene uses locally stored assets. When reduced motion is requested, looping motion is paused and section changes use a short fade instead of the full animated transition.

## Performance Notes

The crowd layout is generated once from a fixed seed, so character positions remain stable across renders. GSAP mainly animates transforms and opacity. Lottie uses progressive SVG loading, and crowd animations pause when the finale is active. The intro waits for the character animations to report ready before revealing the scene, with a timeout so loading cannot block indefinitely.

## Assumptions and Limits

- The three slides are treated as the intro plus two navigable visual sections; there is no fourth section or page below them.
- The social buttons and Join us button are visual placeholders. No external links or signup flow are connected.
- All image and animation assets are local to `public/assets`; the experience does not fetch content from a backend.
