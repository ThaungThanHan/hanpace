# Part 1: Pace Landing Experience

An animated landing page experience built with Next.js and TypeScript. It uses local images and Lottie files; no backend or API is needed. The reference website is https://nft.fluffyhugs.io/

## Setup

From the repository root:

```bash
pnpm install
pnpm dev:part-1
```

Open http://localhost:3000 and start viewing a flow connecting three screens: loading, hero and logo.

## Three Slides

1. **Loading intro:** A walking character and animated loading text appear while the main scene becomes ready. `app/page.tsx` sets a three-second minimum wait, followed by a fade. If the scene has not reported ready after ten seconds, the intro proceeds anyway. Navigation becomes available after the intro fades out.
2. **Crowd hero:** Rows of animated walking characters fill the screen, with one featured character and the Pace logo above them.
3. **Logo finale:** The crowd moves away, the featured character changes position to mimic falling, and the logo becomes the focus. Floating leaves and plants appear in the background. Social buttons and a Join us button are present in both the hero and finale.

The intro is a temporary screen. The hero and finale are the two sections users can move between.

## Libraries

- **Next.js, React, and TypeScript** provide the app structure, components, and typed animation code.
- **Tailwind CSS** handles layout, colors, and responsive sizes.
- **GSAP** runs the coordinated hero-to-finale timeline and the floating background motion.
- **Motion** fades between the intro and main scene and animates the loading text.
- **lottie-web** plays the walking-character JSON animation. A small React wrapper controls playback and speed.

## Animation, Navigation, and Responsiveness

This is a fixed-screen experience. Mouse-wheel movement, single-finger vertical swipes, and the section dots initiate transitions between the hero and finale. GSAP animates the section change; the page does not use native document scrolling.

Wheel input is normalized across pixel, line, and page units, and small movements accumulate until they reach the navigation threshold. Accumulation resets after inactivity, a direction change, or navigation. Touch navigation tracks one finger, requires predominantly vertical movement, and cancels on multi-touch or interruption. Further navigation requests are ignored while a transition is running.

The scene is laid out on a 1920 x 1080 artboard and scaled to cover the viewport. Percentage positions keep the main artwork together, while responsive CSS adjusts overlay sizes and spacing on smaller screens. The scene uses locally stored assets. When reduced motion is requested, looping motion is paused and new section changes use a short fade. That fade controls the outer scene without overriding individual elements' visibility.

## Performance Notes

The crowd layout is generated once from a fixed seed, so character positions remain stable across renders. GSAP mainly animates transforms and opacity. Lottie uses progressive SVG loading, and crowd animations pause when the finale is active. The intro waits until each character animation has either loaded or failed. Failed characters display a still pose from the local standing sprite sheet, so a reported failure does not hold up the scene. The timeout remains as a fallback for animations that never report an outcome.

## Assumptions and Limits

- The three slides are treated as the intro plus two navigable visual sections; there is no fourth section or page below them.
- The social buttons and Join us button are visual placeholders. No external links or signup flow are connected.
- All image and animation assets are local to `public/assets`; the experience does not fetch content from a backend.

## Scene Structure

The landing scene is assembled in `components/landing/LogoSection.tsx`. Its implementation lives in `components/landing/logo/`:

- `sceneConfig.ts` and `crowd.ts` hold layout settings and deterministic character generation.
- `SceneArtwork.tsx`, `VisualStage.tsx`, `FloatingBackground.tsx`, and `ResponsiveOverlay.tsx` render the artwork, crowd, decorations, and controls.
- `useCrowdPlayback.ts` manages crowd playback and tracks successful or failed animation loads.
- `useSceneAnimation.ts` owns scene transitions, reduced-motion fades, and GSAP cleanup.

## Lottie Playback

`LottieAnimation` uses a small playback controller in `components/animation/lottiePlayback.ts`.

- `autoplay`, `loop`, and `speed` respond to prop changes. Changing `autoplay` overrides the latest imperative `play()` or `pause()` request; unrelated prop changes preserve that request. A changed `speed` prop similarly overrides `setSpeed()`.
- `delay` is measured in seconds from instance creation. Changing it before first playback restarts the wait from that update; changing it after playback starts has no effect. Imperative `play()` also respects this initial delay and waits for readiness.
- `startOffset` is measured in seconds. Changing it seeks to a frame within the animation without changing play/pause intent.
- Reduced motion pauses playback at the current frame. Turning it off resumes only when playback is still requested.
- `onReady` fires once per successfully initialized instance. Optional `onError(error)` reports initialization, loading, or rendering failure once per instance. Changing the resolved animation path creates a new instance and preserves imperative playback and speed overrides unless the corresponding props also change.

## Checks

Run lint and TypeScript checks from the repository root:

```bash
pnpm --filter part-1 lint
pnpm --filter part-1 typecheck
```

No automated test files or test script are currently included for part-1.
