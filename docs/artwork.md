# Original artwork

The original environment was generated with the built-in image_gen tool (not the API/CLI fallback).

Saved asset: `public/assets/background/night-market.png`

The first user-supplied reference informed the original colorful arcade feel. The second supplied image (September 17, 2026, 11:14 PM) is now used directly as the fruit sprite atlas, as requested in the visual upgrade.

## Exact generation prompt

Use case: stylized-concept. Asset type: original 2D browser game environment background, landscape 1536x1024. Create a beautifully painted tropical night-market fruit slicing dojo at night. Wide stage, centered symmetrical framing with deep dark teal open empty space in central 70 percent for overlay game UI and flying fruits. Wooden market stall counter across bottom 18 percent, rustic timber posts at extreme sides, softly glowing warm orange paper lanterns dangling upper corners, palm leaves framing upper left and right, tiny warm fireflies, subtle distant tropical market roofs and mountains, quiet turquoise starry sky. Rich painterly textured premium indie game illustration, cinematic soft ambient lighting, moody dark teal and amber palette, physically dimensional wood. Keep center very dark and uncluttered, enough empty space for game elements. No text, logos, UI, characters, fruit or weapons. Original artwork, not based on any existing game.

Fallback fruit artwork and the icon are original code-generated designs, rendered by `src/assets/fruits.js` and saved as PNGs under `public/assets/fruits/` and `public/assets/fruits/halves/`. The detailed fruit sheet is copied unchanged to `public/assets/fruits/fruit-atlas.png`. Source rectangles in `src/assets/atlas.js` map nine whole fruits and their two halves into runtime textures. No new generated artwork was needed for this upgrade.
