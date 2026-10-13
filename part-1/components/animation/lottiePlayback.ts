import type { AnimationItem } from "lottie-web";

export type PlaybackOptions = {
  autoplay: boolean;
  loop: boolean;
  speed: number;
  delay: number;
  startOffset: number;
};

type Animation = Pick<AnimationItem,
  "play" | "pause" | "setLoop" | "setSpeed" | "goToAndStop" | "frameRate" | "totalFrames"
>;

/** Owns playback intent; readiness, the initial delay, and reduced motion gate it. */
export function createLottiePlayback(
  animation: Animation,
  initialOptions: PlaybackOptions,
  initialReducedMotion: boolean,
) {
  let options = initialOptions;
  let wantsToPlay = options.autoplay;
  let reducedMotion = initialReducedMotion;
  let ready = false;
  let started = false;
  let failed = false;
  let disposed = false;
  let delayElapsed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clearDelay() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function syncPlayback() {
    if (disposed || failed) return;
    if (ready && wantsToPlay && delayElapsed && !reducedMotion) {
      started = true;
      animation.play();
    } else {
      animation.pause();
    }
  }

  function scheduleDelay() {
    clearDelay();
    const seconds = Number.isFinite(options.delay) ? Math.max(0, options.delay) : 0;
    delayElapsed = seconds === 0;
    if (!delayElapsed) {
      timer = setTimeout(() => {
        timer = undefined;
        delayElapsed = true;
        syncPlayback();
      }, seconds * 1000);
    }
  }

  function seekToStart() {
    const seconds = Number.isFinite(options.startOffset) ? Math.max(0, options.startOffset) : 0;
    const frame = seconds * (animation.frameRate || 60);
    animation.goToAndStop(Math.min(frame, Math.max(0, animation.totalFrames - 1)), true);
  }

  animation.setLoop(options.loop);
  animation.setSpeed(options.speed);
  scheduleDelay();

  return {
    ready() {
      if (disposed || failed || ready) return false;
      ready = true;
      seekToStart();
      syncPlayback();
      return true;
    },
    play() {
      wantsToPlay = true;
      syncPlayback();
    },
    pause() {
      wantsToPlay = false;
      syncPlayback();
    },
    setSpeed(speed: number) {
      if (!disposed && !failed) animation.setSpeed(speed);
    },
    update(nextOptions: PlaybackOptions) {
      if (disposed || failed) return;
      const previous = options;
      options = nextOptions;
      if (options.autoplay !== previous.autoplay) wantsToPlay = options.autoplay;
      if (options.loop !== previous.loop) animation.setLoop(options.loop);
      if (options.speed !== previous.speed) animation.setSpeed(options.speed);
      if (options.delay !== previous.delay && !started) scheduleDelay();
      if (options.startOffset !== previous.startOffset && ready) seekToStart();
      syncPlayback();
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value;
      syncPlayback();
    },
    fail() {
      if (disposed || failed) return false;
      failed = true;
      clearDelay();
      animation.pause();
      return true;
    },
    dispose() {
      disposed = true;
      clearDelay();
    },
  };
}
