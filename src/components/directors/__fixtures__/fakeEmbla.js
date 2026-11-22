// Test stand-in for embla-carousel-react: jsdom has no layout, so the real
// library cannot measure slides. Dragging and flinging are Embla's job and are
// checked in a real browser; this covers Hearth's wiring around it.
import { useRef, useState } from 'react';

export const emblaCalls = { options: [], scrollTo: [], apis: [] };
export const lastApi = () => emblaCalls.apis.at(-1);

const createApi = (options, count) => {
  const listeners = {};
  let selected = options.startIndex || 0;
  const api = {
    on(event, fn) {
      (listeners[event] ||= new Set()).add(fn);
      return api;
    },
    off(event, fn) {
      listeners[event]?.delete(fn);
      return api;
    },
    emit(event) {
      listeners[event]?.forEach((fn) => fn(api, event));
    },
    selectedScrollSnap: () => selected,
    // Test hook: a touch landing while the wheel is still moving.
    touchWhileMoving() {
      api.emit('scroll');
      api.emit('pointerDown');
    },
    scrollTo(index, jump) {
      emblaCalls.scrollTo.push([index, jump]);
      selected = index;
      api.emit('select');
      api.emit('scroll');
      api.emit('settle');
    },
    scrollProgress: () => (count() > 1 ? selected / (count() - 1) : 0),
    scrollSnapList: () =>
      Array.from({ length: count() }, (_, i) =>
        count() > 1 ? i / (count() - 1) : 0,
      ),
    internalEngine: () => ({
      options,
      slideRegistry: Array.from({ length: count() }, (_, i) => [i]),
      slideLooper: { loopPoints: [] },
    }),
  };
  return api;
};

export default function useFakeEmbla(options = {}) {
  const node = useRef(null);
  const [api] = useState(() => {
    emblaCalls.options.push(options);
    const api = createApi(options, () =>
      node.current ? node.current.firstElementChild.children.length : 0,
    );
    emblaCalls.apis.push(api);
    return api;
  });
  const ref = (element) => {
    node.current = element;
  };
  return [ref, api];
}
