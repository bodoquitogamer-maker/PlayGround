import * as THREE from '../vendor/three.module.js';
import { createCity } from './city.js';
import { createRooftop } from './rooftop.js';
import { createMan, createWoman, animateCharacter } from './characters.js';
import { clamp, rand, makeHeartTexture, makeGlowSprite } from './assets.js';

const TAU = Math.PI * 2;

export const NPCS = [
  {
    id: 'sable',
    name: 'Sable Vane',
    short: 'SABLE',
    role: 'MIXOLOGIST',
    vibe: 'Bold. Observant. Dangerous after midnight.',
    color: '#ff4f78',
    pos: new THREE.Vector3(-9.0, 0, -4.7),
    facing: 0.25,
    cameraSide: 1,
    appearance: {
      name: 'Sable',
      skin: 0x92563d,
      dress: 0x74152f,
      hair: 0x160d12,
      hairStyle: 'bob',
      shoe: 0x120b0e,
      lip: 0x7b2338,
      prop: 'shaker',
      scale: 1.01,
    },
  },
  {
    id: 'lila',
    name: 'Lila Moreau',
    short: 'LILA',
    role: 'ARTIST',
    vibe: 'Playful. Electric. Impossible to impress.',
    color: '#56ddd1',
    pos: new THREE.Vector3(2.7, 0, -0.5),
    facing: -0.5,
    cameraSide: -1,
    appearance: {
      name: 'Lila',
      skin: 0xa96d4e,
      dress: 0x17615c,
      hair: 0x45291e,
      hairStyle: 'buns',
      shoe: 0x191015,
      lip: 0x8b3852,
      prop: null,
      scale: 0.97,
    },
  },
  {
    id: 'noa',
    name: 'Noa Sterling',
    short: 'NOA',
    role: 'FOUNDER',
    vibe: 'Composed. Competitive. Hard to read.',
    color: '#f4c68f',
    pos: new THREE.Vector3(6.35, 0, -1.55),
    facing: -0.9,
    cameraSide: 1,
    appearance: {
      name: 'Noa',
      skin: 0xd6a084,
      dress: 0x17131c,
      hair: 0x191316,
      hairStyle: 'ponytail',
      shoe: 0x0a090d,
      lip: 0x79354a,
      prop: 'champagne',
      blazer: true,
      scale: 1.0,
    },
  },
];

export class RooftopScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x05040a, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.08, 260);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.mode = 'title';
    this.activeNpc = null;
    this.moveInput = { x: 0, y: 0 };
    this.keys = new Set();
    this.cameraYaw = 0.14;
    this.cameraPitch = 0.27;
    this.cameraDistance = 8.8;
    this.cameraTarget = new THREE.Vector3();
    this.cameraLook = new THREE.Vector3();
    this.cameraInitialized = false;
    this.playerMoving = false;
    this.playerSpeed = 0;
    this.nearest = null;
    this.bursts = [];
    this.player = createMan();
    this.player.position.set(0, 0, 7.2);
    this.player.rotation.y = Math.PI;
    this.scene.add(this.player);

    this.city = createCity(this.scene, this.renderer);
    this.rooftop = createRooftop(this.scene);
    this.obstacles = [...this.rooftop.obstacles];
    this.npcObjects = [];

    for (const config of NPCS) {
      const model = createWoman(config.appearance);
      model.position.copy(config.pos);
      model.rotation.y = config.facing;
      this.scene.add(model);
      const faceLight = new THREE.PointLight(0xffcbb5, 2.2, 4.2, 2);
      faceLight.position.set(0, 2.05, 0.95);
      model.add(faceLight);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.color),
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.52, 0.61, 40), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.025;
      model.add(ring);
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.28, 0.3, 32),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(config.color), transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }),
      );
      innerRing.rotation.x = -Math.PI / 2;
      innerRing.position.y = 0.026;
      model.add(innerRing);
      this.npcObjects.push({ config, model, ring, innerRing, heat: 0, stage: 0, talked: false, sealed: false, invite: false });
    }

    this.heartTexture = makeHeartTexture();
    this.glowTexture = makeGlowSprite(0xffffff, 1, 0.01).material.map;

    this.bindKeyboard();
    this.resize();
    this.camera.position.set(12, 8.5, 16);
    this.camera.lookAt(0, 1.6, -2);
    window.addEventListener('resize', () => this.resize());
    this.updateCamera(0.016, true);
  }

  bindKeyboard() {
    const active = (element) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName);
    window.addEventListener('keydown', (event) => {
      if (active(event.target)) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        this.keys.add(event.code);
        if (event.code.startsWith('Arrow')) event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const portrait = height > width;
    this.camera.fov = portrait ? 59 : 49;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.7 : 1.9));
    this.renderer.setSize(width, height, false);
    this.cameraInitialized = false;
  }

  setMode(mode, npc = null) {
    this.mode = mode;
    this.activeNpc = npc;
    this.player.visible = !['dialogue', 'pulse', 'cinematic'].includes(mode);
    if (mode === 'play') {
      this.cameraDistance = window.innerHeight > window.innerWidth ? 9.6 : 8.8;
    }
  }

  orbit(dx, dy) {
    if (this.mode !== 'play') return;
    this.cameraYaw -= dx * 0.0058;
    this.cameraPitch = clamp(this.cameraPitch + dy * 0.0035, 0.08, 0.75);
  }

  zoom(delta) {
    if (this.mode !== 'play') return;
    this.cameraDistance = clamp(this.cameraDistance + delta * 0.003, 6.2, 12.5);
  }

  setJoystick(x, y) {
    this.moveInput.x = clamp(x, -1, 1);
    this.moveInput.y = clamp(y, -1, 1);
  }

  getNpc(id) {
    return this.npcObjects.find((npc) => npc.config.id === id);
  }

  getNearestNpc(maxDistance = 2.75) {
    let best = null;
    let bestDistance = maxDistance;
    for (const npc of this.npcObjects) {
      const dx = npc.model.position.x - this.player.position.x;
      const dz = npc.model.position.z - this.player.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < bestDistance) {
        best = npc;
        bestDistance = distance;
      }
    }
    if (!best) return null;
    return { npc: best, distance: bestDistance };
  }

  faceEachOther(npc, dt) {
    const p = this.player.position;
    const n = npc.model.position;
    const playerAngle = Math.atan2(n.x - p.x, n.z - p.z);
    const npcAngle = Math.atan2(p.x - n.x, p.z - n.z);
    this.player.rotation.y = this.lerpAngle(this.player.rotation.y, playerAngle, 1 - Math.exp(-7 * dt));
    npc.model.rotation.y = this.lerpAngle(npc.model.rotation.y, npcAngle, 1 - Math.exp(-6 * dt));
  }

  lerpAngle(a, b, t) {
    let delta = ((b - a + Math.PI) % TAU) - Math.PI;
    if (delta < -Math.PI) delta += TAU;
    return a + delta * t;
  }

  resolveCollisions(position) {
    const radius = 0.38;
    for (let pass = 0; pass < 2; pass += 1) {
      for (const obstacle of this.obstacles) {
        if (obstacle.type === 'circle') {
          const dx = position.x - obstacle.x;
          const dz = position.z - obstacle.z;
          const distance = Math.hypot(dx, dz);
          const min = obstacle.r + radius;
          if (distance < min && distance > 0.0001) {
            position.x = obstacle.x + (dx / distance) * min;
            position.z = obstacle.z + (dz / distance) * min;
          }
        } else {
          const x1 = obstacle.x1 - radius;
          const x2 = obstacle.x2 + radius;
          const z1 = obstacle.z1 - radius;
          const z2 = obstacle.z2 + radius;
          if (position.x > x1 && position.x < x2 && position.z > z1 && position.z < z2) {
            const left = position.x - x1;
            const right = x2 - position.x;
            const top = position.z - z1;
            const bottom = z2 - position.z;
            const min = Math.min(left, right, top, bottom);
            if (min === left) position.x = x1;
            else if (min === right) position.x = x2;
            else if (min === top) position.z = z1;
            else position.z = z2;
          }
        }
      }
      for (const npc of this.npcObjects) {
        if (npc === this.activeNpc || npc.sealed) continue;
        const dx = position.x - npc.model.position.x;
        const dz = position.z - npc.model.position.z;
        const distance = Math.hypot(dx, dz);
        const min = 0.58;
        if (distance < min && distance > 0.0001) {
          position.x = npc.model.position.x + (dx / distance) * min;
          position.z = npc.model.position.z + (dz / distance) * min;
        }
      }
    }
    position.x = clamp(position.x, -17.9, 17.9);
    position.z = clamp(position.z, -11.35, 13.05);
  }

  updatePlayer(dt, time) {
    let x = this.moveInput.x;
    let y = this.moveInput.y;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    const length = Math.hypot(x, y);
    let moving = length > 0.08 && this.mode === 'play';
    if (moving) {
      x /= Math.max(1, length);
      y /= Math.max(1, length);
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);
      const dx = forwardX * -y + rightX * x;
      const dz = forwardZ * -y + rightZ * x;
      const speed = 3.15;
      this.player.position.x += dx * speed * dt;
      this.player.position.z += dz * speed * dt;
      this.resolveCollisions(this.player.position);
      const targetAngle = Math.atan2(dx, dz);
      this.player.rotation.y = this.lerpAngle(this.player.rotation.y, targetAngle, 1 - Math.exp(-13 * dt));
      this.playerMoving = true;
      this.playerSpeed = speed;
    } else {
      this.playerMoving = false;
      this.playerSpeed = 0;
    }
    animateCharacter(this.player, time, this.playerMoving, this.playerSpeed);
  }

  updateNpcs(dt, time) {
    for (const npc of this.npcObjects) {
      const distance = Math.hypot(npc.model.position.x - this.player.position.x, npc.model.position.z - this.player.position.z);
      if (npc === this.activeNpc) {
        this.faceEachOther(npc, dt);
      } else if (distance < 4.2 && this.mode === 'play') {
        const angle = Math.atan2(this.player.position.x - npc.model.position.x, this.player.position.z - npc.model.position.z);
        npc.model.rotation.y = this.lerpAngle(npc.model.rotation.y, angle, 1 - Math.exp(-2.3 * dt));
      } else {
        const target = npc.config.facing;
        npc.model.rotation.y = this.lerpAngle(npc.model.rotation.y, target, 1 - Math.exp(-0.8 * dt));
      }
      animateCharacter(npc.model, time, false, 0);
      const pulse = 0.36 + Math.sin(time * 1.8 + npc.model.userData.phase) * 0.1;
      npc.ring.material.opacity = npc.talked ? 0.5 : pulse;
      npc.ring.scale.setScalar(1 + Math.sin(time * 1.8 + npc.model.userData.phase) * 0.04);
      npc.innerRing.rotation.z = time * 0.18;
    }
  }

  updateCamera(dt, instant = false) {
    let desired = new THREE.Vector3();
    let look = new THREE.Vector3();
    let lambda = 4.4;

    if (this.mode === 'title') {
      const angle = 0.82 + Math.sin(this.elapsed * 0.038) * 0.18;
      const radius = 16.8;
      desired.set(Math.sin(angle) * radius, 7.8 + Math.sin(this.elapsed * 0.13) * 0.35, Math.cos(angle) * radius);
      look.set(-1.5, 1.9, -2.4);
      lambda = 2.0;
    } else if ((this.mode === 'dialogue' || this.mode === 'pulse') && this.activeNpc) {
      const npc = this.activeNpc;
      const p = this.player.position;
      const n = npc.model.position;
      const dx = p.x - n.x;
      const dz = p.z - n.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      const away = new THREE.Vector3(dx / len, 0, dz / len);
      const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(npc.config.cameraSide);
      // Sit just in front of the player, looking back at the other face.
      const portrait = window.innerHeight > window.innerWidth;
      const close = this.mode === 'pulse' ? (portrait ? 2.75 : 2.2) : (portrait ? 2.75 : 2.35);
      const lateral = this.mode === 'pulse' ? 0.58 : 0.7;
      const rise = this.mode === 'pulse' ? 2.02 : 2.12;
      desired.copy(n).addScaledVector(away, close).addScaledVector(side, lateral);
      desired.y = rise;
      if (this.mode === 'pulse') {
        desired.x += Math.sin(this.elapsed * 0.5) * 0.08;
        desired.z += Math.cos(this.elapsed * 0.42) * 0.06;
      }
      look.set(n.x, this.mode === 'pulse' ? 1.56 : 1.48, n.z);
      lambda = 3.0;
    } else if (this.mode === 'cinematic') {
      desired.set(2.7, 2.7, -7.6);
      look.set(0, 1.7, -11.7);
      lambda = 1.7;
    } else {
      const target = new THREE.Vector3(this.player.position.x, this.player.position.y + 1.28, this.player.position.z);
      const horizontal = Math.cos(this.cameraPitch) * this.cameraDistance;
      desired.set(
        target.x + Math.sin(this.cameraYaw) * horizontal,
        target.y + Math.sin(this.cameraPitch) * this.cameraDistance + 0.16,
        target.z + Math.cos(this.cameraYaw) * horizontal,
      );
      look.copy(target).add(new THREE.Vector3(0, -0.02, 0));
      lambda = 5.2;
    }

    if (instant || !this.cameraInitialized) {
      this.camera.position.copy(desired);
      this.cameraLook.copy(look);
      this.cameraInitialized = true;
    } else {
      const alpha = 1 - Math.exp(-lambda * dt);
      this.camera.position.lerp(desired, alpha);
      this.cameraLook.lerp(look, alpha);
    }
    this.camera.lookAt(this.cameraLook);
  }

  addBurst(position, color, count = 14) {
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.heartTexture,
        color: new THREE.Color(color),
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      const scale = rand(0.11, 0.28);
      sprite.scale.set(scale, scale, 1);
      sprite.position.copy(position).add(new THREE.Vector3(rand(-0.4, 0.4), rand(-0.1, 0.4), rand(-0.3, 0.3)));
      this.scene.add(sprite);
      this.bursts.push({
        sprite,
        velocity: new THREE.Vector3(rand(-0.4, 0.4), rand(0.5, 1.2), rand(-0.3, 0.3)),
        life: 0,
        max: rand(1.1, 1.8),
      });
    }
  }

  celebrateNpc(npc) {
    if (!npc) return;
    const pos = new THREE.Vector3(npc.model.position.x, 2.2, npc.model.position.z);
    this.addBurst(pos, npc.config.color, 22);
  }

  updateBursts(dt) {
    for (let i = this.bursts.length - 1; i >= 0; i -= 1) {
      const burst = this.bursts[i];
      burst.life += dt;
      burst.sprite.position.addScaledVector(burst.velocity, dt);
      burst.velocity.y -= 0.16 * dt;
      burst.sprite.material.opacity = Math.max(0, 1 - burst.life / burst.max);
      burst.sprite.scale.multiplyScalar(1 + dt * 0.14);
      if (burst.life > burst.max) {
        this.scene.remove(burst.sprite);
        burst.sprite.material.dispose();
        this.bursts.splice(i, 1);
      }
    }
  }

  getNpcIndicators() {
    const results = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (const npc of this.npcObjects) {
      const point = new THREE.Vector3(npc.model.position.x, 2.55, npc.model.position.z);
      point.project(this.camera);
      const visible = point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.25 && Math.abs(point.y) < 1.2;
      results.push({
        id: npc.config.id,
        x: (point.x * 0.5 + 0.5) * width,
        y: (-point.y * 0.5 + 0.5) * height,
        visible,
        distance: Math.hypot(npc.model.position.x - this.player.position.x, npc.model.position.z - this.player.position.z),
        heat: npc.heat,
        sealed: npc.sealed,
      });
    }
    return results;
  }

  update(dt) {
    this.elapsed += dt;
    const time = this.elapsed;
    this.city.update(time);
    this.rooftop.update(time, dt);
    this.updatePlayer(dt, time);
    this.updateNpcs(dt, time);
    this.nearest = this.mode === 'play' ? this.getNearestNpc() : null;
    this.updateCamera(dt);
    this.updateBursts(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
