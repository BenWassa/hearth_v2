// Adapted from the React Bits DepthCarousel component (https://reactbits.dev).
// Copyright (c) 2026 David Haz. Licensed under MIT + Commons Clause v1.0:
// https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
// Used here as part of an application, as that licence permits; the component
// itself must not be sold or redistributed on its own.

import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400';
const controlClass = `grid h-11 min-w-11 place-items-center rounded-xl text-stone-400 hover:text-amber-300 ${focusRing}`;
const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Exponential settle: a flick keeps its release speed and decays smoothly onto
// a director. Larger constant = longer glide.
const GLIDE_MS = 325;
const STEP_MS = 140;

const DepthCarousel = ({ items, renderItem, onOpen, initialIndex = 0 }) => {
  const [active, setActive] = useState(initialIndex);
  const cards = useRef([]);
  // Continuous, unwrapped position; whole numbers are directors.
  const position = useRef(initialIndex);
  const frame = useRef(0);
  const stage = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const focusTarget = useRef(null);
  const count = items.length;
  const wrap = (index) => ((index % count) + count) % count;
  const distanceFrom = (index, current) =>
    wrap(index - current + count / 2) - count / 2;
  const label = (index) => `${items[index].name}, ${index + 1} of ${count}`;

  const layout = () => {
    cards.current.forEach((card, index) => {
      if (!card) return;
      const distance = distanceFrom(index, position.current);
      const depth = Math.abs(distance);
      // Near cards stay solid and dim with depth, so names never show through
      // the card in front mid-spin; only cards beyond the neighbours fade out.
      const opacity = depth <= 1 ? 1 : Math.max(0, 1 - (depth - 1) * 0.75);
      card.style.transform = `translate(-50%, -50%) translateX(${
        distance * 38
      }%) translateZ(${depth * -120}px) rotateY(${
        Math.max(-1, Math.min(1, distance)) * -18
      }deg)`;
      card.style.opacity = opacity;
      card.style.filter =
        depth < 0.01 ? '' : `brightness(${1 - Math.min(depth, 1.5) * 0.4})`;
      card.style.zIndex = String(100 - Math.round(depth * 20));
      card.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
    });
  };

  const stop = () => {
    if (!frame.current) return false;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    return true;
  };

  const settle = (target, timeConstant) => {
    stop();
    const finish = () => {
      position.current = target;
      layout();
    };
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
      finish();
      return;
    }
    const amplitude = target - position.current;
    const started = performance.now();
    const tick = (now) => {
      const remaining =
        amplitude * Math.exp(-Math.max(0, now - started) / timeConstant);
      if (Math.abs(remaining) < 0.002) {
        frame.current = 0;
        finish();
        return;
      }
      position.current = target - remaining;
      layout();
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useLayoutEffect(() => {
    layout();
    return () => stop();
  }, [count]);

  useLayoutEffect(() => {
    focusTarget.current?.focus({ preventScroll: true });
    focusTarget.current = null;
  }, [active]);

  const goTo = (index, moveFocus = false) => {
    const next = wrap(index);
    if (moveFocus && next !== active) focusTarget.current = cards.current[next];
    setActive(next);
    settle(position.current + distanceFrom(next, position.current), STEP_MS);
  };

  const onKeyDown = (event) => {
    const targets = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: count - 1,
    };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    goTo(targets[event.key], cards.current.includes(event.target));
  };

  const onPointerDown = (event) => {
    if (count < 2 || event.button !== 0 || !event.isPrimary) return;
    // Touching a spinning carousel catches it, like a real wheel.
    const caught = stop();
    suppressClick.current = caught;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      moved: false,
      caught,
      start: position.current,
      samples: [{ t: event.timeStamp, x: event.clientX }],
    };
  };

  const onPointerMove = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.moved) {
      if (Math.abs(dx) < 8) return;
      gesture.moved = true;
      suppressClick.current = true;
      gesture.step = Math.max(stage.current.clientWidth * 0.4, 44);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    gesture.samples.push({ t: event.timeStamp, x: event.clientX });
    if (gesture.samples.length > 6) gesture.samples.shift();
    gesture.distance = dx / gesture.step;
    if (!reducedMotion()) {
      position.current = gesture.start - gesture.distance;
      layout();
    }
  };

  const onPointerEnd = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    if (!gesture.moved) {
      if (gesture.caught) {
        const nearest = Math.round(position.current);
        setActive(wrap(nearest));
        settle(nearest, STEP_MS);
      }
      return;
    }
    const current = gesture.start - gesture.distance;
    let target = Math.round(current);
    if (event.type === 'pointerup') {
      // Release speed in directors per millisecond, from the last ~100ms.
      const recent = gesture.samples.filter(
        (sample) => event.timeStamp - sample.t <= 100,
      );
      const first = recent[0];
      const last = recent[recent.length - 1];
      const velocity =
        first && last && last.t > first.t
          ? -(last.x - first.x) / gesture.step / (last.t - first.t)
          : 0;
      const glide = Math.max(-count, Math.min(count, velocity * GLIDE_MS));
      target = Math.round(current + glide);
      // A short deliberate drag still moves one director.
      if (
        Math.round(target) === Math.round(gesture.start) &&
        Math.abs(gesture.distance) >= 0.22
      )
        target = Math.round(gesture.start) - Math.sign(gesture.distance);
    } else {
      target = Math.round(gesture.start);
    }
    if (cards.current.includes(document.activeElement))
      focusTarget.current = cards.current[wrap(target)];
    setActive(wrap(target));
    position.current = current;
    settle(target, GLIDE_MS);
  };

  if (!count) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Director directory"
      onKeyDown={onKeyDown}
    >
      <div
        ref={stage}
        className="relative isolate h-64 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
      >
        <div className="absolute inset-0 [perspective:800px]">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                cards.current[index] = element;
              }}
              type="button"
              data-director-card={item.id}
              aria-label={label(index)}
              aria-hidden={index !== active}
              tabIndex={index === active ? 0 : -1}
              onClick={(event) => {
                if (event.detail && suppressClick.current) return;
                if (index === active) onOpen(item, event.currentTarget);
                else goTo(index, true);
              }}
              className={`absolute left-1/2 top-1/2 h-[calc(100%-1rem)] w-[69%] max-w-64 overflow-hidden rounded-xl border border-stone-800 bg-stone-900 text-left shadow-xl ${focusRing}`}
            >
              {renderItem(item, index)}
            </button>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-4">
          <button
            type="button"
            aria-label={`Previous director: ${label(wrap(active - 1))}`}
            onClick={() => goTo(active - 1)}
            className={controlClass}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Next director: ${label(wrap(active + 1))}`}
            onClick={() => goTo(active + 1)}
            className={controlClass}
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DepthCarousel;
