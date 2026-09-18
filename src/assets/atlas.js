// Source rectangles reference the supplied sheet without altering the original image.
export const ATLAS_URL = '/assets/fruits/fruit-atlas.png';
export const ATLAS_FRAMES = {
  watermelon: [
    [12, 40, 190, 217],
    [202, 62, 136, 194],
    [348, 62, 132, 194],
  ],
  pineapple: [
    [495, 6, 137, 253],
    [638, 8, 132, 252],
    [777, 7, 128, 252],
  ],
  orange: [
    [926, 62, 193, 195],
    [1121, 81, 150, 177],
    [1274, 81, 146, 178],
  ],
  lime: [
    [495, 279, 175, 188],
    [672, 295, 128, 164],
    [803, 294, 132, 165],
  ],
  strawberry: [
    [28, 473, 164, 199],
    [200, 492, 133, 180],
    [337, 487, 135, 183],
  ],
  kiwi: [
    [492, 488, 160, 183],
    [657, 502, 142, 170],
    [799, 504, 139, 168],
  ],
  peach: [
    [15, 675, 197, 213],
    [214, 706, 142, 174],
    [355, 708, 133, 171],
  ],
  coconut: [
    [491, 683, 192, 209],
    [684, 713, 143, 175],
    [827, 712, 140, 174],
  ],
  'dragon-fruit': [
    [972, 675, 170, 221],
    [1145, 678, 143, 217],
    [1288, 685, 148, 210],
  ],
};
let imagePromise;
export function loadAtlas() {
  if (!imagePromise)
    imagePromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = ATLAS_URL;
    });
  return imagePromise;
}
// Every frame occupies the same visual envelope, preserving the fruit's aspect ratio.
export function drawAtlasFrame(context, image, frame, size = 160) {
  const [x, y, w, h] = frame;
  const scale = 116 / Math.max(w, h);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size, size);
  context.drawImage(
    image,
    x,
    y,
    w,
    h,
    (size - w * scale) / 2,
    (size - h * scale) / 2,
    w * scale,
    h * scale,
  );
  context.restore();
}
export async function applyAtlas(textures) {
  const image = await loadAtlas();
  if (!image) return false;
  for (const [name, frames] of Object.entries(ATLAS_FRAMES)) {
    for (let i = 0; i < 3; i++) {
      const key = name + (i === 1 ? '-left' : i === 2 ? '-right' : '');
      const texture = textures.get(key);
      drawAtlasFrame(texture.getContext(), image, frames[i]);
      texture.refresh();
    }
  }
  return true;
}
export async function decorateWithAtlas(element, name, half = 0) {
  const image = await loadAtlas();
  if (!image) return;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 160;
  drawAtlasFrame(
    canvas.getContext('2d'),
    image,
    ATLAS_FRAMES[name][half < 0 ? 1 : half > 0 ? 2 : 0],
  );
  element.src = canvas.toDataURL();
}
