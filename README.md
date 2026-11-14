# tiny-event-emitter

A typed event emitter with `on`, `once`, `off`, `emit`, and `listenerCount`.

```js
import { EventEmitter } from './src/index.js';

const emitter = new EventEmitter();

const onData = (x) => console.log('data', x);
emitter.on('data', onData);
emitter.once('ready', () => console.log('ready once'));

emitter.emit('ready'); // ready once
emitter.emit('ready'); // (no output)
emitter.emit('data', 42); // data 42

emitter.off('data', onData);
emitter.emit('data', 43); // (no output)
```

## Why this exists

Most event emitters in the npm ecosystem pull in dependencies or ship a large
surface area. This one is a single class in a single file with no imports. The
trade-off is that it deliberately does not support wildcard events, async
listeners, or error events: if you need those, a larger library is the better
choice. The goal here is a small, predictable primitive that behaves the same
way every time.

## The awkward edge

`off` removes a listener by identity. If you register the same function twice
with `on`, calling `off` once removes both registrations. This matches the
behaviour of `removeListener` in Node's `EventEmitter` and is the simplest rule
to reason about. If you need to remove a single registration, wrap the listener
in a fresh closure for each `on` call.

A second edge: `once` listeners are removed before they are invoked, so a
`once` callback that emits the same event again will not re-enter itself.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

