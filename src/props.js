import * as THREE from '../vendor/three.module.js';
import {
  TAU,
  rand,
  makeMarbleTexture,
  makeNeonTexture,
  makeHeartSignTexture,
  makeGlowSprite,
} from './assets.js';

const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0, ...options });

function cast(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function neonPlane(texture, width, height, color, opacity = 0.9) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    color,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

export function addBar(parent) {
  const group = new THREE.Group();
  group.name = 'bar';
  const marble = new THREE.MeshStandardMaterial({ map: makeMarbleTexture(), color: 0xc9bfc9, roughness: 0.25, metalness: 0.4 });
  const black = mat(0x0a0910, { roughness: 0.35, metalness: 0.5 });
  const brass = mat(0xc99b58, { roughness: 0.28, metalness: 0.8 });
  const leather = mat(0x4a1d2d, { roughness: 0.72 });
  const velvet = mat(0x681f38, { roughness: 0.8 });

  const backBar = box(7.4, 2.7, 0.36, black);
  backBar.position.set(-9.4, 1.42, -9.65);
  group.add(backBar);
  const backGlow = box(7.0, 0.03, 0.03, new THREE.MeshBasicMaterial({ color: 0xff4f78 }));
  backGlow.position.set(-9.4, 2.77, -9.43);
  group.add(backGlow);

  for (let shelf = 0; shelf < 3; shelf += 1) {
    const plank = box(6.6, 0.055, 0.38, black);
    plank.position.set(-9.4, 0.55 + shelf * 0.73, -9.3);
    group.add(plank);
    const shelfGlow = box(6.4, 0.008, 0.02, new THREE.MeshBasicMaterial({ color: 0xf4c68f }));
    shelfGlow.position.set(-9.4, 0.585 + shelf * 0.73, -9.08);
    shelfGlow.material.opacity = 0.5;
    group.add(shelfGlow);
    for (let i = 0; i < 9; i += 1) {
      const height = rand(0.22, 0.44);
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(rand(0.035, 0.06), rand(0.045, 0.07), height, 7),
        new THREE.MeshStandardMaterial({
          color: [0x8f4f2d, 0x2b6a54, 0xb38a43, 0x5a1f39][i % 4],
          roughness: 0.22,
          metalness: 0.08,
          transparent: true,
          opacity: 0.9,
        }),
      );
      bottle.position.set(-12.3 + i * 0.7, 0.61 + shelf * 0.73 + height / 2, -9.15);
      group.add(bottle);
    }
  }

  const counter = box(6.9, 0.16, 1.02, marble);
  counter.position.set(-9.4, 1.08, -6.95);
  group.add(counter);
  const counterBody = box(6.6, 0.94, 0.82, black);
  counterBody.position.set(-9.4, 0.58, -6.95);
  group.add(counterBody);
  const counterStrip = box(6.6, 0.025, 0.04, new THREE.MeshBasicMaterial({ color: 0xff4f78 }));
  counterStrip.position.set(-9.4, 0.94, -6.53);
  group.add(counterStrip);
  const counterGlow = makeGlowSprite(0xff4f78, 5.6, 0.12);
  counterGlow.position.set(-9.4, 0.82, -6.5);
  group.add(counterGlow);

  for (let i = 0; i < 4; i += 1) {
    const stool = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 12), velvet);
    seat.position.y = 0.67;
    stool.add(seat);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.58, 6), brass);
    stem.position.y = 0.36;
    stool.add(stem);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.035, 12), brass);
    base.position.y = 0.04;
    stool.add(base);
    stool.position.set(-12.1 + i * 1.8, 0, -5.9);
    group.add(stool);
  }

  for (let i = 0; i < 5; i += 1) {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.035, 0.16, 7, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xffbb87, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
    );
    glass.position.set(-11.4 + i * 0.9, 1.25, -7.05 + rand(-0.2, 0.2));
    group.add(glass);
  }

  const sign = neonPlane(makeNeonTexture('PULSE', '#ff4f78', { size: 150 }), 4.6, 1.15, 0xffffff, 0.95);
  sign.position.set(-9.4, 3.44, -9.43);
  group.add(sign);
  const signGlow = makeGlowSprite(0xff4f78, 8, 0.18);
  signGlow.position.set(-9.4, 3.44, -9.35);
  group.add(signGlow);

  const pendant = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.1, 4), brass);
    cord.position.set(-11.3 + i * 1.9, 4.2, -6.9);
    pendant.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 10, 1, true), mat(0x181019, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
    shade.position.set(-11.3 + i * 1.9, 3.6, -6.9);
    shade.rotation.x = Math.PI;
    pendant.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc38b }));
    bulb.position.set(-11.3 + i * 1.9, 3.53, -6.9);
    pendant.add(bulb);
    const glow = makeGlowSprite(0xffb06c, 1.2, 0.3);
    glow.position.copy(bulb.position);
    pendant.add(glow);
  }
  group.add(pendant);

  cast(group);
  parent.add(group);
  return {
    obstacles: [
      { type: 'rect', x1: -13.2, z1: -7.65, x2: -5.9, z2: -6.3 },
      { type: 'circle', x: -9.4, z: -9.65, r: 1.0 },
    ],
  };
}

export function addLounge(parent) {
  const group = new THREE.Group();
  group.name = 'lounge';
  const velvet = mat(0x1e4d49, { roughness: 0.85 });
  const velvetLight = mat(0x2b625b, { roughness: 0.78 });
  const brass = mat(0xc99b58, { roughness: 0.28, metalness: 0.78 });
  const darkWood = mat(0x1b1118, { roughness: 0.5, metalness: 0.15 });
  const marble = new THREE.MeshStandardMaterial({ map: makeMarbleTexture(), color: 0x8c7b86, roughness: 0.24, metalness: 0.35 });

  const rug = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 4.1, 0.012, 48),
    mat(0x271620, { roughness: 0.95 }),
  );
  rug.position.set(8.2, 0.013, -2.7);
  rug.scale.z = 0.76;
  group.add(rug);
  const rugRing = new THREE.Mesh(
    new THREE.RingGeometry(3.3, 3.38, 48),
    new THREE.MeshBasicMaterial({ color: 0x845839, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  rugRing.rotation.x = -Math.PI / 2;
  rugRing.position.set(8.2, 0.022, -2.7);
  rugRing.scale.y = 0.76;
  group.add(rugRing);

  const sofa = new THREE.Group();
  const base = box(4.5, 0.52, 1.45, velvet);
  base.position.y = 0.38;
  sofa.add(base);
  const back = box(4.5, 0.8, 0.3, velvet);
  back.position.set(0, 0.92, -0.58);
  sofa.add(back);
  for (const side of [-1, 1]) {
    const arm = box(0.3, 0.56, 1.45, velvetLight);
    arm.position.set(side * 2.1, 0.59, 0);
    sofa.add(arm);
  }
  for (let i = 0; i < 3; i += 1) {
    const cushion = box(1.28, 0.18, 1.12, velvetLight);
    cushion.position.set(-1.35 + i * 1.35, 0.67, 0.05);
    cushion.rotation.x = -0.04;
    sofa.add(cushion);
    const pillow = box(0.5, 0.42, 0.18, i === 1 ? mat(0x8f583a, { roughness: 0.85 }) : mat(0x183e3b, { roughness: 0.9 }));
    pillow.position.set(-1.35 + i * 1.35, 0.92, -0.38);
    pillow.rotation.z = (i - 1) * 0.12;
    sofa.add(pillow);
  }
  sofa.position.set(8.2, 0, -4.7);
  group.add(sofa);

  const chair = new THREE.Group();
  const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.62, 0.28, 18), velvet);
  chairSeat.position.y = 0.56;
  chair.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.1, 8, 20, Math.PI), velvetLight);
  chairBack.position.set(0, 0.82, -0.13);
  chairBack.rotation.set(Math.PI / 2, 0, 0);
  chair.add(chairBack);
  const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.38, 0.48, 8), brass);
  chairBase.position.y = 0.27;
  chair.add(chairBase);
  chair.position.set(11.1, 0, -1.65);
  chair.rotation.y = -2.2;
  group.add(chair);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 28), marble);
  tableTop.position.set(8.2, 0.48, -2.55);
  group.add(tableTop);
  const tableStem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 8), brass);
  tableStem.position.set(8.2, 0.24, -2.55);
  group.add(tableStem);
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.04, 16), brass);
  tableBase.position.set(8.2, 0.03, -2.55);
  group.add(tableBase);

  for (let i = 0; i < 3; i += 1) {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.16 + i * 0.05, 8), mat(0xe6d3b4, { roughness: 0.8 }));
    candle.position.set(7.8 + i * 0.38, 0.6 + i * 0.025, -2.5 + (i % 2) * 0.3);
    group.add(candle);
    const flame = makeGlowSprite(0xffa95e, 0.26, 0.6);
    flame.position.set(candle.position.x, candle.position.y + 0.15, candle.position.z);
    group.add(flame);
    const light = new THREE.PointLight(0xff9a53, 1.6, 4, 2);
    light.position.copy(flame.position);
    group.add(light);
  }

  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.2, 5), brass);
  lampPost.position.set(11.4, 1.1, -4.2);
  group.add(lampPost);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 10, 1, true), mat(0xd7b697, { roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
  lampShade.position.set(11.4, 2.2, -4.2);
  lampShade.rotation.x = Math.PI;
  group.add(lampShade);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd1a0 }));
  lampBulb.position.set(11.4, 2.1, -4.2);
  group.add(lampBulb);
  const lampGlow = makeGlowSprite(0xffb06c, 2.5, 0.26);
  lampGlow.position.copy(lampBulb.position);
  group.add(lampGlow);

  cast(group);
  parent.add(group);
  return {
    obstacles: [
      { type: 'rect', x1: 5.7, z1: -5.55, x2: 10.7, z2: -3.85 },
      { type: 'circle', x: 11.1, z: -1.65, r: 0.75 },
      { type: 'circle', x: 8.2, z: -2.55, r: 1.2 },
      { type: 'circle', x: 11.4, z: -4.2, r: 0.28 },
    ],
  };
}

export function addDanceFloor(parent) {
  const group = new THREE.Group();
  group.name = 'dance-floor';
  const cols = 8;
  const rows = 6;
  const size = 0.92;
  const gap = 0.08;
  const startX = -((cols * (size + gap)) / 2) + size / 2;
  const startZ = -5.3;
  const colors = [0x28132b, 0x1a3442, 0x3b1828, 0x48221f];
  const tileMaterials = colors.map((color) => new THREE.MeshStandardMaterial({
    color: 0x0a0910,
    emissive: color,
    emissiveIntensity: 0.38,
    roughness: 0.28,
    metalness: 0.32,
  }));
  const tiles = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const chosen = (row * 3 + col * 2) % tileMaterials.length;
      const tile = box(size, 0.06, size, tileMaterials[chosen]);
      tile.position.set(startX + col * (size + gap), 0.032, startZ + row * (size + gap) + 2.7);
      group.add(tile);
      tiles.push({ mesh: tile, material: tileMaterials[chosen], phase: Math.random() * TAU, base: 0.22 + Math.random() * 0.18 });
    }
  }
  const edge = box(cols * (size + gap) + 0.16, 0.035, rows * (size + gap) + 0.16, new THREE.MeshBasicMaterial({ color: 0xff4f78, transparent: true, opacity: 0.22 }));
  edge.position.set(0, 0.012, startZ + 2.7 + (rows * (size + gap) - size) / 2);
  group.add(edge);
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(5.2, 5.28, 4),
    new THREE.MeshBasicMaterial({ color: 0xff4f78, transparent: true, opacity: 0.13, side: THREE.DoubleSide }),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.rotation.z = Math.PI / 4;
  rim.position.set(0, 0.01, -0.06);
  group.add(rim);

  // Two soft beams to give the floor a club pulse.
  for (const side of [-1, 1]) {
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 8, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: side < 0 ? 0xff416b : 0x48d9dd,
        transparent: true,
        opacity: 0.018,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.set(side * 3.1, 4.1, -0.1);
    beam.rotation.z = side * 0.28;
    group.add(beam);
  }

  parent.add(group);
  return {
    update(time) {
      for (let i = 0; i < tiles.length; i += 1) {
        const tile = tiles[i];
        const wave = Math.sin(time * 1.9 + tile.phase + (i % cols) * 0.42 + Math.floor(i / cols) * 0.33);
        tile.material.emissiveIntensity = tile.base + Math.max(0, wave) * 0.58;
      }
      rim.material.opacity = 0.09 + (Math.sin(time * 1.4) + 1) * 0.035;
    },
  };
}

export function addPool(parent) {
  const group = new THREE.Group();
  group.name = 'pool';
  const marble = new THREE.MeshStandardMaterial({ map: makeMarbleTexture(), color: 0xb9b3bb, roughness: 0.3, metalness: 0.28 });
  const frame = box(7.7, 0.18, 5.1, marble);
  frame.position.set(10.4, 0.09, 5.9);
  group.add(frame);
  const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#052b40') },
      uShallow: { value: new THREE.Color('#0b7787') },
      uGlow: { value: new THREE.Color('#6ff3e2') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uGlow;
      varying vec2 vUv;
      void main() {
        float w1 = sin(vUv.x * 34.0 + uTime * 1.4) * 0.5 + 0.5;
        float w2 = cos(vUv.y * 21.0 - uTime * 1.1) * 0.5 + 0.5;
        float wave = w1 * w2;
        vec3 col = mix(uDeep, uShallow, wave * 0.55 + 0.2);
        float shimmer = pow(max(0.0, sin(vUv.x * 55.0 + uTime * 0.7) * cos(vUv.y * 42.0 - uTime * 0.5)), 18.0);
        col += uGlow * shimmer * 0.45;
        gl_FragColor = vec4(col, 0.82);
      }
    `,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 4.5), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(10.4, 0.195, 5.9);
  group.add(water);
  for (const side of [-1, 1]) {
    const strip = box(7.3, 0.03, 0.035, new THREE.MeshBasicMaterial({ color: 0x6ff3e2 }));
    strip.position.set(10.4, 0.205, 5.9 + side * 2.38);
    group.add(strip);
    const strip2 = box(0.035, 0.03, 4.6, new THREE.MeshBasicMaterial({ color: 0x6ff3e2 }));
    strip2.position.set(10.4 + side * 3.68, 0.205, 5.9);
    group.add(strip2);
  }
  const poolGlow = makeGlowSprite(0x43e6dc, 7, 0.17);
  poolGlow.position.set(10.4, 0.35, 5.9);
  group.add(poolGlow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.11, 7, 18), mat(0xff8c65, { roughness: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(9.1, 0.29, 5.6);
  group.add(ring);

  // Steps and a towel ledge.
  for (let i = 0; i < 2; i += 1) {
    const step = box(2.0, 0.12, 0.48, marble);
    step.position.set(6.85, 0.06 + i * 0.1, 4.4 + i * 0.44);
    group.add(step);
  }
  const towels = box(0.8, 0.12, 1.3, mat(0xd6c4b6, { roughness: 0.95 }));
  towels.position.set(13.9, 0.25, 4.15);
  towels.rotation.y = 0.2;
  group.add(towels);

  parent.add(group);
  return {
    obstacles: [{ type: 'rect', x1: 6.55, z1: 3.25, x2: 14.1, z2: 8.6 }],
    update(time) { waterMaterial.uniforms.uTime.value = time; },
  };
}

export function addFirepit(parent) {
  const group = new THREE.Group();
  group.name = 'firepit';
  const concrete = mat(0x2b262d, { roughness: 0.72 });
  const metal = mat(0x1a171d, { roughness: 0.34, metalness: 0.55 });
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8b4b, transparent: true, opacity: 0.85 });
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.42, 0.46, 24), concrete);
  pit.position.set(-7.2, 0.23, 5.9);
  group.add(pit);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.17, 0.08, 8, 24), metal);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-7.2, 0.48, 5.9);
  group.add(rim);
  const coals = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.05, 18), new THREE.MeshBasicMaterial({ color: 0xff562f }));
  coals.position.set(-7.2, 0.48, 5.9);
  group.add(coals);

  const flames = [];
  for (let i = 0; i < 8; i += 1) {
    const sprite = makeGlowSprite(i % 3 === 0 ? 0xffc26c : 0xff5f3d, rand(0.6, 1.3), rand(0.35, 0.7));
    sprite.position.set(-7.2 + rand(-0.55, 0.55), 0.7 + rand(0, 0.35), 5.9 + rand(-0.45, 0.45));
    group.add(sprite);
    flames.push({ sprite, baseY: sprite.position.y, phase: Math.random() * TAU, baseScale: sprite.scale.x });
  }
  const fireLight = new THREE.PointLight(0xff6b35, 12, 13, 2);
  fireLight.position.set(-7.2, 1.2, 5.9);
  fireLight.castShadow = false;
  group.add(fireLight);

  for (let i = 0; i < 3; i += 1) {
    const angle = -0.4 + i * 1.75;
    const chairGroup = new THREE.Group();
    const seat = box(1.7, 0.3, 1.1, mat(0x4b2926, { roughness: 0.9 }));
    seat.position.y = 0.52;
    chairGroup.add(seat);
    const back = box(1.7, 0.62, 0.22, mat(0x3d201f, { roughness: 0.92 }));
    back.position.set(0, 0.86, -0.5);
    chairGroup.add(back);
    const legs = box(1.5, 0.4, 0.85, metal);
    legs.position.y = 0.24;
    chairGroup.add(legs);
    chairGroup.position.set(-7.2 + Math.sin(angle) * 2.7, 0, 5.9 + Math.cos(angle) * 2.7);
    chairGroup.rotation.y = angle + Math.PI;
    group.add(chairGroup);
  }

  parent.add(group);
  return {
    obstacles: [
      { type: 'circle', x: -7.2, z: 5.9, r: 1.55 },
      { type: 'circle', x: -9.0, z: 7.2, r: 0.8 },
      { type: 'circle', x: -4.9, z: 6.9, r: 0.8 },
    ],
    update(time) {
      fireLight.intensity = 10 + Math.sin(time * 9.1) * 2.4 + Math.sin(time * 15.7) * 1.2;
      flames.forEach((flame, index) => {
        const flicker = 0.75 + Math.sin(time * (7 + index * 0.4) + flame.phase) * 0.22;
        flame.sprite.scale.setScalar(flame.baseScale * flicker);
        flame.sprite.position.y = flame.baseY + Math.sin(time * (2.5 + index * 0.2) + flame.phase) * 0.08;
      });
    },
  };
}

function plant(parent, x, z, scale = 1, color = 0x1d4d36) {
  const group = new THREE.Group();
  const potMat = mat(0x282227, { roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.32 * scale, 0.7 * scale, 10), potMat);
  pot.position.y = 0.35 * scale;
  group.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scale, 0.085 * scale, 1.4 * scale, 6), mat(0x50352a, { roughness: 0.9 }));
  trunk.position.y = 1.3 * scale;
  group.add(trunk);
  const leafMat = mat(color, { roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 8, 5), leafMat);
    leaf.scale.set(1.3, 0.16, 0.55);
    const angle = (i / 8) * TAU + rand(-0.2, 0.2);
    leaf.position.set(Math.sin(angle) * 0.62 * scale, (1.7 + rand(0, 0.7)) * scale, Math.cos(angle) * 0.62 * scale);
    leaf.rotation.set(rand(-0.5, 0.5), angle, rand(-0.35, 0.35));
    group.add(leaf);
  }
  group.position.set(x, 0, z);
  parent.add(group);
  return { type: 'circle', x, z, r: 0.55 * scale };
}

export function addPlants(parent) {
  const spots = [
    [-16.0, -8.4, 1.08, 0x24543b],
    [16.4, -8.0, 1.2, 0x1a4033],
    [-16.2, 10.7, 0.92, 0x2e5835],
    [16.1, 10.4, 1.05, 0x204d3d],
    [14.4, 2.0, 0.72, 0x2a583d],
    [-4.5, -9.5, 0.72, 0x1b4738],
  ];
  return spots.map(([x, z, scale, color]) => plant(parent, x, z, scale, color));
}

export function addElevator(parent) {
  const group = new THREE.Group();
  group.name = 'elevator';
  const frameMat = mat(0x8c6a3f, { metalness: 0.72, roughness: 0.28 });
  const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x050509, metalness: 0.72, roughness: 0.16, reflectivity: 1 });
  const structure = box(3.5, 3.15, 0.7, mat(0x0c0a12, { roughness: 0.6 }));
  structure.position.set(0, 1.58, -12.35);
  group.add(structure);
  for (const side of [-1, 1]) {
    const post = box(0.1, 3.25, 0.2, frameMat);
    post.position.set(side * 1.48, 1.63, -11.96);
    group.add(post);
    const door = box(1.36, 2.5, 0.08, doorMat);
    door.position.set(side * 0.69, 1.26, -11.94);
    group.add(door);
    const handle = box(0.025, 0.8, 0.05, frameMat);
    handle.position.set(side * 0.08, 1.28, -11.87);
    group.add(handle);
  }
  const header = box(3.2, 0.12, 0.16, frameMat);
  header.position.set(0, 2.62, -11.96);
  group.add(header);
  const strip = box(3.05, 0.045, 0.05, new THREE.MeshBasicMaterial({ color: 0xff4f78 }));
  strip.position.set(0, 2.73, -11.87);
  group.add(strip);
  const stripGlow = makeGlowSprite(0xff4f78, 4.8, 0.17);
  stripGlow.position.set(0, 2.7, -11.7);
  group.add(stripGlow);

  const signTexture = makeHeartSignTexture();
  const sign = neonPlane(signTexture, 2.7, 2.7, 0xffffff, 0.96);
  sign.position.set(0, 4.5, -11.85);
  group.add(sign);
  const signGlow = makeGlowSprite(0xff4f78, 6.2, 0.16);
  signGlow.position.set(0, 4.5, -11.7);
  group.add(signGlow);

  const smallLabel = neonPlane(makeNeonTexture('PENTHOUSE', '#f4c68f', { size: 92 }), 2.9, 0.72, 0xffffff, 0.65);
  smallLabel.position.set(0, 3.25, -11.84);
  group.add(smallLabel);

  parent.add(group);
  return { obstacles: [{ type: 'rect', x1: -1.8, z1: -12.8, x2: 1.8, z2: -11.8 }] };
}
