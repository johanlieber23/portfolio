"use strict";

const foxPetHeart = new Path2D("M 0 8 C -5 5 -11 1 -10 -4 C -9 -9 -3 -9 0 -4 C 3 -9 9 -9 10 -4 C 11 1 5 5 0 8 Z");

function setupFoxPet(button, panel, redraw) {
  const pet = { button, panel, hovered: false, until: 0, lastFrame: null, amount: 0, delay: 0, age: 0 };
  let releaseTimer;
  const redrawIfStill = () => {
    if (calmMotion.matches) redraw();
  };

  button.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    pet.hovered = true;
    redrawIfStill();
  });
  button.addEventListener("pointerleave", () => {
    pet.hovered = false;
    redrawIfStill();
  });
  button.addEventListener("click", () => {
    pet.until = performance.now() + 1650;
    redrawIfStill();
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(redrawIfStill, 1660);
  });
  window.addEventListener("scroll", redrawIfStill, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pet.hovered = false;
  });
  return pet;
}

function updateFoxPet(pet, time) {
  const now = time || performance.now();
  const delta = pet.lastFrame === null ? 0 : Math.max(0, Math.min(now - pet.lastFrame, 65));
  pet.lastFrame = now;
  const desired = Number(pet.hovered || now < pet.until);
  if (calmMotion.matches) {
    pet.amount = desired;
    pet.age = 0;
    return;
  }
  const change = 1 - Math.exp(-delta / (desired ? 95 : 145));
  pet.amount += (desired - pet.amount) * change;
  pet.delay += delta * Math.min(1, pet.amount * 1.6);
  pet.age += delta * pet.amount;
}

function positionFoxPetTarget(scene, fox) {
  const { pet, width, height, gutter, band } = scene;
  if (!pet) return;
  const { button } = pet;
  if (fox) {
    const { bodyX, ground, scale, tail } = fox;
    const left = Math.max(band ? 0 : width - gutter, bodyX - (37 + Math.max(0, tail) * 44) * scale);
    const right = Math.min(width, bodyX + (53 + Math.max(0, -tail) * 28) * scale);
    const top = Math.max(0, ground - 80 * scale);
    const bottom = Math.min(height, band ? pet.panel.getBoundingClientRect().top : height, ground + 9 * scale);
    if (right - left >= 18 && bottom - top >= 18) {
      button.style.transform = "translate(" + Math.round(left) + "px, " + Math.round(top) + "px)";
      button.style.width = Math.round(right - left) + "px";
      button.style.height = Math.round(bottom - top) + "px";
      button.hidden = false;
      return;
    }
  }
  button.hidden = true;
  pet.hovered = false;
}

function paintFoxPetParticles(ctx, fox, pet) {
  if (!pet || pet.amount < .06) return;
  const headX = fox.x - fox.facing * fox.scale * 20;
  const headY = fox.y - fox.scale * 28;
  for (let index = 0; index < 6; index++) {
    const life = (pet.age / 1120 + index * .18) % 1;
    const spread = 9 + life * 28;
    const x = headX + Math.sin(index * 2.4 + life * 2) * spread * fox.scale;
    const y = headY - (7 + life * 47 + (index % 2) * 4) * fox.scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = pet.amount * Math.sin(life * Math.PI);
    if (index % 2 === 0) {
      ctx.scale(.7 * fox.scale, .7 * fox.scale);
      ctx.fillStyle = "#175828";
      ctx.fill(foxPetHeart);
    } else {
      ctx.fillStyle = "#4a4ab1";
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.fillRect(-1.5, -5, 3, 10);
    }
    ctx.restore();
  }
}
