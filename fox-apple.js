"use strict";

const clampFoxApple = (value, min, max) => Math.max(min, Math.min(max, value));

function foxAppleBusy(game) {
  return Boolean(game?.drag?.engaged || game?.fetch);
}

function addAppleSample(drag, event) {
  const point = { x: event.clientX, y: event.clientY, time: performance.now() };
  drag.samples.push(point);
  while (drag.samples.length > 2 && drag.samples[1].time < point.time - 115) drag.samples.shift();
  return point;
}

function appleVelocity(samples, release) {
  const recent = samples.find(point => point.time >= release.time - 115) ?? release;
  const time = Math.max(20, release.time - recent.time);
  return { x: (release.x - recent.x) / time, y: (release.y - recent.y) / time };
}

function appleInLane(game, x, y) {
  const { viewportWidth, ground } = game.lane;
  const { scale } = game.fruit;
  const inset = 18 * scale;
  const insideX = clampFoxApple(x, inset, viewportWidth - inset);
  return {
    x: insideX,
    y: clampFoxApple(y, 21 * scale, terrainHeight(insideX, ground) - 15 * scale)
  };
}

function startAppleFetch(game, origin, velocity, now) {
  if (calmMotion.matches) return;
  const { start, width, ground, viewportWidth } = game.lane;
  const fox = game.fox;
  const speed = Math.min(2.2, Math.hypot(velocity.x, velocity.y));
  const thrown = speed > .23;
  const projectedX = origin.x + (thrown ? clampFoxApple(velocity.x * 245, -510, 510) : 0);
  const landing = appleInLane(game, projectedX, ground);
  if (start && landing.x > width && landing.x < start) {
    landing.x = landing.x < viewportWidth / 2 ? width - 18 * fox.scale : start + 18 * fox.scale;
  }
  const room = Math.min(width * .24, fox.scale * 40);
  const minFox = room;
  const maxFox = viewportWidth - room;
  const reach = 47 * fox.scale;
  let direction = landing.x >= fox.bodyX ? 1 : -1;
  const approach = landing.x - direction * reach;
  const otherSide = landing.x + direction * reach;
  if ((approach < minFox || approach > maxFox) && otherSide >= minFox && otherSide <= maxFox) direction *= -1;
  const catchX = clampFoxApple(landing.x - direction * reach, minFox, maxFox);
  const flight = thrown ? 380 + speed * 155 : 290;
  const run = clampFoxApple(Math.abs(catchX - fox.bodyX) / .52, 190, 1750);
  const alreadyFacing = direction * fox.facing > .65;
  const turn = alreadyFacing ? 70 : 185;
  const pickup = Math.max(flight + 105, turn + run);
  game.fetch = {
    now, origin, landX: landing.x, flight, run, turn, pickup,
    startX: fox.bodyX, startFacing: fox.facing, scale: fox.scale, catchX, direction,
    loft: thrown ? 24 + speed * 32 + clampFoxApple(-velocity.y, 0, 2.2) * 10 : 8,
    spin: thrown ? clampFoxApple(velocity.x * 2.6, -6, 6) : .25,
    laneStart: start, laneWidth: width
  };
}

function setupFoxApple(button, redraw) {
  const game = { button, drag: null, fetch: null, resume: null, fox: null, fruit: null, lane: null };
  const update = () => { if (calmMotion.matches) redraw(); };

  button.addEventListener("pointerdown", event => {
    if (event.button !== 0 || game.drag || game.fetch || !game.fruit) return;
    const offsetX = event.clientX - game.fruit.x;
    const offsetY = event.clientY - game.fruit.y;
    const drag = {
      id: event.pointerId, offsetX, offsetY, engaged: false,
      startX: event.clientX, startY: event.clientY, samples: []
    };
    addAppleSample(drag, event);
    game.drag = drag;
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("pointermove", event => {
    const drag = game.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const point = addAppleSample(drag, event);
    if (!drag.engaged) {
      if (Math.hypot(point.x - drag.startX, point.y - drag.startY) < 5) return;
      drag.engaged = true;
      drag.fox = game.fox;
    }
    drag.position = appleInLane(game, point.x - drag.offsetX, point.y - drag.offsetY);
    update();
  });

  const release = (event, cancelled) => {
    const drag = game.drag;
    if (!drag || drag.id !== event.pointerId) return;
    game.drag = null;
    if (drag.engaged) {
      const point = addAppleSample(drag, event);
      const velocity = cancelled ? { x: 0, y: 0 } : appleVelocity(drag.samples, point);
      const origin = cancelled ? drag.position : appleInLane(game, point.x - drag.offsetX, point.y - drag.offsetY);
      startAppleFetch(game, origin, velocity, point.time);
    }
    update();
  };
  button.addEventListener("pointerup", event => release(event, false));
  button.addEventListener("pointercancel", event => release(event, true));
  button.addEventListener("lostpointercapture", event => release(event, true));

  button.addEventListener("click", event => {
    // Keyboard activation throws along the side of the path with the most room.
    if (event.detail || game.drag || game.fetch || !game.fruit) return;
    const direction = game.fruit.x < game.lane.viewportWidth / 2 ? 1 : -1;
    startAppleFetch(game, game.fruit, { x: direction * .88, y: -.18 }, performance.now());
    update();
  });
  return game;
}

function positionFoxAppleTarget(scene, fox) {
  const game = scene.apple;
  if (!game || game.drag) return;
  const { button } = game;
  if (fox && !game.fetch && game.fruit) {
    const { x, y, scale } = game.fruit;
    const size = Math.max(32, scale * 35);
    const leftEdge = 0;
    const bottomEdge = scene.height;
    const left = Math.max(leftEdge, x - size / 2);
    const right = Math.min(scene.width, x + size / 2);
    const top = Math.max(0, y - size / 2);
    const bottom = Math.min(bottomEdge, y + size / 2);
    if (right - left >= 18 && bottom - top >= 15) {
      button.style.transform = "translate(" + Math.round(left) + "px, " + Math.round(top) + "px)";
      button.style.width = Math.round(right - left) + "px";
      button.style.height = Math.round(bottom - top) + "px";
      button.hidden = false;
      return;
    }
  }
  button.hidden = true;
}

function appleFetchPosition(fetch, ground, scale, elapsed) {
  const p = introProgress(elapsed, 0, fetch.flight);
  const x = fetch.origin.x + (fetch.landX - fetch.origin.x) * p;
  const floor = terrainHeight(x, ground) - 15 * scale;
  const bounce = introProgress(elapsed, fetch.flight, fetch.flight + 105);
  const y = Math.max(23 * scale,
    fetch.origin.y + (floor - fetch.origin.y) * p - fetch.loft * 4 * p * (1 - p) - Math.sin(bounce * Math.PI) * 9);
  return { x, y, scale, angle: fetch.spin * p };
}

function resumeFoxAfterFetch(game, lane, now, pet) {
  const { catchX, direction } = game.fetch;
  const route = foxRoute(lane.start, lane.width, 0);
  const center = lane.start + lane.width / 2;
  const normalized = route.distance ? clampFoxApple((catchX - center) / route.distance, -1, 1) : 0;
  const angle = Math.asin(normalized);
  const cycle = direction > 0 ? angle : Math.PI - angle;
  game.resume = {
    now, phase: 1120 + (cycle + Math.PI / 2) * route.duration,
    shift: catchX - (center + normalized * route.distance), petDelay: pet?.delay ?? 0
  };
  game.fetch = null;
}

function paintAppleGame(ctx, game, lane, phase, pet, time) {
  const { start, width, ground } = lane;
  const now = time || performance.now();
  game.lane = lane;
  if (game.fetch && (game.fetch.laneStart !== start || game.fetch.laneWidth !== width || calmMotion.matches)) {
    game.fetch = null;
  }

  if (game.drag?.engaged) {
    const { fox, position } = game.drag;
    const facing = clampFoxApple((position.x - fox.bodyX) / (35 * fox.scale), -1, 1);
    game.fox = drawFox(ctx, fox.bodyX, ground, fox.scale, 0, {
      torso: fox.facing, breadth: 0, head: facing, headDepth: Math.sqrt(1 - facing ** 2),
      tail: fox.tail, lookBack: 0, stance: 1
    });
    paintApple(ctx, position.x, position.y, game.fruit.scale);
    return game.fox;
  }

  if (game.fetch) {
    const fetch = game.fetch;
    const elapsed = now - fetch.now;
    const progress = introProgress(elapsed, fetch.turn, fetch.turn + fetch.run);
    const travel = smoothTurn(progress);
    const run = Math.sin(progress * Math.PI) ** .62;
    const x = fetch.startX + (fetch.catchX - fetch.startX) * travel;
    const turn = smoothTurn(introProgress(elapsed, 0, fetch.turn));
    const startAngle = Math.acos(clampFoxApple(fetch.startFacing, -1, 1));
    const angle = startAngle + ((fetch.direction > 0 ? 0 : Math.PI) - startAngle) * turn;
    const facing = Math.cos(angle);
    const dip = smoothTurn(introProgress(elapsed, fetch.pickup - 76, fetch.pickup + 35));
    const grip = smoothTurn(introProgress(elapsed, fetch.pickup, fetch.pickup + 165));
    const stride = Math.abs(x - fetch.startX) * Math.PI / (fetch.scale * 22);
    const fox = drawFox(ctx, x, ground, fetch.scale, stride, {
      torso: facing, breadth: Math.sin(angle), head: facing, headDepth: Math.sin(angle),
      tail: facing, lookBack: 0, stance: 1 - run, run,
      crouch: dip * (1 - grip) * .58, headDrop: dip * (1 - grip) * 22
    });
    game.fox = fox;
    const loose = appleFetchPosition(fetch, ground, game.fruit.scale, elapsed);
    const held = heldApplePosition(fox);
    paintApple(ctx, loose.x + (held.x - loose.x) * grip, loose.y + (held.y - loose.y) * grip,
      held.scale, loose.angle + (.16 * facing - loose.angle) * grip);
    if (grip === 1) {
      game.fruit = held;
      resumeFoxAfterFetch(game, lane, now, pet);
    }
    return fox;
  }

  const resume = game.resume;
  const elapsed = resume && !calmMotion.matches ? Math.max(0, now - resume.now) : 0;
  const roam = resume ? Math.max(0, elapsed - ((pet?.delay ?? 0) - resume.petDelay)) : 0;
  const resumedPhase = resume ? resume.phase + roam : phase;
  const shift = resume ? resume.shift * (1 - smoothTurn(roam / Math.max(540, Math.abs(resume.shift) * 5))) : 0;
  const fox = walkFox(ctx, start, width, ground, resumedPhase, pet, shift);
  if (!fox) return null;
  game.fox = fox;
  game.fruit = heldApplePosition(fox);
  paintHeldApple(ctx, fox);
  if (pet) paintFoxPetParticles(ctx, fox, pet);
  return fox;
}
