// Director directory carousel. Dragging, flinging, looping and snapping come
// from Embla Carousel (MIT, https://www.embla-carousel.com). The depth styling
// is adapted from the React Bits DepthCarousel component (https://reactbits.dev),
// Copyright (c) 2026 David Haz, MIT + Commons Clause v1.0:
// https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import useEmblaCarousel from 'embla-carousel-react';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400';
const reducedMotion = () =>
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Distance of every slide from the centre, in slides, including the copies
// Embla shifts around when looping. Follows the Embla tween examples.
const slideDistances = (api) => {
  const engine = api.internalEngine();
  const progress = api.scrollProgress();
  const snaps = api.scrollSnapList();
  const distances = [];
  snaps.forEach((snap, snapIndex) => {
    engine.slideRegistry[snapIndex].forEach((slideIndex) => {
      let diff = snap - progress;
      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (slideIndex === loopItem.index && target !== 0) {
            diff =
              Math.sign(target) === -1
                ? snap - (1 + progress)
                : snap + (1 - progress);
          }
        });
      }
      distances[slideIndex] = diff * snaps.length;
    });
  });
  return distances;
};

const DepthCarousel = ({ items, renderItem, onOpen, initialIndex = 0 }) => {
  const [reduced] = useState(reducedMotion);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: items.length > 2,
    align: 'center',
    startIndex: initialIndex,
    // A fling carries on past several directors before settling on one.
    skipSnaps: !reduced,
    duration: reduced ? 10 : 28,
  });
  const [active, setActive] = useState(initialIndex);
  const cards = useRef([]);
  const moveFocus = useRef(false);
  // True while the wheel is moving; a touch then only catches it.
  const moving = useRef(false);
  const caught = useRef(false);
  const count = items.length;
  const label = (index) => `${items[index].name}, ${index + 1} of ${count}`;

  const paint = useCallback((api) => {
    const distances = slideDistances(api);
    cards.current.forEach((card, index) => {
      if (!card) return;
      const distance = distances[index] ?? 0;
      const depth = Math.min(Math.abs(distance), 2);
      card.style.transform = `perspective(800px) rotateY(${
        clamp(distance, -1, 1) * -22
      }deg) scale(${1 - depth * 0.14})`;
      card.style.filter =
        depth < 0.01 ? '' : `brightness(${1 - Math.min(depth, 1.5) * 0.4})`;
      card.style.opacity = depth <= 1 ? '1' : String(1 - (depth - 1) * 0.8);
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return undefined;
    const onSelect = () => {
      // Keep keyboard focus on the front card when a swipe changes it.
      if (cards.current.includes(document.activeElement))
        moveFocus.current = true;
      setActive(emblaApi.selectedScrollSnap());
    };
    const onPaint = () => paint(emblaApi);
    const onReInit = () => {
      moving.current = false;
      setActive(emblaApi.selectedScrollSnap());
      onPaint();
    };
    const onScroll = () => {
      moving.current = true;
      paint(emblaApi);
    };
    const onSettle = () => {
      moving.current = false;
    };
    const onPointerDown = () => {
      caught.current = moving.current;
    };
    paint(emblaApi);
    onSelect();
    emblaApi
      .on('select', onSelect)
      .on('scroll', onScroll)
      .on('reInit', onReInit)
      .on('slideFocus', onPaint)
      .on('settle', onSettle)
      .on('pointerDown', onPointerDown);
    return () => {
      emblaApi
        .off('select', onSelect)
        .off('scroll', onScroll)
        .off('reInit', onReInit)
        .off('slideFocus', onPaint)
        .off('settle', onSettle)
        .off('pointerDown', onPointerDown);
    };
  }, [emblaApi, paint]);

  useLayoutEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    cards.current[active]?.focus({ preventScroll: true });
  }, [active]);

  const goTo = (index, focus = false) => {
    if (!emblaApi) return;
    const next = ((index % count) + count) % count;
    if (next === active) {
      if (focus) cards.current[next]?.focus({ preventScroll: true });
      return;
    }
    moveFocus.current = focus;
    emblaApi.scrollTo(next, reduced);
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

  if (!count) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Director directory"
      onKeyDown={onKeyDown}
      className="flex min-h-0 flex-1 flex-col gap-2 [@media(min-height:721px)]:pt-2"
    >
      <div
        ref={emblaRef}
        className="-mx-4 min-h-[22rem] flex-1 cursor-grab select-none overflow-hidden active:cursor-grabbing [container-type:size]"
      >
        <div className="flex h-full touch-pan-y">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0 grow-0 basis-[min(72%,82cqh)]"
            >
              <button
                ref={(element) => {
                  cards.current[index] = element;
                }}
                type="button"
                data-director-card={item.id}
                aria-label={label(index)}
                aria-hidden={index !== active}
                tabIndex={index === active ? 0 : -1}
                onClick={(event) => {
                  // Embla swallows the click that ends a drag; a tap on a
                  // moving wheel only stops it.
                  if (caught.current) {
                    caught.current = false;
                    return;
                  }
                  if (index === active) onOpen(item, event.currentTarget);
                  else goTo(index, true);
                }}
                className={`relative block h-full w-full overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 text-left shadow-xl will-change-transform ${focusRing}`}
              >
                {renderItem(item, index)}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p
        aria-hidden="true"
        className="shrink-0 pb-3 text-center text-xs tabular-nums tracking-widest text-stone-400"
      >
        {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </p>
    </div>
  );
};

export default DepthCarousel;
