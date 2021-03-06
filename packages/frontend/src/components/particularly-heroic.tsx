import React, { useEffect, useRef } from 'react';
import { useElementSize } from '../hooks/use-element-size';
import { AnimationFrameLoop, IAnimatedObject } from './animation-frame-loop';

export const BASE_HUE_DEFAULT = 250;
export const BASE_HUE_BLOG = 190;

export interface ParticularlyHeroicProps {
  /** Base hue value (HSL) */
  readonly baseHue?: number;
}

export const ParticularlyHeroic: React.FC<ParticularlyHeroicProps> = (
  props,
) => {
  const baseHue = props.baseHue ?? BASE_HUE_DEFAULT;
  const containerRef = useRef<HTMLDivElement>();
  const backgroundCanvasRef = useRef<HTMLCanvasElement>();
  const animationCanvasRef = useRef<HTMLCanvasElement>();
  const containerDimensions = useElementSize(containerRef);

  useEffect(() => {
    const { width, height } = containerDimensions;

    // We need to know the width/height before we create an animation.
    if (!width || !height) return;

    for (const canvas of [
      backgroundCanvasRef.current,
      animationCanvasRef.current,
    ]) {
      canvas.width = width;
      canvas.height = height;
    }

    const animationFrameLoop = new AnimationFrameLoop({
      animatedObject: new CirclesAnimation({
        baseHue,
        backgroundImage: backgroundCanvasRef.current,
        canvas: animationCanvasRef.current,
        worldWidth: width,
        worldHeight: height,
      }),
    });

    return () => animationFrameLoop.stop();
  }, [containerDimensions, backgroundCanvasRef, animationCanvasRef]);

  return (
    <section ref={containerRef} className="hero-container">
      <canvas ref={backgroundCanvasRef} className="background-canvas" />
      <canvas ref={animationCanvasRef} className="animation-canvas" />

      <div className="hero-contents">{props.children}</div>

      <style jsx>{`
        .hero-container {
          position: relative;
          background: black;
          width: 100%;
        }

        .hero-contents {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 10;
          display: flex;
          justify-content: center;
        }

        .background-canvas {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
        }

        .animation-canvas {
          position: absolute;
          top: 0;
          left: 0;
          background: #000;
        }
      `}</style>
    </section>
  );
};

export interface IDrawableObject extends IAnimatedObject {
  draw(context: CanvasRenderingContext2D);
}

export interface CirclesAnimationOptions {
  /** The base hue for the background image */
  readonly baseHue: number;
  /** Background image for the animation */
  readonly backgroundImage: HTMLCanvasElement;
  /** Canvas for drawing the animation */
  readonly canvas: HTMLCanvasElement;
  /** Width of the canvas / world */
  readonly worldWidth: number;
  /** Height of the canvas / world */
  readonly worldHeight: number;
}

/** Animate some nice-looking circles by tracking particles */
export class CirclesAnimation implements IAnimatedObject {
  private readonly baseHue: number;
  private readonly backgroundImage: HTMLCanvasElement;
  /** Whether the background image has been drawn */
  private backgroundImageDrawn = false;

  /** Rendering context for the animated canvas */
  private readonly context: CanvasRenderingContext2D;
  private readonly sprites: CircleSprite[] = [];

  /** Dimensions of the world */
  public readonly worldWidth: number;
  public readonly worldHeight: number;

  constructor(options: CirclesAnimationOptions) {
    this.baseHue = options.baseHue;
    this.backgroundImage = options.backgroundImage;
    this.context = options.canvas.getContext('2d');

    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;

    console.log(`Animating ${this.worldWidth} x ${this.worldHeight}`);

    const sizeBase = this.worldWidth + this.worldHeight;
    for (let i = 0; i < sizeBase * 0.03; i++) {
      const sprite = new CircleSprite(this, {
        radius: rand(1, sizeBase * 0.03),
        x: rand(0, this.worldWidth),
        y: rand(0, this.worldHeight),
        angle: rand(0, FULL_CIRCLE),
        speed: rand(0.01, 0.03),
        tick: rand(0, 10000),
      });

      this.sprites.push(sprite);
    }
  }

  public update(deltaTime: number) {
    if (!this.backgroundImageDrawn) {
      // Draw this only once.
      drawBackgroundCanvas({
        canvas: this.backgroundImage,
        width: this.worldWidth,
        height: this.worldHeight,
        baseHue: this.baseHue,
      });
      this.backgroundImageDrawn = true;
    }

    const ctx = this.context;
    ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.drawImage(this.backgroundImage, 0, 0);

    // Optimize the context changes by setting context state here
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';

    for (const sprite of this.sprites) {
      sprite.update(deltaTime);
      sprite.draw(ctx);
    }
  }
}

export interface CircleSpriteState {
  radius: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  tick: number;
}

class CircleSprite implements IDrawableObject {
  /** Base line alpha - expect flickering above and below this value. */
  private readonly baseLineAlpha = 0.075;
  /** Extremes of the flicker*/
  private readonly flickerRange = 0.05;
  /** How fast to flicker */
  private readonly flickerRate = 0.0015;

  constructor(
    private readonly world: CirclesAnimation,
    private readonly state: CircleSpriteState,
  ) {
    // Remember: You don't want (baselineAlpha + flickerRange) > 1, nor
    // (baselineAlpha - flickerRange) < 0. Otherwise, you'll clip.
    this.flickerRate = 0.0015;
    this.flickerRange = 0.05;
    this.baseLineAlpha = 0.075;
  }

  update(deltaTime: number) {
    const state = this.state;

    // Movement at an angle at a velocity
    state.x += Math.cos(state.angle) * state.speed * deltaTime;
    state.y += Math.sin(state.angle) * state.speed * deltaTime;
    // Allow the circles to drift out-of-angle randomly
    state.angle += rand(-0.05, 0.05);

    // Teleport to the other side when out of bounds.

    // Out of bounds right
    if (state.x - state.radius > this.world.worldWidth) state.x = -state.radius;
    // Out of bounds left
    if (state.x + state.radius < 0)
      state.x = this.world.worldWidth + state.radius;
    // Out of bounds bottom
    if (state.y - state.radius > this.world.worldHeight)
      state.y = -state.radius;
    // Out of bounds top
    if (state.y + state.radius < 0)
      state.y = this.world.worldHeight + state.radius;

    // Increase the tick by the time since the last update.
    state.tick = state.tick + deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const state = this.state;

    // How fast to flicker
    const flickerRate = this.flickerRate;
    // Extremes of the flicker
    const flickerRange = this.flickerRange;
    // Baseline of flicker. Expect flickering above and below this value.
    const flickerBaseLine = this.baseLineAlpha;

    const fillAlpha =
      flickerBaseLine + Math.cos(state.tick * flickerRate) * flickerRange;

    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, FULL_CIRCLE);
    ctx.fillStyle = `hsla(0,0%,100%,${fillAlpha})`; // Minimized concatenation
    ctx.fill();
  }
}

interface DrawBackgroundCanvasOptions {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly baseHue: number;
}

function drawBackgroundCanvas(options: DrawBackgroundCanvasOptions) {
  const ctx = options.canvas.getContext('2d');

  const sizeBase = options.width + options.height;
  const count = Math.floor(sizeBase * 0.3);

  const opt = {
    radiusMin: 1,
    radiusMax: sizeBase * 0.04,
    blurMin: 10,
    blurMax: sizeBase * 0.04,
    hueMin: options.baseHue,
    hueMax: options.baseHue + 100,
    saturationMin: 10,
    saturationMax: 70,
    lightnessMin: 20,
    lightnessMax: 50,
    alphaMin: 0.1,
    alphaMax: 0.5,
  };

  ctx.clearRect(0, 0, options.width, options.height);
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < count; i++) {
    const radius = rand(opt.radiusMin, opt.radiusMax);
    const blur = rand(opt.blurMin, opt.blurMax);
    const x = rand(0, options.width);
    const y = rand(0, options.height);
    const hue = rand(opt.hueMin, opt.hueMax);
    const saturation = rand(opt.saturationMin, opt.saturationMax);
    const lightness = rand(opt.lightnessMin, opt.lightnessMax);
    const alpha = rand(opt.alphaMin, opt.alphaMax);

    ctx.shadowColor = hsla(hue, saturation, lightness, alpha);
    ctx.shadowBlur = blur;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, FULL_CIRCLE);
    ctx.closePath();
    ctx.fill();
  }
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h},${s}%,${l}%,${a})`;
}

const FULL_CIRCLE = Math.PI * 2;

export const NiceTranslucentBox: React.FC = (props) => (
  <div className="nice-translucent-box">
    <div className="nice-translucent-box-inner">{props.children}</div>

    <style jsx>{`
      .nice-translucent-box {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 2rem;
      }

      .nice-translucent-box-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        width: 100%;
        padding: 2rem;
      }

      @media screen and (min-width: 600px) {
        .nice-translucent-box {
          max-width: 600px;
        }
      }
    `}</style>
  </div>
);
