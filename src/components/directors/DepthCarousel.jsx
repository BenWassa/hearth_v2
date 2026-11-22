// Adapted from the React Bits DepthCarousel component (https://reactbits.dev).
// Copyright (c) 2026 David Haz. Licensed under MIT + Commons Clause v1.0:
// https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
// Used here as part of an application, as that licence permits; the component
// itself must not be sold or redistributed on its own.

import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400';
const controlClass = `grid h-11 min-w-11 place-items-center rounded-xl text-stone-400 hover:text-amber-300 ${focusRing}`;
const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const DepthCarousel = ({ items, renderItem, onOpen, initialIndex = 0 }) => {
  const [active, setActive] = useState(initialIndex);
  const cards = useRef([]);
  const position = useRef({ index: initialIndex });
  const tween = useRef(null);
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
      const distance = distanceFrom(index, position.current.index);
      const depth = Math.abs(distance);
      const opacity = Math.max(0, 1 - depth * 0.43);
      card.style.transform = `translate(-50%, -50%) translateX(${
        distance * 38
      }%) translateZ(${depth * -120}px) rotateY(${
        Math.max(-1, Math.min(1, distance)) * -18
      }deg)`;
      card.style.opacity = opacity;
      card.style.zIndex = String(100 - Math.round(depth * 20));
      card.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
    });
  };

  useLayoutEffect(() => {
    layout();
    return () => tween.current?.kill();
  }, [count]);

  useLayoutEffect(() => {
    focusTarget.current?.focus({ preventScroll: true });
    focusTarget.current = null;
  }, [active]);

  const goTo = (index, moveFocus = false) => {
    const next = wrap(index);
    const target =
      position.current.index + distanceFrom(next, position.current.index);
    tween.current?.kill();
    if (moveFocus && next !== active) focusTarget.current = cards.current[next];
    setActive(next);
    if (reducedMotion()) {
      position.current.index = next;
      layout();
      return;
    }
    tween.current = gsap.to(position.current, {
      index: target,
      duration: 0.45,
      ease: 'power3.out',
      onUpdate: layout,
      onComplete: () => {
        position.current.index = next;
        layout();
      },
    });
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
    suppressClick.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, moved: false };
  };

  const onPointerMove = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.moved) {
      if (Math.abs(dx) < 8) return;
      gesture.moved = true;
      suppressClick.current = true;
      gesture.start = position.current.index;
      gesture.step = Math.max(stage.current.clientWidth * 0.4, 44);
      tween.current?.kill();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    gesture.distance = dx / gesture.step;
    if (!reducedMotion()) {
      position.current.index = gesture.start - gesture.distance;
      layout();
    }
  };

  const onPointerEnd = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    if (!gesture.moved) return;
    const target =
      event.type === 'pointerup' && Math.abs(gesture.distance) >= 0.22
        ? Math.round(gesture.start) -
          Math.sign(gesture.distance) *
            Math.max(1, Math.round(Math.abs(gesture.distance)))
        : active;
    goTo(target, cards.current.includes(document.activeElement));
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
        <>
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
          <div
            role="group"
            aria-label="Choose a director"
            className="mx-auto grid max-w-[18rem] grid-cols-6"
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to ${label(index)}`}
                aria-current={active === index ? 'true' : undefined}
                onClick={() => goTo(index)}
                className={controlClass}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 rounded-full ${
                    active === index ? 'w-4 bg-amber-300' : 'w-2 bg-stone-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DepthCarousel;
