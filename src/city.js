import * as THREE from '../vendor/three.module.js';
import {
  TAU,
  clamp,
  rand,
  makeSkyMaterial,
  makeWindowTexture,
  makeGlowTexture,
  makeNeonTexture,
  makeGlowSprite,
} from './assets.js';

function createEnvironment(renderer) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x07060d);
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(30, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0x100b1d, side: THREE.BackSide }),
  );
  envScene.add(room);

  const panels = [
    { pos: [-12, 4, -8], scale: [14, 5], color: 0xff335f, intensity: 2.4 },
    { pos: [14, 7, 2], scale: [10, 3], color: 0x2ec9db, intensity: 1.9 },
    { pos: [0, 12, 15], scale: [20, 2], color: 0xf4c68f, intensity: 1.4 },
    { pos: [-6, -2, 17], scale: [12, 6], color: 0x7b3cff, intensity: 0.9 },
  ];
  for (const panel of panels) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(panel.scale[0], panel.scale[1]),
      new THREE.MeshBasicMaterial({ color: panel.color, side: THREE.DoubleSide }),
    );
    mesh.position.set(...panel.pos);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(panel.scale[0] * 2.5, panel.scale[1] * 2.5),
      new THREE.MeshBasicMaterial({ color: panel.color, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }),
    );
    glow.position.copy(mesh.position);
    glow.quaternion.copy(mesh.quaternion);
    envScene.add(glow);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(envScene, 0.06);
  pmrem.dispose();
  return target.texture;
}

export function createCity(scene, renderer) {
  scene.fog = new THREE.FogExp2(0x080611, 0.0095);
  scene.environment = createEnvironment(renderer);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(210, 32, 18), makeSkyMaterial());
  sky.renderOrder = -10;
  scene.add(sky);

  const glowTexture = makeGlowTexture();

  // Stars, two layers for depth.
  for (const [count, size, opacity] of [[760, 0.42, 0.56], [90, 1.3, 0.7]]) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * TAU;
      const phi = Math.acos(rand(0.05, 1));
      const radius = 160 + Math.random() * 18;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      map: glowTexture,
      color: 0xcfd8ff,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geometry, material);
    stars.renderOrder = -9;
    scene.add(stars);
  }

  const moon = makeGlowSprite(0xdbe8ff, 25, 0.55);
  moon.position.set(-76, 64, -126);
  scene.add(moon);
  const moonCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xf1f3ff }),
  );
  moonCore.position.copy(moon.position);
  scene.add(moonCore);

  const windowTexture = makeWindowTexture();
  const city = new THREE.Group();
  const signMaterials = [];
  const buildingData = [];
  const count = 86;
  const baseY = -38;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * TAU + rand(-0.07, 0.07);
    const radius = rand(67, 180);
    const width = rand(3.4, 9.4);
    const depth = rand(3.8, 11);
    const landmark = i % 23 === 0;
    const height = (landmark ? rand(52, 78) : rand(15, 47)) * (radius > 115 ? 1.12 : 1);
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const texture = windowTexture.clone();
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, Math.round(width / 5)), Math.max(1, Math.round(height / 8)));
    const palette = [0x6f7898, 0x8f7568, 0x66788f, 0x806f9c, 0x96776b][i % 5];
    const mat = new THREE.MeshStandardMaterial({
      color: palette,
      map: texture,
      emissiveMap: texture,
      emissive: 0xffffff,
      emissiveIntensity: landmark ? 0.44 : 0.34,
      roughness: 0.9,
      metalness: 0.06,
      fog: true,
    });
    const rotation = rand(-0.22, 0.22);
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    building.position.set(x, baseY + height / 2, z);
    building.rotation.y = rotation;
    city.add(building);

    let top = baseY + height;
    // Stepped crowns break up the skyline silhouette.
    if (Math.random() > 0.32) {
      const tierHeight = rand(2.5, 10);
      const tier = new THREE.Mesh(
        new THREE.BoxGeometry(width * rand(0.48, 0.76), tierHeight, depth * rand(0.48, 0.76)),
        mat,
      );
      tier.position.set(x + rand(-0.4, 0.4), top + tierHeight / 2, z + rand(-0.4, 0.4));
      tier.rotation.y = rotation;
      city.add(tier);
      top += tierHeight;
    }
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.8, 0.22, depth * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x10111b, roughness: 0.8 }),
    );
    cap.position.set(x, top + 0.08, z);
    cap.rotation.y = rotation;
    city.add(cap);

    if (height > 31 && Math.random() > 0.36) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.1, rand(2, 7), 5),
        new THREE.MeshStandardMaterial({ color: 0x1b1d29, metalness: 0.6, roughness: 0.4 }),
      );
      antenna.position.set(x, top + 2.5, z);
      city.add(antenna);
      const light = makeGlowSprite(0xff2c4d, 2.2, 0.8);
      light.position.set(x, top + 5, z);
      city.add(light);
    }
    if (radius < 105) buildingData.push({ x, z, width, angle, radius, top });
  }

  // Colored haze along the horizon gives the skyline some depth.
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * TAU + 0.4;
    const haze = makeGlowSprite(i % 2 ? 0x5a71ff : 0xff3d6e, rand(55, 95), 0.055);
    haze.position.set(Math.sin(angle) * 135, rand(-3, 4), Math.cos(angle) * 135);
    city.add(haze);
  }

  // A few distant rooftop billboards.
  const messages = [
    ['NOIR', '#ff4f78'],
    ['SKY', '#7fe8df'],
    ['HOTEL', '#f4c68f'],
    ['LIVE', '#9b6bff'],
    ['VICE', '#ff6f61'],
  ];
  buildingData.slice(0, 9).forEach((data, index) => {
    if (index > messages.length - 1) return;
    const [text, color] = messages[index];
    const texture = makeNeonTexture(text, color, { size: 130 });
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    signMaterials.push(material);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), material);
    const face = data.angle + Math.PI;
    sign.position.set(
      Math.sin(data.angle) * (data.radius - data.width / 2 - 0.8),
      clamp(data.top - 4 + index * 0.8, 2, 28),
      Math.cos(data.angle) * (data.radius - data.width / 2 - 0.8),
    );
    sign.rotation.y = face;
    city.add(sign);
  });

  scene.add(city);

  // A low atmospheric ribbon of traffic-like lights.
  const trafficPositions = [];
  for (let i = 0; i < 150; i += 1) {
    const angle = Math.random() * TAU;
    const radius = rand(24, 90);
    trafficPositions.push(Math.sin(angle) * radius, -18 + Math.random() * 1.8, Math.cos(angle) * radius);
  }
  const trafficGeometry = new THREE.BufferGeometry();
  trafficGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trafficPositions, 3));
  const traffic = new THREE.Points(
    trafficGeometry,
    new THREE.PointsMaterial({
      color: 0xffd7aa,
      size: 0.45,
      map: glowTexture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(traffic);

  return {
    update(time) {
      signMaterials.forEach((material, index) => {
        material.opacity = 0.68 + Math.sin(time * (1.1 + index * 0.09) + index * 2.3) * 0.14;
      });
      moon.material.opacity = 0.5 + Math.sin(time * 0.28) * 0.06;
    },
  };
}
