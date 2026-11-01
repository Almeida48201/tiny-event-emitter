import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from '../src/index.js';

test('on registers a listener that receives emitted arguments', () => {
  const emitter = new EventEmitter();
  const received = [];
  emitter.on('data', (a, b) => received.push([a, b]));
  const result = emitter.emit('data', 1, 2);
  assert.equal(result, true);
  assert.deepEqual(received, [[1, 2]]);
});

test('emit returns false when no listener is registered', () => {
  const emitter = new EventEmitter();
  assert.equal(emitter.emit('missing'), false);
});

test('once listener is called exactly once', () => {
  const emitter = new EventEmitter();
  let count = 0;
  emitter.once('ping', () => { count += 1; });
  emitter.emit('ping');
  emitter.emit('ping');
  assert.equal(count, 1);
  assert.equal(emitter.listenerCount('ping'), 0);
});

test('off removes a listener', () => {
  const emitter = new EventEmitter();
  let count = 0;
  const listener = () => { count += 1; };
  emitter.on('tick', listener);
  emitter.off('tick', listener);
  emitter.emit('tick');
  assert.equal(count, 0);
});

test('off removes only the matching listener', () => {
  const emitter = new EventEmitter();
  const calls = [];
  const a = () => calls.push('a');
  const b = () => calls.push('b');
  emitter.on('x', a);
  emitter.on('x', b);
  emitter.off('x', a);
  emitter.emit('x');
  assert.deepEqual(calls, ['b']);
});

test('off on an unknown event is a no-op', () => {
  const emitter = new EventEmitter();
  assert.doesNotThrow(() => emitter.off('nope', () => {}));
});

test('listeners are called in registration order', () => {
  const emitter = new EventEmitter();
  const order = [];
  emitter.on('seq', () => order.push(1));
  emitter.on('seq', () => order.push(2));
  emitter.on('seq', () => order.push(3));
  emitter.emit('seq');
  assert.deepEqual(order, [1, 2, 3]);
});

test('removing a listener during emit does not skip the next listener', () => {
  const emitter = new EventEmitter();
  const calls = [];
  const second = () => calls.push('second');
  const first = () => {
    calls.push('first');
    emitter.off('evt', second);
  };
  emitter.on('evt', first);
  emitter.on('evt', second);
  emitter.emit('evt');
  assert.deepEqual(calls, ['first']);
});

test('once listener removed during emit is not called again', () => {
  const emitter = new EventEmitter();
  const calls = [];
  emitter.once('evt', () => calls.push('once'));
  emitter.on('evt', () => calls.push('on'));
  emitter.emit('evt');
  emitter.emit('evt');
  assert.deepEqual(calls, ['once', 'on', 'on']);
});

test('on throws when listener is not a function', () => {
  const emitter = new EventEmitter();
  assert.throws(() => emitter.on('evt', null), TypeError);
});

test('once throws when listener is not a function', () => {
  const emitter = new EventEmitter();
  assert.throws(() => emitter.once('evt', 42), TypeError);
});

test('off throws when listener is not a function', () => {
  const emitter = new EventEmitter();
  assert.throws(() => emitter.off('evt', 'nope'), TypeError);
});

test('listenerCount reports the number of registered listeners', () => {
  const emitter = new EventEmitter();
  assert.equal(emitter.listenerCount('evt'), 0);
  emitter.on('evt', () => {});
  emitter.once('evt', () => {});
  assert.equal(emitter.listenerCount('evt'), 2);
  emitter.emit('evt');
  assert.equal(emitter.listenerCount('evt'), 1);
});

test('registering the same listener twice calls it twice', () => {
  const emitter = new EventEmitter();
  let count = 0;
  const listener = () => { count += 1; };
  emitter.on('evt', listener);
  emitter.on('evt', listener);
  emitter.emit('evt');
  assert.equal(count, 2);
});

test('emit returns true when at least one listener is called', () => {
  const emitter = new EventEmitter();
  emitter.on('evt', () => {});
  assert.equal(emitter.emit('evt'), true);
});
