import * as THREE from '../vendor/three.module.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function makeFloorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#14111a';
    ctx.fillRect(0, 0, w, h);
    const tile = 64;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const shade = 15 + Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${shade + 4},${shade + 1},${shade + 8})`;
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        ctx.strokeStyle = 'rgba(255,255,255,.036)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1.5, y + 1.5, tile - 3, tile - 3);
      }
    }
    for (let i = 0; i < 110; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    ctx.strokeStyle = 'rgba(244,198,143,.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      const y = Math.random() * h;
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(w * 0.3, y + rand(-40, 40), w * 0.7, y + rand(-40, 40), w + 10, y + rand(-30, 30));
      ctx.stroke();
    }
  });
}

export function makeMarbleTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0d0b13';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i += 1) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${rand(160, 230)},${rand(130, 180)},${rand(150, 210)},${rand(0.015, 0.06)})`;
      ctx.lineWidth = rand(0.5, 2.6);
      let x = rand(-100, w);
      let y = rand(-100, h);
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j += 1) {
        x += rand(-120, 180);
        y += rand(-90, 140);
        ctx.quadraticCurveTo(x + rand(-80, 80), y + rand(-80, 80), x, y);
      }
      ctx.stroke();
    }
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255,255,255,.03)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,110,140,.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeWindowTexture() {
  return canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, w, h);
    const cols = 12;
    const rows = 20;
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (Math.random() < 0.46) {
          const warm = Math.random() > 0.34;
          const alpha = rand(0.28, 1);
          ctx.fillStyle = warm
            ? `rgba(255,${Math.floor(rand(160, 220))},${Math.floor(rand(90, 150))},${alpha})`
            : `rgba(${Math.floor(rand(110, 160))},${Math.floor(rand(190, 230))},255,${alpha * 0.9})`;
          ctx.fillRect(x * cw + 2, y * ch + 2, cw - 3, ch - 3);
        }
        if (Math.random() < 0.12) {
          ctx.fillStyle = 'rgba(255,255,255,.16)';
          ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, 1);
        }
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    for (let y = 0; y < rows; y += 1) ctx.fillRect(0, y * ch, w, 1);
    for (let x = 0; x < cols; x += 1) ctx.fillRect(x * cw, 0, 1, h);
  });
}

export function makeGlowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,.7)');
    g.addColorStop(0.46, 'rgba(255,255,255,.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeHeartTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.bezierCurveTo(-42, 18, -92, 40, -78, 92);
    ctx.bezierCurveTo(-64, 143, -14, 176, 0, 198);
    ctx.bezierCurveTo(14, 176, 64, 143, 78, 92);
    ctx.bezierCurveTo(92, 40, 42, 18, 0, 60);
    const g = ctx.createLinearGradient(0, -80, 0, 190);
    g.addColorStop(0, '#fff0e6');
    g.addColorStop(0.3, '#ff875f');
    g.addColorStop(0.65, '#ff416f');
    g.addColorStop(1, '#bd1546');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(255,60,110,.9)';
    ctx.shadowBlur = 34;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,240,230,.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

export function makeNeonTexture(text, color = '#ff4f78', options = {}) {
  const vertical = Boolean(options.vertical);
  const width = vertical ? 256 : 1024;
  const height = vertical ? 1024 : 256;
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = options.size || (vertical ? 94 : 116);
    ctx.font = `${options.weight || 700} ${size}px "Helvetica Neue", Arial, sans-serif`;
    ctx.letterSpacing = '8px';
    ctx.shadowColor = color;
    ctx.shadowBlur = 38;
    ctx.fillStyle = color;
    if (vertical) {
      const letters = text.split('');
      letters.forEach((letter, i) => {
        const y = (h / (letters.length + 1)) * (i + 1);
        ctx.fillText(letter, w / 2, y);
      });
    } else {
      ctx.fillText(text, w / 2, h / 2 + 4);
    }
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.font = `${options.weight || 700} ${size - 3}px "Helvetica Neue", Arial, sans-serif`;
    if (vertical) {
      const letters = text.split('');
      letters.forEach((letter, i) => {
        const y = (h / (letters.length + 1)) * (i + 1);
        ctx.fillText(letter, w / 2, y);
      });
    } else {
      ctx.fillText(text, w / 2, h / 2 + 4);
    }
  });
}

export function makeHeartSignTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h * 0.39);
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.bezierCurveTo(-40, 8, -90, 32, -76, 84);
    ctx.bezierCurveTo(-60, 140, -12, 166, 0, 194);
    ctx.bezierCurveTo(12, 166, 60, 140, 76, 84);
    ctx.bezierCurveTo(90, 32, 40, 8, 0, 48);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ff5478';
    ctx.shadowColor = '#ff315f';
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,230,220,.65)';
    ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = '700 38px "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = '12px';
    ctx.shadowColor = '#f4c68f';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f4c68f';
    ctx.fillText('AFTER HOURS', w / 2, h * 0.79);
    ctx.font = '400 14px "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillStyle = 'rgba(255,240,230,.55)';
    ctx.shadowBlur = 0;
    ctx.fillText('ROOFTOP / PENTHOUSE', w / 2, h * 0.86);
  });
}

export function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#020208') },
      uMid: { value: new THREE.Color('#090a20') },
      uHorizon: { value: new THREE.Color('#34112d') },
      uGlow: { value: new THREE.Color('#ff3d6e') },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = normalize(world.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      varying vec3 vWorld;
      void main() {
        float h = vWorld.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.03, 0.24, h));
        col = mix(col, uTop, smoothstep(0.16, 0.72, h));
        float glow = pow(max(0.0, 1.0 - abs(h + 0.01) * 11.0), 3.0);
        float magenta = pow(max(0.0, 1.0 - abs(h + 0.02) * 7.0), 4.0);
        col += uGlow * glow * 0.045;
        col += vec3(0.35, 0.05, 0.24) * magenta * 0.25;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function makeGlowSprite(color, size, opacity = 1) {
  const texture = makeGlowTexture();
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}
