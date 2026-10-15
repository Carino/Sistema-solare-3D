import * as THREE from 'three';

// Utility per generare rumore 2D deterministico
function pseudoRandom(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function noise2D(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = pseudoRandom(i, j);
  const n10 = pseudoRandom(i + 1, j);
  const n01 = pseudoRandom(i, j + 1);
  const n11 = pseudoRandom(i + 1, j + 1);

  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;

  return nx0 * (1 - sy) + nx1 * sy;
}

function fbm(x, y, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let o = 0; o < octaves; o++) {
    val += amp * noise2D(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

export function createSunTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      const n1 = fbm(u * 14, v * 14, 5);
      const n2 = fbm((u + 0.3) * 28, (v + 0.3) * 28, 4);
      const flare = Math.pow(n1 * 0.7 + n2 * 0.3, 1.4);

      const r = Math.min(255, Math.floor(255 * (0.9 + flare * 0.2)));
      const g = Math.min(255, Math.floor(180 * flare + 60));
      const b = Math.min(255, Math.floor(40 * flare));

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createMercuryTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 18, v * 18, 5);

      const val = Math.floor(100 + n * 90);
      const idx = (y * width + x) * 4;
      data[idx] = val + 15;     // Leggero tocco marroncino
      data[idx + 1] = val + 10;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Aggiungi crateri
  ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 60; i++) {
    const cx = pseudoRandom(i * 3.1, 7.2) * width;
    const cy = pseudoRandom(i * 9.4, 1.8) * height;
    const r = 2 + pseudoRandom(i * 1.5, 3.7) * 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createVenusTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      // Vortici densi e bande atmosferiche
      const swirl = Math.sin(v * 20 + fbm(u * 10, v * 6, 4) * 8);
      const n = fbm(u * 8 + swirl * 0.2, v * 8, 4);

      const r = Math.floor(215 + n * 35);
      const g = Math.floor(175 + n * 40);
      const b = Math.floor(115 + n * 30);

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createEarthTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      // Forma dei continenti con FBM multi-ottava
      const elevation = fbm(u * 6, v * 6, 6);
      const polar = Math.abs(v - 0.5) * 2; // Da 0 (equatore) a 1 (poli)

      let r, g, b;
      if (polar > 0.85 + (elevation - 0.5) * 0.2) {
        // Calotte polari ghiacciate
        r = 240; g = 245; b = 255;
      } else if (elevation < 0.48) {
        // Oceano profondo / costiero
        const depth = elevation / 0.48;
        r = Math.floor(10 + depth * 20);
        g = Math.floor(45 + depth * 70);
        b = Math.floor(120 + depth * 80);
      } else if (elevation < 0.53) {
        // Coste sabbiose
        r = 195; g = 175; b = 130;
      } else if (elevation < 0.72) {
        // Terre emerse, foreste e pianure verdi
        const veg = (elevation - 0.53) / 0.19;
        r = Math.floor(45 + veg * 40);
        g = Math.floor(120 - veg * 20);
        b = Math.floor(45);
      } else {
        // Montagne e altopiani rocciosi
        r = 140; g = 115; b = 90;
      }

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createEarthCloudsTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 12 + 1.2, v * 12 + 0.8, 5);

      const alpha = n > 0.52 ? Math.min(230, Math.floor((n - 0.52) * 480)) : 0;
      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createMoonTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 16, v * 16, 5);
      // Mari lunari più scuri
      const val = n < 0.45 ? Math.floor(75 + n * 60) : Math.floor(130 + n * 80);

      const idx = (y * width + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createMarsTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 10, v * 10, 5);
      const polar = Math.abs(v - 0.5) * 2;

      let r, g, b;
      if (polar > 0.88) {
        // Calotte polari di CO2 e ghiaccio
        r = 235; g = 230; b = 230;
      } else {
        // Rugginoso con zone scure (Syrtis Major)
        const darkPatch = fbm(u * 4 + 2, v * 4, 3);
        const factor = darkPatch < 0.4 ? 0.7 : 1.0;

        r = Math.floor((175 + n * 60) * factor);
        g = Math.floor((65 + n * 40) * factor);
        b = Math.floor((25 + n * 20) * factor);
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createJupiterTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      // Onde e turbolenze zonali
      const bandWave = Math.sin(v * 36 + fbm(u * 15, v * 5, 3) * 3);
      const n = fbm(u * 18 + bandWave * 0.15, v * 24, 4);

      // Colori caratteristici a strisce di Giove
      let r = 190 + bandWave * 35 + n * 30;
      let g = 145 + bandWave * 30 + n * 25;
      let b = 105 + bandWave * 20 + n * 15;

      // Grande Macchia Rossa (posizionata a circa v=0.68, u=0.55)
      const spotDx = (u - 0.55) * 6;
      const spotDy = (v - 0.68) * 12;
      const distSpot = Math.sqrt(spotDx * spotDx + spotDy * spotDy);
      if (distSpot < 0.45) {
        const spotFactor = Math.cos(distSpot * Math.PI / 0.45 * 0.5);
        r = 210 * spotFactor + r * (1 - spotFactor);
        g = 70 * spotFactor + g * (1 - spotFactor);
        b = 50 * spotFactor + b * (1 - spotFactor);
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, Math.floor(r)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor(g)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.floor(b)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createSaturnTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      const band = Math.sin(v * 28 + fbm(u * 8, v * 4, 3) * 1.5);
      const n = fbm(u * 12, v * 16, 3);

      const r = 215 + band * 25 + n * 15;
      const g = 190 + band * 20 + n * 15;
      const b = 140 + band * 20 + n * 10;

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, Math.floor(r)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor(g)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.floor(b)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createSaturnRingTexture() {
  const width = 512;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let x = 0; x < width; x++) {
    const t = x / width; // Da interno anello a esterno

    // Divisione di Cassini a circa t = 0.60..0.66
    let alpha = 0.85;
    let brightness = 180 + Math.sin(t * 120) * 30;

    if (t < 0.05 || t > 0.95) {
      alpha = 0;
    } else if (t > 0.58 && t < 0.65) {
      // Divisione di Cassini
      alpha = 0.08;
      brightness = 60;
    } else if (t < 0.25) {
      // Anello C più scuro/trasparente
      alpha = 0.4;
      brightness = 130;
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = Math.floor(brightness * 1.1);
      data[idx + 1] = Math.floor(brightness * 0.98);
      data[idx + 2] = Math.floor(brightness * 0.78);
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createUranusTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = y / height;
      const subtle = Math.sin(v * 16) * 12;

      const idx = (y * width + x) * 4;
      data[idx] = Math.floor(140 + subtle * 0.5);
      data[idx + 1] = Math.floor(215 + subtle * 0.8);
      data[idx + 2] = Math.floor(235 + subtle);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createUranusRingTexture() {
  const width = 256;
  const height = 32;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, 'rgba(160, 220, 240, 0)');
  grad.addColorStop(0.3, 'rgba(180, 230, 250, 0.35)');
  grad.addColorStop(0.7, 'rgba(200, 240, 255, 0.45)');
  grad.addColorStop(1, 'rgba(160, 220, 240, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

export function createNeptuneTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 14, v * 14, 4);

      let r = 35 + n * 30;
      let g = 80 + n * 50;
      let b = 210 + n * 45;

      // Grande Macchia Scura di Nettuno
      const spotDx = (u - 0.4) * 7;
      const spotDy = (v - 0.45) * 14;
      if (spotDx * spotDx + spotDy * spotDy < 0.25) {
        b *= 0.6;
        g *= 0.6;
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createPlutoTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const n = fbm(u * 12, v * 12, 4);

      let r = 160 + n * 45;
      let g = 135 + n * 35;
      let b = 110 + n * 25;

      // Cuore di Tombaugh Regio
      const heartDx = (u - 0.45) * 6;
      const heartDy = (v - 0.5) * 8;
      if (heartDx * heartDx + heartDy * heartDy < 0.35) {
        r = 230; g = 220; b = 205;
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// Crea una stella con corona luminosa per il Sole (Sprite glow)
export function createGlowTexture(colorHex = '#ffaa33') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
  grad.addColorStop(0.2, colorHex);
  grad.addColorStop(0.5, 'rgba(255, 120, 0, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}
