import Phaser from 'phaser';
import './style.css';
import { UI } from './ui/UI.js';
import { GameManager } from './scenes/GameManager.js';
import { MarketScene } from './scenes/MarketScene.js';
const ui = new UI();
const manager = new GameManager(ui);
let game = null;
function graphicsUnavailable() {
  document.querySelector('#play').disabled = true;
  const message = document.createElement('p');
  message.className = 'graphics-error';
  message.setAttribute('role', 'alert');
  message.textContent =
    'Graphics unavailable. Enable hardware acceleration or try a browser that supports WebGL.';
  document.querySelector('#menu').append(message);
}
function supportsWebGL() {
  try {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  } catch {
    return false;
  }
}
if (!supportsWebGL()) {
  graphicsUnavailable();
} else {
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    transparent: true,
    antialias: true,
    powerPreference: 'high-performance',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { maxTextures: 16 },
    fps: { target: 60 },
    scene: [new MarketScene(manager)],
    audio: { noAudio: true },
    banner: false,
    callbacks: {
      postBoot(game) {
        game.canvas.setAttribute('aria-label', 'Slice Rush WebGL playfield');
        game.canvas.addEventListener('webglcontextlost', () => {
          manager.pause();
          manager.audio.update(false);
        });
        game.canvas.addEventListener('webglcontextrestored', () => {
          ui.announce('Graphics restored. Ready when you are.');
        });
      },
    },
  });
}
if (import.meta.env.DEV) window.__SLICE_RUSH__ = { manager, game };
