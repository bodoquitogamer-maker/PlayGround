import * as THREE from '../vendor/three.module.js';
import { TAU, rand, makeFloorTexture, makeGlowSprite, makeNeonTexture } from './assets.js';
import { addBar, addLounge, addDanceFloor, addPool, addFirepit, addPlants, addElevator } from './props.js';

const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...options });

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function addDeck(parent) {
  const floorMat = new THREE.MeshStandardMaterial({
    map: makeFloorTexture(),
    color: 0xd2c6d8,
    roughness: 0.34,
    metalness: 0.42,
    envMapIntensity: 0.85,
  });
  floorMat.map.wrapS = THREE.RepeatWrapping;
  floorMat.map.wrapT = THREE.RepeatWrapping;
  floorMat.map.repeat.set(6, 4.5);
  const floor = box(37.4, 0.5, 27.4, floorMat);
  floor.position.y = -0.25;
  floor.receiveShadow = true;
  parent.add(floor);

  const trimMat = new THREE.MeshBasicMaterial({ color: 0xff4f78, transparent: true, opacity: 0.64 });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xf4c68f, transparent: true, opacity: 0.15 });
  for (const z of [-13.72, 13.72]) {
    const strip = box(37.5, 0.025, 0.04, trimMat);
    strip.position.set(0, 0.015, z);
    parent.add(strip);
  }
  for (const x of [-18.72, 18.72]) {
    const strip = box(0.04, 0.025, 27.5, trimMat);
    strip.position.set(x, 0.015, 0);
    parent.add(strip);
  }
  for (const x of [-11.2, 0, 11.2]) {
    const inlay = box(0.018, 0.008, 26.9, goldMat);
    inlay.position.set(x, 0.016, 0);
    parent.add(inlay);
  }
  const centerRing = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 2.64, 64),
    new THREE.MeshBasicMaterial({ color: 0x9f7a57, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
  );
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.set(0, 0.018, 2.0);
  parent.add(centerRing);

  // Glass guardrail, split into panels for depth.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x8cb6cf,
    transparent: true,
    opacity: 0.075,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const postMat = mat(0x17131b, { metalness: 0.75, roughness: 0.3 });
  const capMat = mat(0x9c7a4e, { metalness: 0.75, roughness: 0.32 });

  const sides = [
    { x: 0, z: 13.78, length: 37.5, rot: 0 },
    { x: -18.78, z: 0, length: 27.5, rot: Math.PI / 2 },
    { x: 18.78, z: 0, length: 27.5, rot: Math.PI / 2 },
  ];
  for (const side of sides) {
    const panels = Math.floor(side.length / 2.85);
    for (let i = 0; i < panels; i += 1) {
      const offset = -side.length / 2 + 1.45 + i * 2.85;
      const glass = box(2.65, 1.08, 0.025, glassMat);
      if (side.rot === 0) glass.position.set(offset, 0.56, side.z);
      else glass.position.set(side.x, 0.56, offset);
      glass.rotation.y = side.rot;
      parent.add(glass);
    }
    for (let i = 0; i <= panels; i += 1) {
      const offset = -side.length / 2 + i * 2.85;
      const post = box(0.075, 1.22, 0.075, postMat);
      if (side.rot === 0) post.position.set(offset, 0.61, side.z);
      else post.position.set(side.x, 0.61, offset);
      parent.add(post);
      const cap = box(0.1, 0.035, 0.1, capMat);
      cap.position.copy(post.position);
      cap.position.y = 1.24;
      parent.add(cap);
    }
    const rail = box(side.length, 0.035, 0.05, capMat);
    if (side.rot === 0) rail.position.set(0, 1.12, side.z);
    else {
      rail.rotation.y = Math.PI / 2;
      rail.position.set(side.x, 1.12, 0);
    }
    parent.add(rail);
  }

  // Rear architectural wall with vertical fins.
  const wall = box(12.5, 5.1, 0.45, mat(0x0d0a12, { roughness: 0.45, metalness: 0.22 }));
  wall.position.set(0, 2.55, -13.45);
  wall.receiveShadow = true;
  parent.add(wall);
  const finMat = mat(0x1a141d, { metalness: 0.45, roughness: 0.5 });
  for (let i = 0; i < 8; i += 1) {
    const fin = box(0.16, 4.9, 0.7, finMat);
    fin.position.set(-10.9 + i * 3.1, 2.55, -13.18);
    parent.add(fin);
  }
  const wallGlow = box(12.3, 0.04, 0.04, new THREE.MeshBasicMaterial({ color: 0xff4f78, transparent: true, opacity: 0.4 }));
  wallGlow.position.set(0, 0.06, -13.0);
  parent.add(wallGlow);

  // Greenery softening the rear wall.
  const ivyMat = mat(0x143b2f, { roughness: 0.9 });
  for (let i = 0; i < 26; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(rand(0.18, 0.4), 7, 5), ivyMat);
    leaf.scale.set(rand(0.6, 1.3), rand(0.35, 0.8), 0.3);
    leaf.position.set(rand(-11.8, 11.8), rand(2.7, 4.9), -13.0);
    parent.add(leaf);
  }

  // Low parapets on the open rear corners.
  for (const side of [-1, 1]) {
    const parapet = box(5.5, 0.9, 0.4, mat(0x0e0b13, { roughness: 0.65 }));
    parapet.position.set(side * 15.2, 0.45, -13.4);
    parent.add(parapet);
    const cap = box(5.7, 0.06, 0.5, capMat);
    cap.position.set(side * 15.2, 0.93, -13.4);
    parent.add(cap);
  }

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({
      map: makeNeonTexture('SKYLINE', '#f4c68f', { size: 110 }),
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sign.position.set(-15.15, 2.1, -13.16);
  parent.add(sign);
}

function addPergola(parent) {
  const group = new THREE.Group();
  const beamMat = mat(0x19141c, { metalness: 0.55, roughness: 0.42 });
  const posts = [
    [-13.9, -10.3], [-4.9, -10.3], [-13.9, -4.9], [-4.9, -4.9],
    [4.7, -5.3], [12.0, -5.3],
  ];
  for (const [x, z] of posts) {
    const post = box(0.12, 4.5, 0.12, beamMat);
    post.position.set(x, 2.25, z);
    group.add(post);
  }
  for (const z of [-10.3, -4.9]) {
    const beam = box(9.2, 0.12, 0.12, beamMat);
    beam.position.set(-9.4, 4.45, z);
    group.add(beam);
    const glow = box(9.0, 0.025, 0.035, new THREE.MeshBasicMaterial({ color: 0xff4f78, transparent: true, opacity: 0.22 }));
    glow.position.set(-9.4, 4.39, z);
    group.add(glow);
  }
  const loungeBeam = box(7.6, 0.12, 0.12, beamMat);
  loungeBeam.position.set(8.35, 4.35, -5.3);
  group.add(loungeBeam);
  const loungeGlow = box(7.4, 0.025, 0.035, new THREE.MeshBasicMaterial({ color: 0x7fe8df, transparent: true, opacity: 0.18 }));
  loungeGlow.position.set(8.35, 4.29, -5.3);
  group.add(loungeGlow);

  parent.add(group);
}

function addStringLights(parent) {
  const bulbs = [];
  const lineMat = new THREE.LineBasicMaterial({ color: 0x7c5e48, transparent: true, opacity: 0.4 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffc588 });
  const runs = [
    { a: [-13.7, 4.2, -10.2], b: [-5.1, 4.2, -10.2], sag: 0.62, y: 4.2 },
    { a: [-13.7, 4.2, -5.0], b: [-5.1, 4.2, -5.0], sag: 0.52, y: 4.2 },
    { a: [4.9, 4.2, -5.2], b: [12.0, 4.2, -5.2], sag: 0.6, y: 4.2 },
    { a: [-17.8, 4.0, 9.6], b: [-3.2, 4.0, 9.6], sag: 0.85, y: 4.0 },
    { a: [2.3, 4.0, 9.6], b: [17.8, 4.0, 9.6], sag: 0.8, y: 4.0 },
  ];
  for (let r = 0; r < runs.length; r += 1) {
    const { a, b, sag, y } = runs[r];
    const count = 20;
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(a[0], b[0], t);
      const z = THREE.MathUtils.lerp(a[2], b[2], t);
      const py = y - Math.sin(t * Math.PI) * sag;
      points.push(new THREE.Vector3(x, py, z));
      if (i > 0 && i < count && i % 2 === 0) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 4), bulbMat);
        bulb.position.set(x, py - 0.045, z);
        parent.add(bulb);
        const glow = makeGlowSprite(0xffb56f, 0.42, 0.32);
        glow.position.copy(bulb.position);
        parent.add(glow);
        bulbs.push({ glow, phase: Math.random() * TAU, base: 0.26 });
      }
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    parent.add(new THREE.Line(geometry, lineMat));
  }
  return {
    update(time) {
      bulbs.forEach((bulb) => {
        bulb.glow.material.opacity = bulb.base + Math.sin(time * 1.3 + bulb.phase) * 0.07;
      });
    },
  };
}

function addLights(parent) {
  const hemi = new THREE.HemisphereLight(0x8c90c8, 0x3b1724, 1.12);
  parent.add(hemi);
  const ambient = new THREE.AmbientLight(0x4b3b57, 0.55);
  parent.add(ambient);

  const moon = new THREE.DirectionalLight(0xaec4ff, 1.85);
  moon.position.set(-13, 21, 15);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 55;
  moon.shadow.camera.left = -18;
  moon.shadow.camera.right = 18;
  moon.shadow.camera.top = 18;
  moon.shadow.camera.bottom = -18;
  moon.shadow.bias = -0.0008;
  parent.add(moon);

  const fill = new THREE.DirectionalLight(0xff8a9d, 0.33);
  fill.position.set(12, 9, -10);
  parent.add(fill);

  const pink = new THREE.PointLight(0xff3d6e, 46, 22, 2);
  pink.position.set(-1.2, 4.2, -2.0);
  parent.add(pink);
  const cyan = new THREE.PointLight(0x4fe1dc, 34, 18, 2);
  cyan.position.set(9.5, 3.2, 4.0);
  parent.add(cyan);
  const barLight = new THREE.PointLight(0xffb06f, 32, 17, 2);
  barLight.position.set(-9.0, 3.4, -6.0);
  parent.add(barLight);
  const loungeLight = new THREE.PointLight(0xff8a68, 22, 12, 2);
  loungeLight.position.set(9.2, 2.4, -2.0);
  parent.add(loungeLight);
  const elevatorLight = new THREE.PointLight(0xff4f78, 13, 9, 2);
  elevatorLight.position.set(0, 3.8, -10.2);
  parent.add(elevatorLight);

  // A warm foreground key that keeps faces and tailoring legible at phone size.
  const key = new THREE.PointLight(0xffd2b3, 32, 26, 2);
  key.position.set(2.5, 6.2, 10.5);
  parent.add(key);
  const rim = new THREE.PointLight(0x9b7bff, 24, 18, 2);
  rim.position.set(-9.5, 5.2, 7.5);
  parent.add(rim);

  return { pink, cyan, barLight, loungeLight, key };
}

function addAtmosphere(parent) {
  const glowTexture = makeGlowSprite(0xffffff, 1, 1).material.map;
  const count = 150;
  const positions = new Float32Array(count * 3);
  const phases = [];
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = rand(-18, 18);
    positions[i * 3 + 1] = rand(0.3, 6.0);
    positions[i * 3 + 2] = rand(-12, 12);
    phases.push({ speed: rand(0.06, 0.2), sway: rand(0.2, 0.7), phase: Math.random() * TAU });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: glowTexture,
    color: 0xffc9a1,
    size: 0.09,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  parent.add(points);
  return {
    update(time, dt) {
      const array = geometry.attributes.position.array;
      for (let i = 0; i < count; i += 1) {
        const info = phases[i];
        array[i * 3 + 1] += info.speed * dt;
        array[i * 3] += Math.sin(time * 0.4 + info.phase) * info.sway * dt;
        if (array[i * 3 + 1] > 6.4) array[i * 3 + 1] = 0.15;
        if (array[i * 3] > 19) array[i * 3] = -19;
        if (array[i * 3] < -19) array[i * 3] = 19;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

export function createRooftop(scene) {
  const group = new THREE.Group();
  group.name = 'rooftop';
  scene.add(group);

  addDeck(group);
  addPergola(group);
  const lights = addLights(group);

  const props = [];
  props.push(addBar(group));
  props.push(addLounge(group));
  props.push(addDanceFloor(group));
  props.push(addPool(group));
  props.push(addFirepit(group));
  const plantObstacles = addPlants(group);
  props.push(addElevator(group));

  const strings = addStringLights(group);
  const atmosphere = addAtmosphere(group);

  const obstacles = [
    ...props.flatMap((prop) => prop.obstacles || []),
    ...plantObstacles,
  ];

  return {
    group,
    obstacles,
    elevator: new THREE.Vector3(0, 0, -11.2),
    update(time, dt) {
      props.forEach((prop) => prop.update?.(time, dt));
      strings.update(time);
      atmosphere.update(time, dt);
      lights.pink.intensity = 43 + Math.sin(time * 1.65) * 5;
      lights.cyan.intensity = 32 + Math.sin(time * 1.1 + 1.7) * 4;
      lights.barLight.intensity = 30 + Math.sin(time * 2.7) * 2;
    },
  };
}
