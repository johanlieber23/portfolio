"use strict";

const clampFoxApple = (value, min, max) => Math.max(min, Math.min(max, value));

function foxAppleBusy(game) {
  return Boolean(game?.drag?.engaged || game?.fetch || game?.reclaim);
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
  const { start, width, viewportWidth } = game.lane;
  const fox = game.fox;
  const speed = Math.min(2.2, Math.hypot(velocity.x, velocity.y));
  const thrown = speed > .23;
  const projectedX = origin.x + (thrown ? clampFoxApple(velocity.x * 390, -850, 850) : 0);
  const landing = appleInLane(game, projectedX, Infinity);
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
  const flight = thrown ? 460 - speed * 65 : 290;
  const run = clampFoxApple(Math.abs(catchX - fox.bodyX) / .52, 190, 1750);
  const alreadyFacing = direction * fox.facing > .65;
  const turn = alreadyFacing ? 70 : 185;
  const pickup = Math.max(flight + 105, turn + run);
  game.fetch = {
    now, origin, landX: landing.x, flight, run, turn, pickup,
    startX: fox.bodyX, startFacing: fox.facing, scale: fox.scale, catchX, direction,
    startLift: Math.max(0, terrainHeight(fox.bodyX, game.lane.ground) - fox.ground),
    loft: thrown ? 24 + speed * 32 + clampFoxApple(-velocity.y, 0, 2.2) * 10 : 8,
    spin: thrown ? clampFoxApple(velocity.x * 2.6, -6, 6) : .25,
    laneStart: start, laneWidth: width, stride: 0, previousX: fox.bodyX
  };
}

function setupFoxApple(button, redraw) {
  const game = { button, drag: null, fetch: null, reclaim: null, resume: null, fox: null, fruit: null, lane: null };
  const update = () => { if (calmMotion.matches) redraw(); };

  button.addEventListener("pointerdown", event => {
    if (event.button !== 0 || foxAppleBusy(game) || game.drag || !game.fruit) return;
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
      drag.chase = {
        x: game.fox.bodyX, scale: game.fox.scale, speed: 0, stride: 0,
        angle: Math.acos(clampFoxApple(game.fox.facing, -1, 1)),
        direction: Math.sign(game.fox.facing) || 1, last: point.time, retryAt: point.time + 290
      };
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
    if (event.detail || foxAppleBusy(game) || game.drag || !game.fruit) return;
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
  if (fox && !foxAppleBusy(game) && game.fruit) {
    const { x, y, scale } = game.fruit;
    const size = Math.max(52, scale * 52);
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
  const floor = terrainHeight(fetch.landX, ground) - 15 * scale;
  const bounce = introProgress(elapsed, fetch.flight, fetch.flight + 105);
  const y = Math.max(23 * scale,
    fetch.origin.y + (floor - fetch.origin.y) * p - fetch.loft * 4 * p * (1 - p) - Math.sin(bounce * Math.PI) * 9);
  return { x, y, scale, angle: fetch.spin * p };
}

function resumeFoxRoute(game, lane, now, pet, x, direction) {
  const route = foxRoute(lane.start, lane.width, 0);
  const center = lane.start + lane.width / 2;
  const normalized = route.distance ? clampFoxApple((x - center) / route.distance, -1, 1) : 0;
  const angle = Math.asin(normalized);
  const cycle = direction > 0 ? angle : Math.PI - angle;
  game.resume = {
    now, phase: 1120 + (cycle + Math.PI / 2) * route.duration,
    shift: x - (center + normalized * route.distance), scale: route.scale, petDelay: pet?.delay ?? 0
  };
}

function chooseApplePivot(lane, x, target, scale, min, max) {
  const { start, width, viewportWidth } = lane;
  const edges = [{ edge: 0, away: 1 }, { edge: viewportWidth, away: -1 }];
  if (start > width && x <= width) edges.push({ edge: width, away: -1 });
  if (start > width && x >= start) edges.push({ edge: start, away: 1 });
  let best;
  for (const { edge, away } of edges) {
    const plant = edge + away * 31 * scale;
    if (plant < 0 || plant > viewportWidth) continue;
    const approach = clampFoxApple(edge + away * 100 * scale, min, max);
    const beyondWall = Math.max(0, (edge - target) * away);
    const score = Math.abs(x - approach) * .65 + Math.abs(target - plant) + beyondWall;
    if (!best || score < best.score) best = { edge, away, plant, approach, score, outer: edge === 0 || edge === viewportWidth };
  }
  return best;
}

function applePivotFrame(jump, elapsed) {
  const { wall, from, apexX, landing, plantLift, peakLift } = jump;
  const groundPush = 115;
  const plantAt = 475;
  const hangUntil = plantAt + 500;
  const releaseAt = hangUntil + 90;
  const peakAt = releaseAt + 395;
  const downAt = peakAt + 595;
  const end = downAt + 145;
  const approach = introProgress(elapsed, groundPush, plantAt);
  const push = smoothTurn(introProgress(elapsed, hangUntil, releaseAt));
  const rise = introProgress(elapsed, releaseAt, peakAt);
  const fall = introProgress(elapsed, peakAt, downAt);
  const settle = introProgress(elapsed, downAt, end);
  const facingAngle = (wall.away > 0 ? Math.PI : 0) + (wall.away > 0 ? -Math.PI : Math.PI) * push;
  const facing = Math.cos(facingAngle);
  let x = from + (wall.plant - from) * smoothTurn(approach);
  let lift = plantLift * (1 - (1 - approach) ** 2);
  if (rise > 0) {
    x = wall.plant + (apexX - wall.plant) * smoothTurn(rise);
    lift = plantLift + (peakLift - plantLift) * Math.sin(Math.PI * rise / 2);
  }
  if (fall > 0) {
    x = apexX + (landing - apexX) * smoothTurn(fall);
    lift = peakLift * (1 - fall ** 1.75);
  }
  const plant = smoothTurn((elapsed - 420) / (plantAt - 420)) * (1 - push);
  const hang = introProgress(elapsed, plantAt, hangUntil);
  const load = smoothTurn((hang - .65) / .35);
  return {
    x, lift, done: elapsed >= end, releaseAt,
    catchWindow: rise > .30 && fall < .74,
    pose: {
      torso: facing, breadth: Math.sin(facingAngle), head: facing, headDepth: Math.sin(facingAngle),
      tail: facing, lookBack: 0, stance: 1,
      crouch: .8 * Math.sin(Math.PI * introProgress(elapsed, 0, groundPush * 2)) * (1 - approach) +
        .68 * Math.sin(Math.PI * settle),
      spring: Math.sin(Math.PI * approach) * (1 - rise) + Math.sin(Math.PI * rise),
      tuck: .60 * Math.sin(Math.PI * fall) + .37 * Math.sin(Math.PI * rise),
      dive: smoothTurn((fall - .23) / .36) * (1 - smoothTurn((fall - .86) / .14)),
      airborne: smoothTurn(lift / 25), headDrop: -13 * (1 - fall) * rise,
      wallOffset: wall.edge - x, wallPlant: plant, wallGrip: plant * (.84 + load * .19)
    }
  };
}

function paintApplePursuit(ctx, game, lane, now, pet) {
  const drag = game.drag;
  const chase = drag?.chase ?? game.reclaim.chase;
  const position = drag?.position;
  const { ground, viewportWidth } = lane;
  const { scale } = chase;
  const margin = Math.min(viewportWidth * .22, 38 * scale);
  const minimum = margin;
  const maximum = viewportWidth - margin;
  const dt = clampFoxApple(now - chase.last, 0, 35);
  chase.last = now;
  chase.x = clampFoxApple(chase.x, minimum, maximum);
  let fox;
  let realizedSpeed = 0;
  let run = 0;

  if (position && !chase.jump) {
    const dx = position.x - chase.x;
    if (Math.abs(dx) > 32 * scale) chase.direction = Math.sign(dx);
    const reach = 48 * scale;
    const height = terrainHeight(chase.x, ground) - position.y;
    const wall = height >= Math.min(165 * scale, ground * .68)
      ? (chase.wall ??= chooseApplePivot(lane, chase.x, position.x, scale, minimum, maximum))
      : (chase.wall = null);
    if (wall) chase.direction = -wall.away;
    const targetX = wall?.approach ?? clampFoxApple(position.x - reach * chase.direction, minimum, maximum);
    const distance = targetX - chase.x;
    const speed = clampFoxApple(distance * .008, -.72, .72);
    chase.speed += (speed - chase.speed) * Math.min(1, dt / 85);
    const previousX = chase.x;
    if (!calmMotion.matches) {
      if (Math.abs(distance) < .7 && Math.abs(chase.speed) < .025) chase.speed = 0;
      chase.x = clampFoxApple(chase.x + chase.speed * dt, minimum, maximum);
    }
    const travelled = Math.abs(chase.x - previousX);
    realizedSpeed = dt > 0 ? travelled / dt : 0;
    run = smoothTurn((realizedSpeed - .12) / .42);
    chase.stride += travelled * Math.PI / (scale * (24 + 46 * run));
    const desiredAngle = chase.direction > 0 ? 0 : Math.PI;
    if (!calmMotion.matches) chase.angle += (desiredAngle - chase.angle) * Math.min(1, dt / 65);
    if (!calmMotion.matches && now >= chase.retryAt && Math.abs(distance) < 30 * scale &&
        Math.abs(chase.speed) < .25 && Math.abs(desiredAngle - chase.angle) < .23) {
      const landing = clampFoxApple(targetX + 15 * scale * chase.direction, minimum, maximum);
      if (wall) {
        const lower = wall.away > 0 ? Math.max(minimum, wall.plant) : minimum;
        const upper = wall.away < 0 ? Math.min(maximum, wall.plant) : maximum;
        const apexX = clampFoxApple(position.x - 48 * scale * wall.away, lower, upper);
        const plantLift = Math.min(114 * scale, height * .38);
        chase.jump = {
          now, wall, from: chase.x, direction: wall.away, apexX,
          landing: clampFoxApple(apexX + 64 * scale * wall.away, lower, upper),
          plantLift,
          peakLift: Math.max(plantLift + 12 * scale, terrainHeight(apexX, ground) - position.y - 36 * scale)
        };
      } else chase.jump = {
        now, from: chase.x, landing, direction: chase.direction,
        lift: clampFoxApple(height - 40 * scale, 9 * scale, 132 * scale),
        lowReach: 1 - smoothTurn((height / scale - 24) / 29)
      };
    }
  }

  const jump = chase.jump;
  if (jump) {
    const elapsed = now - jump.now;
    const pivot = jump.wall ? applePivotFrame(jump, elapsed) : null;
    const p = introProgress(elapsed, 118, 678);
    const crest = Math.sin(p * Math.PI);
    const lift = pivot?.lift ?? 4 * p * (1 - p) * jump.lift;
    const jumping = lift > 0;
    chase.x = pivot?.x ?? clampFoxApple(jump.from + (jump.landing - jump.from) * smoothTurn(p), minimum, maximum);
    const landing = introProgress(elapsed, 678, 820);
    const brace = 1 - smoothTurn((elapsed - 118) / 95);
    const crouch = smoothTurn(elapsed / 118) * brace * .85 + Math.sin(Math.PI * landing) * .56;
    const spring = jumping ? Math.sin(Math.PI * Math.min(1, p / .62)) : 0;
    const dive = smoothTurn((p - .5) / .25) * (1 - smoothTurn((p - .87) / .13));
    // Only render the fox on the side from which it grabbed the wall.
    const clipWall = pivot && !jump.wall.outer;
    if (clipWall) {
      const edge = jump.wall.edge;
      ctx.save();
      ctx.beginPath();
      ctx.rect(jump.wall.away > 0 ? edge : 0, -100,
        jump.wall.away > 0 ? viewportWidth - edge : edge, ground + 220);
      ctx.clip();
    }
    fox = drawFox(ctx, chase.x, jumping ? terrainHeight(chase.x, ground) - lift : ground, scale, chase.stride, pivot ? { ...pivot.pose, flatGround: jumping } : {
      torso: jump.direction, breadth: 0, head: jump.direction, headDepth: 0, tail: jump.direction,
      lookBack: 0, stance: 1, crouch,
      flatGround: jumping, airborne: crest, spring,
      tuck: crest * .58, dive, headDrop: (-10 + 43 * jump.lowReach) * crest + 5 * dive
    });

    if (clipWall) ctx.restore();

    if (pivot) {
      const dust = introProgress(elapsed, pivot.releaseAt - 20, pivot.releaseAt + 225);
      if (dust > 0 && dust < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - dust) * .8;
        const contactY = terrainHeight(jump.wall.plant, ground) - jump.plantLift - 47 * scale;
        for (let i = 0; i < 6; i++) {
          const offsetX = jump.wall.away * (4 + i * 5) * dust * scale;
          const offsetY = (i - 2.5) * 8 * dust * scale + 15 * dust ** 2;
          disk(ctx, "#888888", jump.wall.edge + offsetX, contactY + offsetY, 2.6 * scale);
        }
        ctx.restore();
      }
    }

    const mouth = heldApplePosition(fox);
    if (drag && (pivot?.catchWindow ?? (p > .16 && p < .89)) &&
        Math.hypot(position.x - mouth.x, position.y - mouth.y) < 19 * scale) {
      game.reclaim = { chase, position, time: now };
      game.drag = null;
      if (game.button.hasPointerCapture(drag.id)) game.button.releasePointerCapture(drag.id);
    }
    if (game.reclaim) {
      const caught = game.reclaim;
      const grip = smoothTurn((now - caught.time) / 92);
      paintApple(ctx, caught.position.x + (mouth.x - caught.position.x) * grip,
        caught.position.y + (mouth.y - caught.position.y) * grip, mouth.scale, fox.facing * .16 * grip);
    }
    if (pivot?.done ?? elapsed >= 820) {
      if (game.reclaim) {
        game.fruit = mouth;
        game.reclaim = null;
        resumeFoxRoute(game, lane, now, pet, fox.bodyX, jump.direction);
      }
      chase.jump = null;
      chase.wall = null;
      chase.angle = jump.direction > 0 ? 0 : Math.PI;
      chase.speed = 0;
      chase.retryAt = now + 380;
    }
  } else {
    const facing = Math.cos(chase.angle);
    const turn = Math.sin(chase.angle);
    fox = drawFox(ctx, chase.x, ground, scale, chase.stride, {
      torso: facing, breadth: turn, head: facing, headDepth: turn, tail: facing,
      lookBack: 0, stance: 1 - smoothTurn(realizedSpeed / .075), run,
      headDrop: -7 * smoothTurn((terrainHeight(chase.x, ground) - position.y - 40 * scale) / (65 * scale))
    });
  }
  if (game.drag && position) paintApple(ctx, position.x, position.y, game.fruit.scale);
  game.fox = fox;
  return fox;
}

function paintAppleGame(ctx, game, lane, phase, pet, time) {
  const { start, width, ground } = lane;
  const now = time || performance.now();
  game.lane = lane;
  if (game.fetch && (game.fetch.laneStart !== start || game.fetch.laneWidth !== width || calmMotion.matches)) {
    game.fetch = null;
  }

  if (game.reclaim && calmMotion.matches) {
    resumeFoxRoute(game, lane, now, pet, game.fox.bodyX, Math.sign(game.fox.facing) || 1);
    game.reclaim = null;
  }
  if (game.drag?.engaged || game.reclaim) return paintApplePursuit(ctx, game, lane, now, pet);

  if (game.fetch) {
    const fetch = game.fetch;
    const elapsed = now - fetch.now;
    const progress = introProgress(elapsed, fetch.turn, fetch.turn + fetch.run);
    const travel = smoothTurn(progress);
    const speed = Math.abs(fetch.catchX - fetch.startX) * 6 * progress * (1 - progress) / fetch.run;
    const run = smoothTurn((speed - .12) / .42);
    const x = fetch.startX + (fetch.catchX - fetch.startX) * travel;
    const turn = smoothTurn(introProgress(elapsed, 0, fetch.turn));
    const startAngle = Math.acos(clampFoxApple(fetch.startFacing, -1, 1));
    const angle = startAngle + ((fetch.direction > 0 ? 0 : Math.PI) - startAngle) * turn;
    const facing = Math.cos(angle);
    const dip = smoothTurn(introProgress(elapsed, fetch.pickup - 76, fetch.pickup + 35));
    const grip = smoothTurn(introProgress(elapsed, fetch.pickup, fetch.pickup + 165));
    fetch.stride += Math.abs(x - fetch.previousX) * Math.PI / (fetch.scale * (24 + 46 * run));
    fetch.previousX = x;
    const lift = fetch.startLift * (1 - smoothTurn(elapsed / 240));
    const fox = drawFox(ctx, x, lift > 0 ? terrainHeight(x, ground) - lift : ground, fetch.scale, fetch.stride, {
      flatGround: lift > 0, airborne: Math.min(1, lift / 40),
      torso: facing, breadth: Math.sin(angle), head: facing, headDepth: Math.sin(angle),
      tail: facing, lookBack: 0, stance: 1 - smoothTurn(speed / .075), run,
      crouch: dip * (1 - grip) * .58, headDrop: dip * (1 - grip) * 22
    });
    game.fox = fox;
    const loose = appleFetchPosition(fetch, ground, game.fruit.scale, elapsed);
    const held = heldApplePosition(fox);
    paintApple(ctx, loose.x + (held.x - loose.x) * grip, loose.y + (held.y - loose.y) * grip,
      held.scale, loose.angle + (.16 * facing - loose.angle) * grip);
    if (grip === 1) {
      game.fruit = held;
      resumeFoxRoute(game, lane, now, pet, fetch.catchX, fetch.direction);
      game.fetch = null;
    }
    return fox;
  }

  const resume = game.resume;
  const elapsed = resume && !calmMotion.matches ? Math.max(0, now - resume.now) : 0;
  const roam = resume ? Math.max(0, elapsed - ((pet?.delay ?? 0) - resume.petDelay)) : 0;
  const resumedPhase = resume ? resume.phase + roam : phase;
  const returnTime = resume ? Math.max(540, Math.abs(resume.shift) * 5) : 540;
  const progress = Math.min(1, roam / returnTime);
  const shift = resume ? resume.shift * (1 - smoothTurn(progress)) : 0;
  const recovery = resume ? resume.shift - shift : 0;
  const speed = Math.abs(resume?.shift ?? 0) * 6 * progress * (1 - progress) / returnTime;
  const run = smoothTurn((speed - .035) / .13);
  const fox = walkFox(ctx, start, width, ground, resumedPhase, pet, shift, resume ?
    (x, stride, pose) => {
      const facing = -Math.sign(resume.shift);
      const angle = Math.acos(clampFoxApple(pose.torso, -1, 1));
      const turn = angle + ((facing > 0 ? 0 : Math.PI) - angle) * run;
      const torso = Math.cos(turn);
      return {
        x,
        stride: stride + Math.abs(recovery) * Math.PI / (resume.scale * 48),
        pose: {
          ...pose, torso, breadth: Math.sin(turn),
          head: pose.head + (torso - pose.head) * run,
          headDepth: pose.headDepth + (Math.sin(turn) - pose.headDepth) * run,
          tail: pose.tail + (torso - pose.tail) * run,
          lookBack: pose.lookBack * (1 - run), run
        }
      };
    } : null);
  if (!fox) return null;
  game.fox = fox;
  game.fruit = heldApplePosition(fox);
  paintHeldApple(ctx, fox);
  if (pet) paintFoxPetParticles(ctx, fox, pet);
  return fox;
}
