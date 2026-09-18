import { applyAtlas, ATLAS_FRAMES } from './atlas.js';
export const FRUITS = [
  {
    name: 'watermelon',
    skin: '#2e853b',
    light: '#a5d846',
    flesh: '#ff4d55',
    juice: 0xff505b,
    r: 40,
    value: 1,
  },
  {
    name: 'orange',
    skin: '#ed7912',
    light: '#ffd256',
    flesh: '#ffb52c',
    juice: 0xffa726,
    r: 33,
    value: 1,
  },
  {
    name: 'kiwi',
    skin: '#88613a',
    light: '#c49959',
    flesh: '#a5d446',
    juice: 0xb5df4c,
    r: 31,
    value: 1,
  },
  {
    name: 'strawberry',
    skin: '#d62940',
    light: '#ff7372',
    flesh: '#ff8a91',
    juice: 0xff476b,
    r: 32,
    value: 1,
  },
  {
    name: 'dragon-fruit',
    skin: '#d93389',
    light: '#ff9aca',
    flesh: '#fff3e3',
    juice: 0xf985ce,
    r: 36,
    value: 3,
  },
  {
    name: 'pineapple',
    skin: '#cc831b',
    light: '#ffe56b',
    flesh: '#ffe278',
    juice: 0xffd85a,
    r: 34,
    value: 1,
  },
  {
    name: 'coconut',
    skin: '#6f4530',
    light: '#bc9766',
    flesh: '#fff6e1',
    juice: 0xfff5df,
    r: 35,
    value: 1,
  },
  {
    name: 'peach',
    skin: '#f28c66',
    light: '#ffe1a1',
    flesh: '#ffc990',
    juice: 0xffa982,
    r: 34,
    value: 1,
  },
  {
    name: 'lime',
    skin: '#579e20',
    light: '#d5ed65',
    flesh: '#cfe98a',
    juice: 0xbae65c,
    r: 30,
    value: 1,
  },
  {
    name: 'golden',
    skin: '#c58513',
    light: '#fff6b0',
    flesh: '#ffe373',
    juice: 0xffde65,
    r: 35,
    value: 10,
  },
];
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
export function fruitCanvas(f, half = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 160;
  const c = canvas.getContext('2d');
  c.translate(80, 83);
  const r = 55;
  c.shadowColor = '#0007';
  c.shadowBlur = 9;
  c.shadowOffsetY = 7;
  if (half) {
    c.save();
    c.beginPath();
    c.rect(half < 0 ? -70 : 0, -80, 70, 160);
    c.clip();
  }
  const g = c.createRadialGradient(-20, -25, 3, 5, 10, 70);
  g.addColorStop(0, f.light);
  g.addColorStop(0.6, f.skin);
  g.addColorStop(1, '#172818');
  ellipse(c, 0, 0, r, f.name === 'watermelon' ? r * 1.07 : r, g);
  c.shadowColor = 'transparent';
  if (half) {
    ellipse(c, 0, 0, 49, 51, '#f7eec2');
    ellipse(c, 0, 0, 44, 46, f.flesh);
    if (['orange', 'lime', 'pineapple'].includes(f.name)) {
      c.strokeStyle = '#fff5bc';
      c.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 43, Math.sin(a) * 45);
        c.stroke();
      }
      ellipse(c, 0, 0, 6, 6, '#fff3be');
    } else if (f.name === 'coconut') {
      ellipse(c, 0, 0, 27, 29, '#92775a');
    } else {
      for (let i = 0; i < 16; i++) {
        let a = i * 2.4;
        let d = 15 + (i % 3) * 10;
        ellipse(
          c,
          Math.cos(a) * d,
          Math.sin(a) * d,
          2,
          3,
          f.name === 'peach' ? '#b87745' : '#352824',
        );
      }
      if (f.name === 'kiwi') ellipse(c, 0, 0, 11, 16, '#fff1c2');
    }
    c.restore();
  } else {
    if (f.name === 'watermelon') {
      c.save();
      c.beginPath();
      c.ellipse(0, 0, 54, 58, 0, 0, 7);
      c.clip();
      c.strokeStyle = '#b8d65a88';
      c.lineWidth = 8;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(i * 18, -62);
        c.bezierCurveTo(i * 27 - 8, -15, i * 27 + 8, 20, i * 16, 62);
        c.stroke();
      }
      c.restore();
    }
    if (f.name === 'strawberry' || f.name === 'dragon-fruit') {
      for (let i = 0; i < 30; i++) {
        let a = i * 2.4,
          d = Math.sqrt(i / 30) * 46;
        ellipse(
          c,
          Math.cos(a) * d,
          Math.sin(a) * d,
          1.6,
          3,
          f.name === 'strawberry' ? '#ffe398' : '#a6d964',
        );
      }
    }
    if (f.name === 'orange' || f.name === 'lime' || f.name === 'coconut' || f.name === 'kiwi') {
      c.globalAlpha = 0.22;
      for (let i = 0; i < 100; i++) {
        let a = i * 2.4,
          d = Math.sqrt(i / 100) * 50;
        ellipse(c, Math.cos(a) * d, Math.sin(a) * d, 1, 1, '#fff4b8');
      }
      c.globalAlpha = 1;
    }
    if (f.name === 'pineapple') {
      c.save();
      c.beginPath();
      c.arc(0, 0, 53, 0, 7);
      c.clip();
      c.strokeStyle = '#85582599';
      c.lineWidth = 2;
      for (let i = -90; i < 90; i += 17) {
        c.beginPath();
        c.moveTo(i - 60, -60);
        c.lineTo(i + 60, 60);
        c.moveTo(i + 60, -60);
        c.lineTo(i - 60, 60);
        c.stroke();
      }
      c.restore();
    }
    if (f.name === 'peach') {
      c.strokeStyle = '#bd684e80';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -43);
      c.bezierCurveTo(-15, -4, 18, 20, 1, 46);
      c.stroke();
    }
    c.fillStyle = '#6f482c';
    c.fillRect(-3, -62, 6, 15);
    c.save();
    c.translate(5, -53);
    c.rotate(-0.45);
    ellipse(c, 10, -3, 19, 8, '#8fb943');
    c.restore();
    if (f.name === 'pineapple') {
      for (let i = -2; i <= 2; i++) {
        c.fillStyle = i % 2 ? '#5ea44b' : '#a8cd5d';
        c.beginPath();
        c.moveTo(-18, -40);
        c.lineTo(i * 13, -81 + Math.abs(i) * 5);
        c.lineTo(19, -40);
        c.fill();
      }
    }
    c.save();
    c.rotate(-0.5);
    ellipse(c, -15, -31, 18, 7, '#ffffff35');
    c.restore();
    if (f.name === 'golden') {
      c.fillStyle = '#fff8c0';
      c.font = 'bold 40px serif';
      c.textAlign = 'center';
      c.fillText('✦', 0, 14);
    }
  }
  return canvas;
}
export function bombCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 160;
  const c = canvas.getContext('2d');
  c.translate(80, 89);
  const g = c.createRadialGradient(-22, -25, 3, 0, 0, 65);
  g.addColorStop(0, '#687b7c');
  g.addColorStop(0.5, '#27373d');
  g.addColorStop(1, '#0a1118');
  ellipse(c, 0, 0, 51, 51, g);
  c.strokeStyle = '#bd9d67';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(0, -49);
  c.quadraticCurveTo(0, -83, 28, -67);
  c.stroke();
  ellipse(c, 0, -48, 13, 7, '#64767a');
  c.fillStyle = '#ff7850';
  c.font = 'bold 48px sans-serif';
  c.textAlign = 'center';
  c.fillText('✕', 0, 17);
  c.shadowColor = '#ffb62e';
  c.shadowBlur = 17;
  c.fillStyle = '#ffe593';
  c.font = '35px serif';
  c.fillText('✦', 30, -55);
  return canvas;
}
export function registerAssets(scene) {
  for (const f of FRUITS) {
    for (const half of [0, -1, 1]) {
      const key = f.name + (half < 0 ? '-left' : half > 0 ? '-right' : '');
      const canvas = fruitCanvas(f, half);
      const texture = scene.textures.addCanvas(key, canvas);
      if (!ATLAS_FRAMES[f.name])
        loadSprite(texture, canvas, '/assets/fruits/' + (half ? 'halves/' : '') + key + '.png');
    }
  }
  const canvas = bombCanvas();
  const texture = scene.textures.addCanvas('bomb', canvas);
  loadSprite(texture, canvas, '/assets/effects/bomb.png');
  scene.artworkReady = applyAtlas(scene.textures);
}

function loadSprite(texture, canvas, path) {
  const image = new Image();
  image.onload = () => {
    const context = canvas.getContext('2d');
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();
    texture.refresh();
  };
  image.onerror = () => {
    /* The original procedural texture is already ready. */
  };
  image.src = path;
}
