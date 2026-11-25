"use strict";

const calmMotion = matchMedia("(prefers-reduced-motion: reduce)");
const paper = "#f5f5f3";

function fillShape(ctx, fill, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function disk(ctx, fill, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function verticalFade(ctx, top, bottom, stops) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  return gradient;
}

function drawFigure(ctx, x, y, height, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(height / 60, height / 60);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#232323";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-3, -20);
  ctx.lineTo(-6, -2);
  ctx.lineTo(-10, 0);
  ctx.moveTo(4, -20);
  ctx.lineTo(5, -2);
  ctx.lineTo(10, 0);
  ctx.stroke();

  const sway = Math.sin(time * .0018) * 4;
  fillShape(ctx, "#202020", [[-7, -46], [3, -48], [8, -38], [11, -17], [1, -14], [-12 - sway, -16], [-9, -31]]);
  fillShape(ctx, "#3e3e3e", [[-7, -45], [-3, -37], [-5, -19], [-12 - sway, -16], [-9, -31]]);
  disk(ctx, "#292929", 0, -52, 7);
  fillShape(ctx, "#d6d6d4", [[4, -55], [8, -52], [8, -48], [3, -47], [2, -51]]);
  fillShape(ctx, "#bcbcb9", [[-4, -44], [4, -43], [5, -39], [-7, -40], [-15 - sway, -34], [-17 - sway, -38]]);
  ctx.beginPath();
  ctx.moveTo(4, -37);
  ctx.lineTo(9, -31);
  ctx.lineTo(15, -32);
  ctx.stroke();
  disk(ctx, "#f7f7f5", 16, -32, 2);
  ctx.restore();
}

function drawMist(ctx, w, h, time, depth, color = "245,245,243") {
  const mist = ctx.createRadialGradient(w * .59, h * .6, 0, w * .59, h * .6, w * .52);
  mist.addColorStop(0, "rgba(" + color + ", .84)");
  mist.addColorStop(.55, "rgba(" + color + ", .32)");
  mist.addColorStop(1, "rgba(" + color + ", 0)");
  ctx.save();
  ctx.translate(Math.sin(time * .00029) * w * .11, depth * .3 + h * .40);
  ctx.scale(1, .45);
  ctx.fillStyle = mist;
  ctx.fillRect(-w * .25, -h * .35, w * 1.5, h * 1.7);
  ctx.restore();
}

function station(ctx, w, h, x, y, time, showFigure = true) {
  const unit = Math.min(w, h);
  if (showFigure) disk(ctx, "#dfdfdc", w * .68 + x * .15, h * .30 + y * .13, unit * .20);

  ctx.save();
  ctx.translate(x * .28, y * .40);
  const distant = verticalFade(ctx, h * .32, h * .75, [[0, "#90908e"], [1, paper]]);
  fillShape(ctx, distant, [[w * .05, h * .82], [w * .19, h * .54], [w * .35, h * .46], [w * .41, h * .72], [w * .83, h * .48], [w, h * .62], [w, h * .88]]);
  ctx.restore();

  ctx.save();
  ctx.translate(x * .7, y * .55);
  const face = verticalFade(ctx, h * .24, h * .80, [[0, "#111"], [.64, "#242424"], [1, "#959593"]]);
  const side = verticalFade(ctx, h * .2, h * .8, [[0, "#383838"], [.63, "#4d4d4d"], [1, "#c3c3bf"]]);
  fillShape(ctx, side, [[w * .56, h * .14], [w * .73, h * .23], [w * .83, h * .81], [w * .62, h * .74]]);
  fillShape(ctx, face, [[w * .39, h * .26], [w * .56, h * .14], [w * .62, h * .74], [w * .27, h * .81]]);
  fillShape(ctx, "#a3a3a0", [[w * .515, h * .20], [w * .523, h * .195], [w * .538, h * .63], [w * .532, h * .658]]);
  fillShape(ctx, "#3d3d3d", [[w * .85, h * .41], [w * .9, h * .49], [w * .98, h * .79], [w * .78, h * .79]]);
  fillShape(ctx, "#606060", [[w * .21, h * .52], [w * .27, h * .46], [w * .30, h * .78], [w * .12, h * .80]]);
  ctx.restore();

  drawMist(ctx, w, h, time, y);
  ctx.save();
  ctx.translate(x, y * .38);
  const ground = verticalFade(ctx, h * .67, h * .95, [[0, "#606060"], [.35, "#8e8e8b"], [1, "rgba(245,245,243,0)"]]);
  fillShape(ctx, ground, [[-w * .15, h * .92], [w * .47, h * .79], [w * .68, h * .72], [w * .78, h * .73], [w * 1.15, h * .60], [w * 1.15, h * 1.10], [-w * .15, h * 1.10]]);
  if (showFigure) drawFigure(ctx, w * .696, h * .723, unit * .105, time);
  ctx.restore();

  for (let index = 0; index < 16; index++) {
    const drift = time * (.000009 + index * .0000003);
    const px = (index * .383 + drift) % 1;
    const py = .32 + (index * .121 % .42) + Math.sin(index * 3 + time * .00065) * .032;
    disk(ctx, index % 3 ? "#f5f5f3a8" : "#55555550", px * w, py * h, index % 3 ? 1.1 : 1.55);
  }
}

function passage(ctx, w, h, x, y, time) {
  const opening = Math.max(0, Math.min(w * .075, y * .68));
  const distance = verticalFade(ctx, h * .06, h * .88, [[0, "#777775"], [.54, "#a5a5a2"], [1, paper]]);
  const foreground = verticalFade(ctx, 0, h * .96, [[0, "#131313"], [.48, "#373737"], [1, paper]]);
  ctx.save();
  ctx.translate(-opening * .5, y * .35);
  fillShape(ctx, distance, [[-w * .1, 0], [w * .42, 0], [w * .29, h * .25], [w * .35, h * .59], [w * .46, h * .93], [0, h * .91]]);
  ctx.translate(opening, 0);
  fillShape(ctx, distance, [[w * .70, 0], [w * 1.12, 0], [w * 1.12, h], [w * .60, h * .96], [w * .73, h * .55], [w * .66, h * .22]]);
  ctx.restore();
  ctx.save();
  ctx.translate(-opening, y * .44);
  fillShape(ctx, foreground, [[-w * .12, -h * .25], [w * .28, -h * .25], [w * .20, h * .22], [w * .13, h * .39], [w * .168, h * .71], [w * .32, h * 1.05], [-w * .12, h * 1.05]]);
  ctx.translate(opening * 2, 0);
  fillShape(ctx, foreground, [[w * .83, -h * .25], [w * 1.18, -h * .25], [w * 1.18, h * 1.1], [w * .73, h * 1.1], [w * .86, h * .66], [w * .91, h * .44]]);
  ctx.restore();
  drawMist(ctx, w, h, time, y);
  const fade = verticalFade(ctx, h * .57, h, [[0, "rgba(245,245,243,0)"], [1, paper]]);
  ctx.fillStyle = fade;
  ctx.fillRect(0, h * .57, w, h * .43);
}

function horizon(ctx, w, h, x, y, time) {
  const radius = Math.min(w, h) * .19;
  const moonX = w * .67 + x * .16;
  const moonY = h * .47 + y * .23;
  disk(ctx, "#c7c7c5", moonX, moonY, radius);
  ctx.save();
  ctx.translate(x * .4, y * .38);
  fillShape(ctx, "#363636", [[-w * .12, h * .89], [w * .37, h * .71], [w * .53, h * .68], [w * .69, h * .74], [w * .86, h * .50], [w * 1.12, h * .56], [w * 1.12, h * 1.1], [-w * .12, h * 1.1]]);
  drawMist(ctx, w, h, time, y, "125,125,125");
  fillShape(ctx, "#191919", [[-w * .12, h * .94], [w * .47, h * .82], [w * .62, h * .84], [w * .90, h * .71], [w * 1.12, h * .76], [w * 1.12, h * 1.1], [-w * .12, h * 1.1]]);
  ctx.restore();
}

function pine(ctx, x, ground, height, width, sway, tone, seed) {
  const top = ground - height;
  const shade = value => "rgb(" + value + "," + value + "," + value + ")";
  const trunk = width * .103;
  fillShape(ctx, shade(tone + 11), [
    [x - trunk / 2, ground], [x + trunk / 2, ground], [x + trunk * .27, top + height * .38],
    [x + sway, top], [x - trunk * .28, top + height * .54]
  ]);

  // Wide, overlapping boughs taper toward the flexible crown.
  for (let tier = 10; tier >= 0; tier--) {
    const t = tier / 10;
    const at = top + height * (.04 + t * .72);
    const bend = x + sway * (1 - t) ** 2;
    const reach = width * (.052 + .49 * Math.pow(t, .83));
    const drop = height * (.067 + .046 * t);
    const shadeOffset = Math.round(Math.sin(seed * 3 + tier * 1.83) * 8);
    for (const side of [-1, 1]) {
      const branchLength = reach * (1 + .19 * Math.sin(seed + tier * 2.2 + side * 2));
      ctx.save();
      ctx.translate(bend, at + Math.sin(seed * 5 + tier * 2.65 + side) * height * .012);
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(-branchLength * .12, -drop);
      ctx.bezierCurveTo(branchLength * .27, -drop * .63, branchLength * .57, drop * .34, branchLength, drop * .42);
      ctx.lineTo(branchLength * .84, drop * .55);
      ctx.lineTo(branchLength * 1.02, drop * .73);
      ctx.lineTo(branchLength * .74, drop * .66);
      ctx.lineTo(branchLength * .85, drop * .91);
      ctx.lineTo(branchLength * .56, drop * .75);
      ctx.lineTo(branchLength * .62, drop);
      ctx.quadraticCurveTo(branchLength * .26, drop * 1.04, -branchLength * .15, drop * .82);
      ctx.closePath();
      ctx.fillStyle = shade(tone + shadeOffset + (side === -1 ? 0 : 10));
      ctx.fill();
      ctx.restore();
    }
  }
}

function skyBody(ctx, x, y, radius, skyWidth, daylight) {
  if (daylight > .5) {
    const rise = 2 * (1 - daylight);
    x += rise * (skyWidth - x + radius * 1.35);
    y += rise * radius * .95;
    disk(ctx, "#a26425", x, y, radius * .72);
    ctx.strokeStyle = "#b4752e";
    ctx.lineWidth = Math.max(2, radius * .13);
    ctx.beginPath();
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      ctx.moveTo(x + dx * .93, y + dy * .93);
      ctx.lineTo(x + dx * 1.21, y + dy * 1.21);
    }
    ctx.stroke();
  } else {
    const departure = daylight * 2;
    x -= departure * (x + radius * 1.15);
    y -= departure * radius * .8;
    const hornAngle = Math.acos(.31);
    const hornX = x + radius * .31;
    const lowerHorn = y + Math.sin(hornAngle) * radius;
    ctx.beginPath();
    ctx.arc(x, y, radius, hornAngle, Math.PI * 2 - hornAngle);
    ctx.bezierCurveTo(x - radius * .56, y - radius * .62, x - radius * .55, y + radius * .60, hornX, lowerHorn);
    ctx.closePath();
    ctx.fillStyle = "#ababab";
    ctx.fill();
  }
}

function forestStrip(ctx, width, height, phase, swayX, swayY, daylight, panorama = false) {
  const ground = height * .77;
  if (daylight !== null) {
    const sun = daylight > .5;
    const x = panorama && sun ? Math.min(width * .82, width - 126) : width * (panorama ? .18 : .52);
    const y = height * (panorama ? .16 : .21);
    const radius = Math.min(width * .20, height * (panorama ? .10 : .13));
    skyBody(ctx, x, y, radius, width, daylight);
  }

  for (let layer = 0; layer < 3; layer++) {
    const base = ground + (layer - 1) * height * .082 + swayY * (.15 + layer * .13);
    const close = layer === 2 && width < height * .65;
    const step = close ? width * .67 : Math.max(62, width / (5.1 - layer * 1.05));
    const tone = [178, 118, 58][layer];
    for (let index = -1; index <= Math.ceil(width / step); index++) {
      const seed = index * 2.83 + layer * 2.05;
      const local = .5 + .5 * Math.sin(seed * 1.97);
      const x = step * (index + .37 * layer + local * .19) + swayX * (.14 + layer * .21);
      const treeHeight = height * (.29 + local * .26 + layer * .046);
      const treeWidth = Math.max(treeHeight * .30, Math.min(treeHeight * 1.35, step * (close ? .92 + .22 * local : 1.25 + .43 * local)));
      const wind = Math.sin(phase * .00115 + seed) * (7 + layer * 5);
      pine(ctx, x, base, treeHeight, treeWidth, wind, tone, seed);
    }
  }

  const fade = verticalFade(ctx, height * .55, height, [
    [0, "rgba(245,245,245,0)"], [.46, "rgba(245,245,245,.33)"], [1, "#f5f5f5"]
  ]);
  ctx.fillStyle = fade;
  ctx.fillRect(0, height * .55, width, height * .45);
  for (let index = 0; index < 15; index++) {
    const x = width * ((index * .371 + phase * .000014) % 1);
    const y = height * (.38 + (index * .217 % .52)) + Math.sin(phase * .00135 + index) * 9;
    disk(ctx, index % 3 ? "#dddddd" : "#aaaaaa", x, y, 2.2);
  }
}

const foxTail = new Path2D("M 6 -3 C -8 -6 -16 -21 -34 -17 Q -50 -15 -56 7 Q -38 16 -23 10 Q -10 7 6 -3 Z");
const foxTailTip = new Path2D("M -38 -16 Q -50 -14 -56 7 Q -47 12 -37 12 L -40 7 L -33 3 L -38 0 L -34 -7 Z");
const foxTailRidge = new Path2D("M -36 -16 Q -22 -19 -13 -12 Q -8 -8 1 -5 Q -15 -9 -23 -8 Z");
const foxLegs = [
  { hip: -18, side: -1, phase: Math.PI, rear: true },
  { hip: 19, side: -1, phase: .7, rear: false },
  { hip: -18, side: 1, phase: 0, rear: true },
  { hip: 19, side: 1, phase: Math.PI + .7, rear: false }
];

function terrainHeight(x, base) {
  return base + Math.sin(x * .011) * 4 + Math.sin(x * .029 + 1.4) * 2;
}

function foxEye(ctx, x, y, facing, petting) {
  ctx.beginPath();
  ctx.ellipse(x, y, 3, 3 - petting * 2.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#63281c";
  ctx.fill();
  if (petting < .72) disk(ctx, paper, x + facing, y - .5, 1.65 * (1 - petting));
}

function foxHead(ctx, shoulder, facing, turnDepth, lookBack, headDrop, headTilt, petting) {
  const neckX = shoulder + facing * (9 + 5 * lookBack);
  const neckY = -43 + lookBack * 6 + headDrop;
  ctx.beginPath();
  ctx.moveTo(shoulder - 9, -29);
  ctx.quadraticCurveTo(shoulder - 8, -44, neckX - 10, neckY - 5);
  ctx.lineTo(neckX + 10, neckY - 5);
  ctx.quadraticCurveTo(shoulder + 9, -33, shoulder + 8, -24);
  ctx.quadraticCurveTo(shoulder, -19, shoulder - 9, -29);
  ctx.fillStyle = "#9b321a";
  ctx.fill();

  ctx.save();
  ctx.translate(neckX, neckY);
  ctx.rotate(headTilt);
  const nose = facing * 21;
  const muzzleY = 5 + lookBack * 3;
  const cheekWidth = 12 + 3 * turnDepth;
  ctx.beginPath();
  ctx.ellipse(0, -4, cheekWidth, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#b84921";
  ctx.fill();

  for (const side of [-1, 1]) {
    const base = side * (5 + 6 * turnDepth) - 3 * facing;
    const lean = side * (2 + turnDepth * 3) - facing * 5;
    const height = side === 1 ? -29 : -26;
    fillShape(ctx, "#a1381e", [[base - 5,-8], [base + lean,height], [base + 6,-10]]);
    fillShape(ctx, "#5b2922", [[base - 1,-13], [base + lean,height + 5], [base + 3,-13]]);
  }

  ctx.beginPath();
  ctx.moveTo(-cheekWidth, -3);
  ctx.quadraticCurveTo(0, 3, nose, muzzleY - 2);
  ctx.quadraticCurveTo(nose + facing * 2.4, muzzleY + 2, nose, muzzleY + 3);
  ctx.quadraticCurveTo(0, 14 + turnDepth * 2, -cheekWidth * .8, 5);
  ctx.closePath();
  ctx.fillStyle = "#4a4ab1";
  ctx.fill();

  const eyeX = facing * 6 + turnDepth * 5;
  foxEye(ctx, eyeX, -4.5, facing, petting);
  if (turnDepth > .42) {
    ctx.save();
    ctx.globalAlpha = smoothTurn((turnDepth - .42) / .33);
    foxEye(ctx, facing * 6 - turnDepth * 6, -4, facing, petting);
    ctx.restore();
  }
  disk(ctx, "#606060", nose, muzzleY, 2.7);
  ctx.restore();
  return {
    x: neckX + nose * Math.cos(headTilt) - muzzleY * Math.sin(headTilt),
    y: neckY + nose * Math.sin(headTilt) + muzzleY * Math.cos(headTilt)
  };
}

function drawFox(ctx, x, baseline, scale, stride, pose) {
  const {
    torso, breadth, head, headDepth, tail, lookBack, headDrop = 0,
    stance = 0, crouch = 0, flatGround = false, airborne = 0, dive = 0,
    spring = 0, tuck = 0, petting = 0, wag = 0, run = 0
  } = pose;
  const ground = flatGround ? baseline : terrainHeight(x, baseline);
  const bob = Math.cos(stride * 2) * (2.3 + run * 3.5) * (1 - stance) - breadth * 3.1 - crouch * 5;
  const reach = Math.sin(stride);
  const pitch = (-.61 * spring - .24 * tuck + .54 * dive + .12 * petting) * torso;
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const alongBody = (px, py) => [px * cos - (py + 28) * sin, px * sin + (py + 28) * cos - 28];
  ctx.save();
  ctx.translate(x, ground - bob * scale);
  ctx.scale(scale, scale);

  ctx.save();
  ctx.translate(...alongBody(-24 * torso, -28 + reach * 1.7));
  const wagAngle = petting * (.19 + Math.sin(wag * .023) * .29);
  ctx.rotate((.15 + Math.sin(stride * .57 - .4) * .23 - spring * .76 - tuck * .38 + dive * .55 + wagAngle) * tail + pitch * .35);
  ctx.scale(tail, 1);
  ctx.fillStyle = "#9b321a";
  ctx.fill(foxTail);
  ctx.fillStyle = "#b84921";
  ctx.fill(foxTailRidge);
  ctx.fillStyle = "#4a4ab1";
  ctx.fill(foxTailTip);
  ctx.restore();

  for (const leg of foxLegs) {
    const step = stride + leg.phase;
    const shoulderY = -25 + (leg.rear ? reach : -reach) * 2 * (1 - stance);
    const [hip, hipY] = alongBody(leg.hip * torso + leg.side * breadth * 10, shoulderY);
    const bound = leg.rear ? -13 * spring + 7 * tuck + 9 * dive :
      12 * spring + (19 + leg.side * 3) * tuck + (20 + leg.side * 4) * dive;
    const foot = hip + Math.sin(step) * (torso * (13 + run * 12) + leg.side * breadth * 8) * (1 - stance) + bound * torso;
    const swing = Math.max(0, Math.cos(step)) ** 1.35 * (12 + run * 9) * (1 - stance);
    const lift = leg.rear ? swing + 20 * tuck + (18 + 8 * airborne) * dive + 5 * airborne :
      (swing + 20 * spring + 29 * tuck + 8 * airborne) * (1 - dive);
    const footGround = flatGround ? ground : terrainHeight(x + foot * scale, baseline);
    const sole = bob + (footGround - ground) / scale - lift;
    const joint = (hip + foot) / 2 + (leg.rear ? -4 - 8 * spring : 3 + 13 * tuck) * torso;
    const jointY = (hipY + sole) / 2 - 4 * tuck;
    const toe = torso * 3.4;
    ctx.beginPath();
    ctx.moveTo(hip - 5, hipY);
    ctx.quadraticCurveTo(joint - 4, jointY, foot - 3, sole - 5);
    ctx.lineTo(foot - 4 + toe, sole);
    ctx.lineTo(foot + 4 + toe, sole);
    ctx.quadraticCurveTo(foot + 3, sole - 8, joint + 3, jointY + 4);
    ctx.lineTo(hip + 5, hipY);
    ctx.closePath();
    ctx.fillStyle = leg.side < 0 ? "#63281c" : "#9b321a";
    ctx.fill();
    fillShape(ctx, "#4a241e", [[foot - 3, sole - 5], [foot + 3, sole - 5], [foot + 4 + toe, sole], [foot - 4 + toe, sole]]);
  }

  const shoulder = 17 * torso + breadth * 2;
  const hip = -19 * torso;
  const bodyWidth = Math.hypot(30 * torso, 15 * breadth);
  ctx.save();
  ctx.translate(...alongBody((shoulder + hip) / 2, -28));
  ctx.rotate(reach * .043 * (1 - stance) * torso + pitch);
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyWidth, 10 + breadth * 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#b84921";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(torso * -4, 2, bodyWidth * .78, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#9b321a";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, -28);
  ctx.rotate(pitch);
  ctx.translate(0, 28);
  const mouth = foxHead(ctx, shoulder, head, headDepth, lookBack, headDrop, -.52 * pitch + .17 * dive + .12 * petting * head, petting);
  ctx.restore();
  ctx.restore();
  const [mouthX, mouthY] = alongBody(mouth.x, mouth.y);
  return { x: x + mouthX * scale, y: ground + (mouthY - bob) * scale, scale, facing: head, bodyX: x, ground, tail };
}

function traceForestGround(ctx, start, end, ground) {
  ctx.moveTo(start, terrainHeight(start, ground));
  for (let x = start + 8; x < end; x += 8) ctx.lineTo(x, terrainHeight(x, ground));
  ctx.lineTo(end, terrainHeight(end, ground));
}

function clipForestAboveGround(ctx, start, width, ground) {
  if (width <= 0) return;
  const end = start + width;
  ctx.beginPath();
  traceForestGround(ctx, start, end, ground);
  ctx.lineTo(end, 0);
  ctx.lineTo(start, 0);
  ctx.closePath();
  ctx.clip();
}

function forestFloor(ctx, start, width, ground, depth) {
  const end = start + width;
  ctx.beginPath();
  traceForestGround(ctx, start, end, ground);
  ctx.strokeStyle = "#363636";
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.lineTo(end, ground + depth);
  ctx.lineTo(start, ground + depth);
  ctx.closePath();
  ctx.fillStyle = verticalFade(ctx, ground, ground + depth, [
    [0, "#777777"], [.30, "#adadad"], [1, paper]
  ]);
  ctx.fill();

  for (let index = 0; index < Math.ceil(width / 12); index++) {
    const x = start + width * ((index * .389) % 1);
    const y = terrainHeight(x, ground);
    ctx.fillStyle = index % 3 === 0 ? "#888888" : "#bebebe";
    ctx.fillRect(x, y + 7 + (index * 7 % Math.max(8, depth - 12)), 4 + (index * 13 % 18), 2.5);
  }
}

function smoothTurn(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

function foxRoute(start, width, phase) {
  const scale = Math.min(1.42, Math.max(.1, (width - 34) / 168));
  const distance = Math.max(0, width / 2 - scale * 83 - 6);
  const duration = Math.max(2400, distance / .038);
  const cycle = (phase - 1120) / duration - Math.PI / 2;
  const x = start + width / 2 + Math.sin(cycle) * distance;
  return { x, scale, distance, duration, cycle };
}

function walkFox(ctx, start, width, ground, phase, pet = null, shift = 0, transition = null) {
  if (width <= 12) return;
  const { x, scale, distance, duration, cycle } = foxRoute(start, width, phase);
  const direction = Math.cos(cycle) >= 0 ? 1 : -1;
  const halfCycles = Math.floor((cycle + Math.PI / 2) / Math.PI);
  const walked = (halfCycles * 2 + 1 + direction * Math.sin(cycle)) * distance;
  const turnIndex = Math.round((cycle + Math.PI / 2) / Math.PI);
  const edge = turnIndex * Math.PI - Math.PI / 2;
  const turnHalf = 1000 / duration;
  const progress = Math.max(0, Math.min(1, (cycle - edge + turnHalf) / (turnHalf * 2)));
  const from = Math.sign(Math.sin(edge));

  // Lead with the head, then step the shoulders and hindquarters around.
  const headAngle = Math.PI * smoothTurn((progress - .04) / .49);
  const bodyAngle = Math.PI * smoothTurn((progress - .36) / .61);
  const tailAngle = Math.PI * smoothTurn((progress - .45) / .55);
  const stride = walked * Math.PI / (scale * 24) + (turnIndex + smoothTurn((progress - .30) / .70)) * Math.PI * 2;
  const petting = pet?.amount ?? 0;
  const pose = {
    torso: from * Math.cos(bodyAngle),
    breadth: Math.sin(bodyAngle),
    head: from * Math.cos(headAngle),
    headDepth: Math.sin(headAngle),
    tail: from * Math.cos(tailAngle),
    lookBack: Math.max(0, Math.sin((headAngle - bodyAngle) / 2)),
    headDrop: petting * 17,
    stance: petting,
    crouch: petting * .72,
    petting,
    wag: pet?.age ?? 0
  };
  const frame = transition?.(x + shift, stride, pose) ?? { x: x + shift, stride, pose };
  return drawFox(ctx, frame.x, ground, scale, frame.stride, frame.pose);
}

function paintBackdropFox(ctx, start, width, ground, phase, hasApple, pet, apple, time, viewportWidth) {
  if (apple) return paintAppleGame(ctx, apple, { start, width, ground, viewportWidth }, phase, pet, time);
  const fox = walkFox(ctx, start, width, ground, phase, pet);
  if (!fox) return null;
  if (hasApple) paintHeldApple(ctx, fox);
  if (pet) paintFoxPetParticles(ctx, fox, pet);
  return fox;
}

function forestGround(height, band, drift) {
  return band ? band - 24 : height * (.82 + .065 / 2) + drift * .14;
}

function backdrop(ctx, w, h, x, y, time, gutter, band, daylight, ground, panorama = false) {
  const sideGround = band ? forestGround(h, 0, y) : ground;
  const strips = panorama ? [[0, w, .035, x]] : [[0, gutter, .13, -x], [w - gutter, gutter, .04, x]];
  for (const [start, width, offset, shift] of strips) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(start, 0, width, h);
    ctx.clip();
    ctx.save();
    clipForestAboveGround(ctx, start, width, sideGround);
    ctx.translate(start, h * offset);
    const showsSkyBody = panorama ? !band : (start === 0) === (daylight <= .5);
    forestStrip(ctx, Math.max(width, 47), h, time, shift, y, showsSkyBody ? daylight : null, panorama);
    ctx.restore();
    forestFloor(ctx, start, width, sideGround, Math.min(100, h * .13));
    ctx.restore();
  }

  if (band) {
    const top = 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, w, band - 4);
    ctx.clip();
    ctx.fillStyle = paper;
    ctx.fillRect(0, top, w, band);
    ctx.save();
    clipForestAboveGround(ctx, 0, w, ground);
    ctx.translate(0, top - 6);
    forestStrip(ctx, w, band + 36, time, x, 0, daylight, true);
    ctx.restore();
    forestFloor(ctx, 0, w, ground, 29);
    ctx.restore();
  }
}

const asciiRamp = " .,:;-=+*#%@";
const nightInks = [[167, 175, 173], [242, 140, 87], [255, 222, 177], [255, 43, 56], [161, 203, 91]];
const dayInks = [[73, 77, 76], [155, 51, 22], [117, 81, 60], [211, 9, 32], [65, 110, 36]];

function sizeAsciiGrid(scene) {
  const { context, ascii, width, height } = scene;
  const fontSize = width <= 650 ? 7.5 : 8.5;
  ascii.font = fontSize + 'px Consolas, "Courier New", monospace';
  context.font = ascii.font;
  context.textBaseline = "middle";
  ascii.cellWidth = context.measureText("@").width;
  ascii.cellHeight = fontSize * 1.09;
  ascii.sample.width = Math.max(1, Math.ceil(width / ascii.cellWidth));
  ascii.sample.height = Math.max(1, Math.ceil(height / ascii.cellHeight));
  ascii.context.setTransform(1 / ascii.cellWidth, 0, 0, 1 / ascii.cellHeight, 0, 0);
}

function clearAsciiSample(ascii) {
  const { sample, context, cellWidth, cellHeight } = ascii;
  context.fillStyle = paper;
  context.fillRect(0, 0, sample.width * cellWidth, sample.height * cellHeight);
}

function renderAscii(context, ascii, daylight, width, gutter, band = 0) {
  const { sample, context: sampleContext, cellWidth, cellHeight } = ascii;
  const columns = sample.width;
  const rows = sample.height;
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  const leftColumns = Math.min(columns, Math.ceil(gutter / cellWidth));
  const rightColumn = Math.max(leftColumns, Math.floor((width - gutter) / cellWidth));
  const inks = nightInks.map((rgb, index) => {
    const mixed = rgb.map((value, channel) => Math.round(value + (dayInks[index][channel] - value) * daylight));
    return "rgb(" + mixed.join(",") + ")";
  });
  const fonts = inks.map((_, layer) => layer === 0 ? ascii.font : "700 " + ascii.font);
  const glyphsByInk = inks.map(() => "");

  function writeRow(row, first, last) {
    const isPaper = col => {
      const offset = (row * columns + col) * 4;
      return pixels[offset] === 245 && pixels[offset + 1] === 245 && pixels[offset + 2] === 243;
    };
    while (first < last && isPaper(first)) first++;
    while (last > first && isPaper(last - 1)) last--;
    if (first === last) return;
    glyphsByInk.fill("");
    for (let col = first; col < last; col++) {
      const offset = (row * columns + col) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      // Distinct sample colors keep the apple red, its leaf green and the fox orange.
      const produce = green - red > 24;
      const inkType = produce ? (green - blue > 20 ? 3 : 4) : blue - red > 25 ? 2 : red - green > 22 ? 1 : 0;
      const shade = inkType === 2 ? (green + red) / 2 - 35 : inkType === 1 ? green - 14 : red;
      const ink = Math.max(0, (245 - shade) / 245);
      const dither = (((col * 17 + row * 23) ^ (col * row * 3)) & 15) / 22 - .33;
      const index = Math.max(0, Math.min(asciiRamp.length - 1, Math.round(ink * (asciiRamp.length - 1) + dither)));
      for (let layer = 0; layer < inks.length; layer++) {
        glyphsByInk[layer] += layer === inkType ? asciiRamp[index] : " ";
      }
    }
    for (let layer = 0; layer < inks.length; layer++) {
      if (!glyphsByInk[layer].trim()) continue;
      context.fillStyle = inks[layer];
      context.font = fonts[layer];
      context.fillText(glyphsByInk[layer], first * cellWidth, (row + .5) * cellHeight);
    }
  }

  for (let row = 0; row < rows; row++) {
    const top = row * cellHeight;
    if (band && top < band) {
      writeRow(row, 0, columns);
    } else {
      writeRow(row, 0, leftColumns);
      writeRow(row, rightColumn, columns);
    }
  }
}

function paintAsciiBackdrop(scene, y, time, paintForest) {
  const { context, ascii, width, height, x, gutter, band, intro, pet, apple } = scene;
  const root = document.documentElement;
  const elapsed = intro?.elapsed(time) ?? null;
  const handoff = intro?.handoff;
  const foxPhase = handoff ? handoff.phase + Math.max(0, time - handoff.time) : time;
  const interaction = elapsed === null ? pet : null;
  if (interaction) updateFoxPet(interaction, time);
  const phase = elapsed === null ? Math.max(0, foxPhase - (interaction?.delay ?? 0)) : null;

  const game = elapsed === null ? apple : null;
  const panorama = scene.canvas.hasAttribute("data-panorama");
  const fullWidth = panorama || elapsed !== null;
  const foreground = scene.foreground;
  if (foreground) {
    foreground.context.clearRect(0, 0, width, height);
    clearAsciiSample(foreground.ascii);
  }
  // Reuse the forest frame between character updates. The foreground stays
  // on the same clock and canvas through the switch to the walking loop.
  const ground = forestGround(height, band, y);
  const refreshForest = paintForest || scene.lastIntroFrame !== (elapsed !== null) || !foreground;
  if (refreshForest) {
    const interpolated = parseFloat(getComputedStyle(root).getPropertyValue("--forest-daylight"));
    scene.daylight = Number.isFinite(interpolated) ? interpolated : Number(root.dataset.theme === "light");
    context.clearRect(0, 0, width, height);
    clearAsciiSample(ascii);
    backdrop(ascii.context, width, height, x, y, time, gutter, band, scene.daylight, ground, panorama);
    if (elapsed !== null) paintIntroForest(ascii.context, scene, scene.daylight, time, elapsed);
    if (foreground) renderAscii(context, ascii, scene.daylight, width, fullWidth ? 0 : gutter, fullWidth ? height : band);
  }
  scene.lastIntroFrame = elapsed !== null;

  if (elapsed !== null) {
    paintIntroAction(foreground.ascii.context, scene, elapsed, y);
    renderAscii(foreground.context, foreground.ascii, scene.daylight, width, 0, height);
    return;
  }

  const fox = paintBackdropFox(foreground?.ascii.context ?? ascii.context, band ? 0 : width - gutter,
    band ? width : gutter, ground, phase, Boolean(handoff), interaction, game, time, width);
  if (refreshForest) {
    if (pet) positionFoxPetTarget(scene, foxAppleBusy(game) ? null : fox);
    if (apple) positionFoxAppleTarget(scene, fox);
  }
  if (foreground) renderAscii(foreground.context, foreground.ascii, scene.daylight, width, 0, height);
  else renderAscii(context, ascii, scene.daylight, width, fullWidth ? 0 : gutter, fullWidth ? height : band);
}

const paintings = { station, passage, horizon };
const animatedScenes = [];
let frameId = null;
let lastPaint = -Infinity;

function paint(scene, time, paintForest = true) {
  const { canvas, context, width, height } = scene;
  if (!width || !height) return;
  let verticalShift = 0;
  if (calmMotion.matches) {
    scene.x = scene.y = 0;
  } else {
    if (canvas.dataset.scene === "backdrop") {
      verticalShift = -Math.min(scrollY * .075, 65);
    } else {
      const bounds = canvas.getBoundingClientRect();
      const viewportCenter = innerHeight * .5;
      const progress = (viewportCenter - (bounds.top + height * .5)) / innerHeight;
      verticalShift = Math.max(-1, Math.min(1, progress)) * height * .23;
    }
    scene.x += (scene.targetX - scene.x) * .12;
    scene.y += (scene.targetY - scene.y) * .12;
  }
  if (scene.ascii) {
    paintAsciiBackdrop(scene, scene.y + verticalShift, time, paintForest);
  } else {
    context.clearRect(0, 0, width, height);
    paintings[canvas.dataset.scene](context, width, height, scene.x, scene.y + verticalShift, time);
  }
}

function animateScenes(time) {
  frameId = null;
  if (document.hidden || calmMotion.matches) return;
  const visibleScenes = animatedScenes.filter(scene => scene.visible);
  const tick = time - lastPaint >= 30;
  for (const scene of visibleScenes) {
    if (tick || scene.foreground) paint(scene, time, tick);
  }
  if (tick) lastPaint = time;
  if (visibleScenes.length) frameId = requestAnimationFrame(animateScenes);
}

function refreshAnimation() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  if (calmMotion.matches) {
    for (const scene of animatedScenes) paint(scene, 0);
  } else if (!document.hidden && animatedScenes.some(scene => scene.visible)) {
    frameId = requestAnimationFrame(animateScenes);
  }
}

const sceneObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const scene = animatedScenes.find(item => item.canvas === entry.target);
    scene.visible = entry.isIntersecting;
  }
  refreshAnimation();
});

function createAsciiGrid() {
  const sample = document.createElement("canvas");
  return { sample, context: sample.getContext("2d", { alpha: false, willReadFrequently: true }) };
}

function resizeSceneCanvas(scene, ratio) {
  scene.canvas.width = Math.round(scene.width * ratio);
  scene.canvas.height = Math.round(scene.height * ratio);
  scene.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (scene.ascii) sizeAsciiGrid(scene);
}

for (const canvas of document.querySelectorAll("[data-scene]")) {
  const context = canvas.getContext("2d");
  if (!context) continue;
  const panel = canvas.dataset.scene === "backdrop" ? document.querySelector(".site-main") : null;
  const scene = { canvas, context, width: 0, height: 0, gutter: 0, band: 0, visible: false, x: 0, y: 0, targetX: 0, targetY: 0 };
  if (panel) {
    scene.ascii = createAsciiGrid();
    const petButton = document.querySelector(".fox-pet-target");
    if (petButton) scene.pet = setupFoxPet(petButton, panel, () => paint(scene, 0));
    const appleButton = document.querySelector(".fox-apple-target");
    if (appleButton) scene.apple = setupFoxApple(appleButton, () => paint(scene, 0));
    const introCanvas = document.querySelector(".forest-intro-foreground");
    const introContext = introCanvas?.getContext("2d");
    if (introContext) {
      scene.intro = setupForestIntro(panel, introCanvas);
      scene.foreground = { canvas: introCanvas, context: introContext, ascii: createAsciiGrid() };
      if (scene.intro) scene.intro.foreground = scene.foreground;
    }
    new MutationObserver(() => {
      if (calmMotion.matches || document.hidden) paint(scene, 0);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  animatedScenes.push(scene);
  new ResizeObserver(([entry]) => {
    ({ width: scene.width, height: scene.height } = entry.contentRect);
    if (panel) {
      scene.gutter = Math.max(0, (scene.width - panel.offsetWidth) / 2);
      scene.band = parseFloat(getComputedStyle(panel).getPropertyValue("--forest-band")) || 0;
    }
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    resizeSceneCanvas(scene, ratio);
    if (scene.foreground) {
      const foreground = scene.foreground;
      foreground.width = scene.width;
      foreground.height = scene.height;
      resizeSceneCanvas(foreground, ratio);
      if (scene.intro?.active) scene.intro.measureCard();
    }
    paint(scene, 0);
  }).observe(canvas);
  sceneObserver.observe(canvas);
  const pointerArea = panel ? document.body : canvas.closest(".hero");
  if (pointerArea) {
    pointerArea.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || calmMotion.matches) return;
      const bounds = (panel ? canvas : pointerArea).getBoundingClientRect();
      scene.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 44;
      scene.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 31;
    });
    pointerArea.addEventListener("pointerleave", () => { scene.targetX = scene.targetY = 0; });
  }
}

calmMotion.addEventListener("change", refreshAnimation);
document.addEventListener("visibilitychange", refreshAnimation);

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("revealed");
    revealObserver.unobserve(entry.target);
  }
}, { threshold: .25 });
for (const element of document.querySelectorAll("[data-reveal]")) revealObserver.observe(element);
