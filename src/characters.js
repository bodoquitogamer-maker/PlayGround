import * as THREE from '../vendor/three.module.js';

const TAU = Math.PI * 2;

const material = (color, options = {}) => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.62,
  metalness: 0,
  ...options,
});

const skinMaterial = (color) => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.5,
  metalness: 0.02,
});

function shadowed(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

function capsule(radius, length, mat, radial = 10) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, radial), mat);
  return mesh;
}

function createLeg(skin, cloth, shoe, isMan = false) {
  const leg = new THREE.Group();
  const thigh = capsule(isMan ? 0.135 : 0.105, isMan ? 0.36 : 0.32, cloth, 8);
  thigh.position.y = -0.26;
  leg.add(thigh);
  const shin = capsule(isMan ? 0.105 : 0.075, isMan ? 0.3 : 0.3, isMan ? cloth : skin, 8);
  shin.position.y = -0.61;
  leg.add(shin);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(isMan ? 0.2 : 0.15, 0.1, isMan ? 0.36 : 0.29), shoe);
  foot.position.set(0, -0.83, 0.08);
  leg.add(foot);
  if (!isMan) {
    const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.3, 6), shoe);
    heel.position.set(0, -0.93, -0.06);
    leg.add(heel);
  }
  return leg;
}

export function createMan() {
  const group = new THREE.Group();
  group.name = 'Kai';
  const body = new THREE.Group();
  group.add(body);

  const skin = skinMaterial(0xa2694a);
  const skinDark = skinMaterial(0xa96849);
  const hairMat = material(0x1b1217, { roughness: 0.82 });
  const jacket = material(0x15121a, { roughness: 0.7 });
  const jacketEdge = material(0x28202b, { roughness: 0.6 });
  const pants = material(0x101018, { roughness: 0.72 });
  const shoe = material(0x09090d, { roughness: 0.45 });
  const gold = material(0xd5a45e, { metalness: 0.75, roughness: 0.3 });
  const dark = material(0x0b080d, { roughness: 0.5 });

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 0.28, 12), pants);
  hips.position.y = 1.07;
  body.add(hips);

  const leftLeg = createLeg(skin, pants, shoe, true);
  leftLeg.position.set(-0.17, 1.08, 0);
  body.add(leftLeg);
  const rightLeg = createLeg(skin, pants, shoe, true);
  rightLeg.position.set(0.17, 1.08, 0);
  body.add(rightLeg);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.34, 0.88, 14, 1), skin);
  torso.position.y = 1.52;
  torso.scale.z = 0.72;
  body.add(torso);

  // The jacket stays open at the front, but wraps his back in a clean curve.
  const jacketBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.545, 0.365, 0.9, 14, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x15121a, roughness: 0.7, side: THREE.DoubleSide }),
  );
  jacketBack.position.y = 1.51;
  jacketBack.scale.z = 0.76;
  body.add(jacketBack);
  const yoke = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.53, 0.16, 14, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x28202b, roughness: 0.62, side: THREE.DoubleSide }),
  );
  yoke.position.set(0, 1.89, 0);
  yoke.scale.z = 0.77;
  body.add(yoke);

  // Defined chest and shoulders — stylized, not anatomical.
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skin);
    pec.scale.set(1.12, 0.72, 0.52);
    pec.position.set(side * 0.19, 1.65, 0.29);
    body.add(pec);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skin);
    shoulder.scale.set(1.05, 0.9, 0.9);
    shoulder.position.set(side * 0.49, 1.8, 0);
    body.add(shoulder);
    const jacketPanel = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.82, 0.49), jacket);
    jacketPanel.position.set(side * 0.48, 1.48, -0.03);
    jacketPanel.rotation.z = side * -0.07;
    body.add(jacketPanel);
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.48, 0.055), jacketEdge);
    lapel.position.set(side * 0.275, 1.64, 0.29);
    lapel.rotation.z = side * 0.34;
    body.add(lapel);
  }

  for (let row = 0; row < 3; row += 1) {
    for (const side of [-1, 1]) {
      const ab = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skinDark);
      ab.scale.set(1, 0.72, 0.3);
      ab.position.set(side * 0.095, 1.38 - row * 0.14, 0.335);
      body.add(ab);
    }
  }

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.08, 14), dark);
  belt.position.y = 1.06;
  body.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.085, 0.03), gold);
  buckle.position.set(0, 1.06, 0.3);
  body.add(buckle);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 5, 12, Math.PI), jacketEdge);
  collar.rotation.set(Math.PI / 2, 0, Math.PI);
  collar.position.set(0, 1.9, 0.03);
  body.add(collar);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.2, 9), skin);
  neck.position.y = 1.98;
  body.add(neck);

  const head = new THREE.Group();
  head.position.y = 2.19;
  body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.275, 18, 14), skin);
  face.scale.set(0.9, 1.1, 0.9);
  head.add(face);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 9), skin);
  jaw.scale.set(0.9, 0.72, 0.82);
  jaw.position.set(0, -0.15, 0.04);
  head.add(jaw);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.054, 8, 6), skin);
    ear.scale.set(0.5, 1, 0.72);
    ear.position.set(side * 0.26, 0.01, 0);
    head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), dark);
    eye.scale.set(1.25, 0.75, 0.6);
    eye.position.set(side * 0.095, 0.025, 0.252);
    head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.02), hairMat);
    brow.position.set(side * 0.1, 0.114, 0.258);
    brow.rotation.z = side * 0.11;
    head.add(brow);
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 4, 10), gold);
    earring.position.set(side * 0.266, -0.045, 0.03);
    earring.rotation.y = Math.PI / 2;
    head.add(earring);
  }

  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.045, 0.1, 6), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.015, 0.272);
  head.add(nose);
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.022, 0.023), material(0x8c4e4d, { roughness: 0.6 }));
  lips.position.set(0, -0.115, 0.25);
  head.add(lips);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.287, 18, 12, 0, TAU, 0, Math.PI * 0.35), hairMat);
  hairCap.scale.set(1.01, 0.9, 1.02);
  hairCap.position.y = 0.075;
  head.add(hairCap);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), hairMat);
  hairBack.scale.set(1.05, 1.08, 0.8);
  hairBack.position.set(0, 0.02, -0.13);
  head.add(hairBack);
  const quiff = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.14, 3, 7), hairMat);
  quiff.rotation.z = 1.18;
  quiff.rotation.x = 0.2;
  quiff.position.set(-0.04, 0.26, 0.1);
  head.add(quiff);

  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 4, 18, Math.PI * 1.2), gold);
  chain.position.set(0, 1.85, 0.3);
  chain.rotation.z = Math.PI * 0.9;
  body.add(chain);
  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.026), gold);
  pendant.position.set(0, 1.78, 0.325);
  body.add(pendant);

  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.56, 1.79, 0);
    arm.rotation.z = side * 0.13;
    const upper = capsule(0.15, 0.37, skin, 9);
    upper.position.y = -0.27;
    arm.add(upper);
    const bicep = new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 8), skin);
    bicep.scale.set(1, 0.76, 0.95);
    bicep.position.set(side * -0.01, -0.22, 0.03);
    arm.add(bicep);
    const forearm = new THREE.Group();
    forearm.position.y = -0.56;
    const lower = capsule(0.12, 0.3, skin, 9);
    lower.position.y = -0.2;
    forearm.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 9, 7), skin);
    hand.scale.set(0.8, 1.1, 0.65);
    hand.position.y = -0.4;
    forearm.add(hand);
    const watch = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.013, 4, 12), gold);
    watch.rotation.x = Math.PI / 2;
    watch.position.y = -0.37;
    forearm.add(watch);
    arm.add(forearm);
    body.add(arm);
    arms[side === -1 ? 'left' : 'right'] = arm;
  }

  shadowed(group);
  group.userData = {
    body,
    head,
    leftLeg,
    rightLeg,
    leftArm: arms.left,
    rightArm: arms.right,
    phase: 0,
    height: 2.48,
    kind: 'player',
  };
  group.scale.setScalar(1.0);
  return group;
}

function hairFor(style, hairMat, skinMat) {
  const group = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.287, 18, 12, 0, TAU, 0, Math.PI * 0.36), hairMat);
  cap.scale.set(1.02, 1.02, 1.02);
  cap.position.y = 0.05;
  group.add(cap);
  if (style === 'bob') {
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), hairMat);
    back.scale.set(0.95, 1.28, 0.66);
    back.position.set(0, -0.02, -0.08);
    group.add(back);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.12, 0.09), hairMat);
    fringe.position.set(0.02, 0.21, 0.205);
    fringe.rotation.z = -0.18;
    group.add(fringe);
  } else if (style === 'buns') {
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), hairMat);
    back.scale.set(0.96, 1.08, 0.6);
    back.position.set(0, -0.035, -0.11);
    group.add(back);
    for (const side of [-1, 1]) {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), hairMat);
      bun.position.set(side * 0.22, 0.25, -0.02);
      group.add(bun);
    }
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 5, 14, Math.PI * 1.2), hairMat);
    curl.position.set(0.1, 0.2, 0.19);
    curl.rotation.z = -1.2;
    group.add(curl);
  } else {
    const slick = new THREE.Mesh(new THREE.SphereGeometry(0.287, 16, 12, 0, TAU, 0, Math.PI * 0.36), hairMat);
    slick.scale.set(0.96, 0.82, 1.02);
    slick.position.set(0, 0.065, -0.01);
    group.add(slick);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 10), hairMat);
    back.scale.set(0.9, 1.1, 0.55);
    back.position.set(0, -0.02, -0.12);
    group.add(back);
    const pony = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.46, 4, 8), hairMat);
    pony.position.set(0, -0.18, -0.29);
    pony.rotation.x = -0.18;
    group.add(pony);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 4, 10), material(0xd5a45e, { metalness: 0.6, roughness: 0.3 }));
    tie.position.set(0, 0.08, -0.21);
    tie.rotation.x = Math.PI / 2;
    group.add(tie);
  }
  return group;
}

export function createWoman(style) {
  const group = new THREE.Group();
  group.name = style.name;
  const body = new THREE.Group();
  group.add(body);

  const skin = skinMaterial(style.skin);
  const skinDark = skinMaterial(new THREE.Color(style.skin).multiplyScalar(0.83).getHex());
  const dress = new THREE.MeshStandardMaterial({ color: style.dress, roughness: 0.38, metalness: 0.18 });
  const dressDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(style.dress).multiplyScalar(0.58), roughness: 0.5, metalness: 0.12 });
  const hairMat = material(style.hair, { roughness: 0.78 });
  const shoeMat = material(style.shoe || 0x0a090d, { roughness: 0.35, metalness: 0.18 });
  const gold = material(0xd5a45e, { metalness: 0.75, roughness: 0.28 });
  const dark = material(0x0a0810, { roughness: 0.48 });

  const leftLeg = createLeg(skin, skin, shoeMat, false);
  leftLeg.position.set(-0.13, 1.06, 0);
  body.add(leftLeg);
  const rightLeg = createLeg(skin, skin, shoeMat, false);
  rightLeg.position.set(0.13, 1.06, 0);
  body.add(rightLeg);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.44, 0.78, 18, 1, false), dress);
  skirt.position.y = 1.26;
  body.add(skirt);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 9), dressDark);
  hip.scale.set(1.1, 0.58, 0.77);
  hip.position.y = 1.61;
  body.add(hip);
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.235, 0.46, 14), dress);
  bodice.position.y = 1.74;
  bodice.scale.z = 0.8;
  body.add(bodice);
  const waistBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.245, 0.065, 16), material(style.belt || 0x17121a, { roughness: 0.35, metalness: 0.45 }));
  waistBelt.position.y = 1.575;
  waistBelt.scale.z = 0.82;
  body.add(waistBelt);
  const waistGold = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), gold);
  waistGold.position.set(0, 1.575, 0.205);
  body.add(waistGold);
  const neckline = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.005, 4, 20, Math.PI), gold);
  neckline.position.set(0, 1.885, 0.02);
  neckline.rotation.set(Math.PI / 2, 0, Math.PI);
  body.add(neckline);

  for (const side of [-1, 1]) {
    const shape = new THREE.Mesh(new THREE.SphereGeometry(0.105, 9, 7), dress);
    shape.scale.set(0.92, 0.64, 0.42);
    shape.position.set(side * 0.102, 1.84, 0.13);
    body.add(shape);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), skin);
    shoulder.position.set(side * 0.28, 1.94, 0);
    body.add(shoulder);
  }

  if (style.blazer) {
    const blazer = material(0xe4d9cb, { roughness: 0.72 });
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.66, 0.4), blazer);
      panel.position.set(side * 0.24, 1.83, -0.02);
      panel.rotation.z = side * -0.05;
      body.add(panel);
    }
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.04), blazer);
    lapel.position.set(-0.12, 1.88, 0.22);
    lapel.rotation.z = 0.3;
    body.add(lapel);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.2, 9), skin);
  neck.position.y = 2.01;
  body.add(neck);

  const head = new THREE.Group();
  head.position.y = 2.2;
  body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.255, 18, 14), skin);
  face.scale.set(0.88, 1.06, 0.88);
  head.add(face);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 9), skin);
  jaw.scale.set(0.86, 0.66, 0.8);
  jaw.position.set(0, -0.135, 0.045);
  head.add(jaw);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skin);
    ear.scale.set(0.45, 1, 0.7);
    ear.position.set(side * 0.237, 0, 0);
    head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 8, 6), dark);
    eye.scale.set(1.25, 0.78, 0.5);
    eye.position.set(side * 0.086, 0.033, 0.229);
    head.add(eye);
    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff6ee }));
    catchlight.scale.set(1, 1.2, 0.4);
    catchlight.position.set(side * 0.082, 0.044, 0.245);
    head.add(catchlight);
    const lash = new THREE.Mesh(new THREE.BoxGeometry(0.069, 0.009, 0.012), dark);
    lash.position.set(side * 0.087, 0.061, 0.239);
    lash.rotation.z = side * 0.1;
    head.add(lash);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.077, 0.014, 0.016), hairMat);
    brow.position.set(side * 0.088, 0.108, 0.236);
    brow.rotation.z = side * 0.13;
    head.add(brow);
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10), gold);
    earring.position.set(side * 0.245, -0.07, 0.04);
    earring.rotation.y = Math.PI / 2;
    head.add(earring);
  }
  const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.08, 0.035), skin);
  noseBridge.position.set(0, 0.005, 0.238);
  head.add(noseBridge);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, 0.065, 6), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.035, 0.255);
  head.add(nose);
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.028, 0.022), material(style.lip || 0x8c3b51, { roughness: 0.45 }));
  lips.position.set(0, -0.115, 0.228);
  head.add(lips);
  const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), material(0xffd7c9, { roughness: 0.3 }));
  highlight.scale.set(1.8, 0.34, 0.2);
  highlight.position.set(0, -0.098, 0.242);
  head.add(highlight);

  head.add(hairFor(style.hairStyle, hairMat, skin));

  const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.006, 4, 16, Math.PI * 1.15), gold);
  necklace.position.set(0, 1.94, 0.17);
  necklace.rotation.z = Math.PI * 0.92;
  body.add(necklace);

  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.29, 1.93, 0);
    arm.rotation.z = side * 0.2;
    const upper = capsule(0.075, 0.3, skin, 8);
    upper.position.y = -0.19;
    arm.add(upper);
    const forearm = new THREE.Group();
    forearm.position.y = -0.38;
    const lower = capsule(0.06, 0.27, skin, 8);
    lower.position.y = -0.17;
    forearm.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.067, 8, 6), skin);
    hand.scale.set(0.78, 1.05, 0.6);
    hand.position.y = -0.34;
    forearm.add(hand);
    arm.add(forearm);
    body.add(arm);
    arms[side === -1 ? 'left' : 'right'] = arm;
  }

  // A small drink or clutch keeps idle hands expressive.
  if (style.prop === 'champagne') {
    const glass = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.13, 5), gold);
    stem.position.y = -0.49;
    glass.add(stem);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.025, 0.09, 8, 1, true), material(0xffd6a5, { transparent: true, opacity: 0.3, roughness: 0.15, metalness: 0.2 }));
    bowl.position.y = -0.38;
    glass.add(bowl);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.008, 8), gold);
    base.position.y = -0.56;
    glass.add(base);
    arms.right.add(glass);
  }
  if (style.prop === 'shaker') {
    const shaker = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.072, 0.2, 10), gold);
    shaker.position.set(0, -0.5, 0.02);
    shaker.rotation.z = 0.12;
    arms.right.add(shaker);
  }

  shadowed(group);
  group.userData = {
    body,
    head,
    leftLeg,
    rightLeg,
    leftArm: arms.left,
    rightArm: arms.right,
    phase: Math.random() * TAU,
    height: 2.35,
    kind: 'npc',
    style,
  };
  group.scale.setScalar(style.scale || 0.98);
  return group;
}

export function animateCharacter(character, time, moving = false, speed = 0) {
  const data = character.userData;
  if (!data) return;
  const phase = data.phase || 0;
  if (moving) {
    const stride = Math.sin(time * 9.2 + phase) * (0.34 + speed * 0.08);
    data.leftLeg.rotation.x = stride;
    data.rightLeg.rotation.x = -stride;
    data.leftArm.rotation.x = -stride * 0.8;
    data.rightArm.rotation.x = stride * 0.8;
    data.body.position.y = Math.abs(Math.sin(time * 9.2 + phase)) * 0.035;
    data.body.rotation.z = Math.sin(time * 4.6 + phase) * 0.012;
    data.head.rotation.z = Math.sin(time * 4.6 + phase) * 0.018;
  } else {
    data.leftLeg.rotation.x *= 0.86;
    data.rightLeg.rotation.x *= 0.86;
    data.leftArm.rotation.x *= 0.9;
    data.rightArm.rotation.x *= 0.9;
    data.body.position.y = Math.sin(time * 1.65 + phase) * 0.014;
    data.body.rotation.z = Math.sin(time * 0.72 + phase) * 0.009;
    data.leftArm.rotation.z = -0.13 + Math.sin(time * 1.05 + phase) * 0.018;
    data.rightArm.rotation.z = 0.13 - Math.sin(time * 1.05 + phase) * 0.018;
    if (data.kind === 'npc') {
      data.body.rotation.y = Math.sin(time * 0.75 + phase) * 0.035;
      data.head.rotation.y = Math.sin(time * 0.48 + phase) * 0.07;
      data.head.rotation.z = Math.sin(time * 0.58 + phase) * 0.025;
    }
  }
}
