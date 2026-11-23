"use strict";

const introTiming = {
  arrive: 2180,
  pickup: 2400,
  reveal: 2500,
  surface: 2640,
  jump: 2590,
  settle: 3430,
  land: 3660,
  resume: 3860,
  end: 4110
};

const appleFruit = new Path2D("M 0 -10 C -9 -15 -17 -8 -15 2 Q -13 14 -5 15 Q -2 15 0 13 Q 4 16 8 13 Q 15 8 15 -1 C 15 -11 7 -14 0 -10 Z");
const appleLeaf = new Path2D("M 0 -13 Q 3 -22 14 -21 Q 12 -13 0 -13 Z");

function introProgress(elapsed, start, end) {
  return Math.max(0, Math.min(1, (elapsed - start) / (end - start)));
}

function setupForestIntro(panel, canvas) {
  const root = document.documentElement;
  if (!root.classList.contains("forest-intro") || !canvas) return null;
  const skip = document.querySelector(".forest-intro-skip");
  const listeners = new AbortController();
  const intro = { active: true, startedAt: null, reveal: false, handoff: null, panelTop: panel.offsetTop };
  panel.inert = true;

  intro.finish = () => {
    if (!intro.active) return;
    const restoreFocus = document.activeElement === skip;
    intro.active = false;
    root.classList.remove("forest-intro", "forest-unfurl");
    panel.style.removeProperty("--forest-rise");
    panel.style.removeProperty("--forest-exposed");
    panel.inert = false;
    listeners.abort();
    if (restoreFocus) {
      const heading = panel.querySelector("h1");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

  intro.measureCard = () => { intro.panelTop = panel.offsetTop; };
  intro.positionCard = (top, exposed) => {
    panel.style.setProperty("--forest-rise", (top - intro.panelTop) + "px");
    panel.style.setProperty("--forest-exposed", exposed + "px");
    if (!intro.reveal) {
      intro.reveal = true;
      root.classList.add("forest-unfurl");
    }
  };

  intro.elapsed = time => {
    if (!intro.active) return null;
    if (!root.classList.contains("forest-intro") || scrollY > 12 || calmMotion.matches) {
      intro.finish();
      return null;
    }
    if (!time) return intro.startedAt === null ? 0 : intro.lastElapsed;
    intro.startedAt ??= time;
    const elapsed = time - intro.startedAt;
    intro.lastElapsed = elapsed;
    if (elapsed >= introTiming.end) {
      intro.finish();
      return null;
    }
    return elapsed;
  };

  const options = { signal: listeners.signal };
  skip.addEventListener("click", intro.finish, options);
  window.addEventListener("scroll", () => {
    if (scrollY > 12) intro.finish();
  }, { ...options, passive: true });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") intro.finish();
  }, options);
  window.addEventListener("hashchange", () => {
    if (location.hash !== "#top" && location.hash) intro.finish();
  }, options);
  return intro;
}

function introGround(scene) {
  return scene.band ? Math.min(scene.height * .58, scene.band + 185) : scene.height * .78;
}

function paintIntroForest(ctx, scene, daylight, time, elapsed) {
  const { width } = scene;
  const ground = introGround(scene);
  const blend = smoothTurn(introProgress(elapsed, introTiming.jump + 210, introTiming.land + 150));
  if (blend === 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - blend;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, scene.height);
  forestStrip(ctx, width, ground / .83, time, scene.x, 0, daylight, true);
  forestFloor(ctx, 0, width, ground, Math.min(105, scene.height * .15));
  ctx.restore();
}

function introCardTop(scene, ground, elapsed) {
  const { reveal, surface, settle } = introTiming;
  const below = scene.height + 22;
  if (elapsed < surface) return below + (ground - below) * smoothTurn(introProgress(elapsed, reveal, surface));

  const progress = introProgress(elapsed, surface, settle);
  const lift = progress * .36 + progress ** 2 * .64;
  const bounce = Math.sin(introProgress(elapsed, settle - 170, settle) * Math.PI * 2) * 5;
  return ground + (scene.intro.panelTop - ground) * lift - bounce;
}

function paintApple(ctx, x, y, scale, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#175828";
  ctx.fill(appleFruit);
  ctx.fillStyle = "#145f69";
  ctx.fill(appleLeaf);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(1, -16, -3, -20);
  ctx.strokeStyle = "#765733";
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.stroke();
  disk(ctx, "#6ca871", -7, -3, 4);
  ctx.restore();
}

function heldApplePosition(mouth) {
  return { x: mouth.x + mouth.facing * 3, y: mouth.y + 9 * mouth.scale, scale: mouth.scale * .66 };
}

function paintHeldApple(ctx, mouth) {
  const apple = heldApplePosition(mouth);
  paintApple(ctx, apple.x, apple.y, apple.scale, mouth.facing * .16);
}

function introFlight(scene, ground, launchX, landing, landingGround, scale, jump) {
  const { width, height, gutter, band } = scene;
  const crest = band ? .45 : .42;
  const skid = band ? Math.min(12, width * .025) : Math.min(15, gutter * .065);
  const touchdownX = landing.x - skid;
  const sideX = band ?
    launchX + (touchdownX - launchX) * .48 :
    Math.min(touchdownX - 10, width - gutter - 12);
  const rise = introProgress(jump, 0, crest);
  const fall = introProgress(jump, crest, 1);

  // Keep the forward speed continuous at the crest, then carry it into the landing.
  const riseDistance = sideX - launchX;
  const fallDistance = touchdownX - sideX;
  const crestSlope = fallDistance * crest / ((1 - crest) * riseDistance);
  const riseTravel = rise + (1 - crestSlope) * rise * (1 - rise);
  const x = fall > 0 ? sideX + fallDistance * fall : launchX + riseDistance * riseTravel;

  const leaveY = terrainHeight(launchX, ground);
  const touchdownY = terrainHeight(touchdownX, landingGround);
  const lift = band ? Math.min(171, height * .26) : height * .415;
  const naturalApex = Math.max(73 * scale, (leaveY + touchdownY) / 2 - lift);
  const crestTime = introTiming.jump + crest * (introTiming.land - introTiming.jump);
  const apex = band ? naturalApex : Math.min(naturalApex, introCardTop(scene, ground, crestTime) - 46);
  const y = fall > 0 ?
    apex + (touchdownY - apex) * fall ** 1.45 :
    leaveY + (apex - leaveY) * Math.sin(rise * Math.PI / 2);
  return { x, y, crest, touchdownX };
}

function paintIntroAction(ctx, scene, elapsed, driftY) {
  const { width, height, gutter, band, intro } = scene;
  const ground = introGround(scene);
  const scale = band ? Math.min(1.17, width / 340) : 1.39;
  const appleX = width * (band ? .57 : .49);
  const appleGround = terrainHeight(appleX, ground);
  const grabX = appleX - scale * 47;
  const startX = grabX - (band ? Math.min(175, width * .26) : Math.min(335, width * .23));
  const approach = introProgress(elapsed, 0, introTiming.arrive);
  const walked = approach + approach * approach * (1 - approach);
  const approachX = startX + (grabX - startX) * walked;
  const spot = smoothTurn(introProgress(elapsed, 1740, introTiming.pickup));
  const pickup = smoothTurn(introProgress(elapsed, introTiming.pickup, introTiming.pickup + 145));
  const headDrop = spot * (22 - pickup * 13);
  const stride = (approachX - startX) * Math.PI / (scale * 28);
  const cardTop = introCardTop(scene, ground, elapsed);
  const normalStart = band ? 0 : width - gutter;
  const normalWidth = band ? width : gutter;
  const baseRoute = foxRoute(normalStart, normalWidth, 0);
  const routePhase = 1120 + baseRoute.duration * (Math.PI - (band ? .58 : .76));
  const landing = foxRoute(normalStart, normalWidth, routePhase);
  const landingGround = band ? band - 24 : height * .82 + driftY * .14;
  const jump = introProgress(elapsed, introTiming.jump, introTiming.land);
  let mouth;

  if (pickup === 1) {
    intro.handoff = { time: intro.startedAt + introTiming.resume, phase: routePhase };
  }

  if (elapsed >= introTiming.reveal) {
    const uncovered = smoothTurn(introProgress(elapsed, introTiming.jump + 100, introTiming.settle + 220));
    const aboveSoil = Math.max(0, ground - cardTop + 9);
    const belowSoil = Math.max(0, height - ground + 60) * uncovered;
    intro.positionCard(cardTop, aboveSoil + belowSoil);
  }

  if (jump === 0) {
    const standing = smoothTurn(introProgress(elapsed, introTiming.arrive - 155, introTiming.arrive + 40));
    const crouch = smoothTurn(introProgress(elapsed, introTiming.jump - 110, introTiming.jump));
    mouth = drawFox(ctx, approachX, ground, scale, stride, {
      torso: 1, breadth: 0, head: 1, headDepth: 0, tail: 1, lookBack: 0,
      headDrop, stance: standing, crouch: Math.max(spot * (1 - pickup) * .5, crouch * .72)
    });
  } else if (jump < 1) {
    const flight = introFlight(scene, ground, grabX, landing, landingGround, scale, jump);
    const leap = Math.sin(Math.PI * jump);
    const spring = smoothTurn(introProgress(jump, 0, .16)) * (1 - smoothTurn(introProgress(jump, .36, .63)));
    const tuck = smoothTurn(introProgress(jump, .11, .31)) * (1 - smoothTurn(introProgress(jump, .57, .86)));
    const dive = smoothTurn(introProgress(jump, flight.crest - .065, .94));
    const jumpScale = scale + (landing.scale - scale) * smoothTurn(jump);
    mouth = drawFox(ctx, flight.x, flight.y, jumpScale, stride, {
      torso: 1, breadth: leap * .26, head: 1, headDepth: 0, tail: 1, lookBack: 0,
      headDrop: 9 * (1 - jump) + 5 * dive, stance: 1, flatGround: true,
      crouch: .72 * (1 - smoothTurn(jump * 8)), airborne: leap, spring, tuck, dive
    });
  } else if (elapsed < introTiming.resume) {
    const absorb = introProgress(elapsed, introTiming.land, introTiming.resume);
    const touchdown = introFlight(scene, ground, grabX, landing, landingGround, scale, 1);
    const roll = 1 - (1 - absorb) ** 3;
    const x = touchdown.touchdownX + (landing.x - touchdown.touchdownX) * roll;
    mouth = drawFox(ctx, x, landingGround, landing.scale, stride, {
      torso: 1, breadth: 0, head: 1, headDepth: 0, tail: 1, lookBack: 0,
      headDrop: 5 * (1 - absorb), stance: 1,
      crouch: Math.sin(absorb * Math.PI) * .68, dive: 1 - smoothTurn(absorb)
    });
  } else {
    const phase = routePhase + elapsed - introTiming.resume;
    mouth = walkFox(ctx, normalStart, normalWidth, landingGround, phase);
  }

  if (pickup === 1 && mouth) {
    paintHeldApple(ctx, mouth);
  } else {
    const centerY = appleGround - 15 * 1.12;
    paintApple(ctx,
      appleX + ((mouth?.x ?? appleX) + 3 - appleX) * pickup,
      centerY + ((mouth?.y ?? centerY) + 9 * scale - centerY) * pickup,
      1.12 + (scale * .66 - 1.12) * pickup, pickup * .16);
  }

  const burst = introProgress(elapsed, introTiming.surface, introTiming.surface + 560);
  if (burst > 0 && burst < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - burst;
    for (let index = 0; index < 12; index++) {
      const direction = index % 2 === 0 ? 1 : -1;
      const dx = (20 + index * 6) * direction * burst;
      const dy = -(28 + index * 4) * Math.sin(Math.PI * burst);
      disk(ctx, "#818181", appleX + dx, appleGround + dy, 2.4);
    }
    ctx.restore();
  }
}
