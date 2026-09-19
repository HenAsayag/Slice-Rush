# Slice Rush

**Play online:** https://henasayag.github.io/Slice-Rush/

An original browser arcade game set in a tropical night market. Built with JavaScript, Phaser 3, Canvas-generated fruit artwork, CSS, and Web Audio. No backend, CDN, account, or runtime network dependency.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). To play from a phone on your local network, run `npm run dev -- --host 0.0.0.0`, then open the computer's LAN address and the printed port.

```sh
npm run build    # production output in dist/
npm run preview # serve the production build locally
npm test        # collision, rule, trajectory, difficulty and long-run pool tests
```

With the dev server running, `node tests/browser.mjs` runs browser integration checks. Chrome is used at its standard Windows installation path; set `CHROME_PATH` for another Chromium executable. Browser tests also use the Vite-only development inspection handle; it is absent in production.

## How to play

Hold the primary mouse button or drag one finger through fruit. The full segment between input events is checked, including coalesced pointer events. Release to finish a combo. Extra touches are ignored until the active finger is released. Avoid the dark bombs marked with an orange X.

- **Unlimited:** no timer, no bombs, no miss penalty; a fast, continuous stream of individually timed fruit. Pause and choose **Finish & save score** when done. Records also checkpoint every five seconds and on pause.
- **Classic:** endless play; three missed fruits or one sliced bomb ends the round.
- **Time Attack:** 60 seconds; misses are free; a bomb subtracts 10 points, down to zero.
- **Zen:** 90 seconds; no bombs, no miss penalty, and larger fruit waves.

Normal fruit gives 1 point, pink dragon fruit gives 3, and golden fruit gives 10. Two fruits in one drag trigger Nice Slice, three or four trigger a combo, and five or more trigger Mega Slice. Combos are tracked, with a brief 50 ms slow-motion effect for strong combos outside Unlimited. Unlimited keeps its full speed. Mode clocks continue in real time during slow motion. Combos do not award extra points beyond each fruit's value.

Press **P** or **Escape** to pause/resume. Space starts from the menu or resumes a paused run. Changing tabs, losing window focus, or making a large viewport/orientation change during play automatically pauses the game. Small mobile browser-toolbar resizes keep the run moving. High scores are separate for each mode. Accuracy is sliced fruit divided by all fruit launched during the run; bombs are excluded.

Sound, music, and haptic settings persist locally. Sound starts after a user gesture. Vibration and fullscreen depend on browser/device support. If localStorage is unavailable, gameplay still works; persistence is disabled.

## Structure

```text
src/
  scenes/    GameManager state machine and MarketScene rendering/game loop
  entities/  Pooled fruit/bomb bodies and physical halves
  systems/   Spawning, difficulty, segment collision, trail, combos, particles, scoring
  ui/        Responsive DOM menu, HUD, modal dialogs, settings and results
  assets/    Original Canvas fruit generators and fail-safe image loading
  audio/     Original synthesized effects/music and custom audio hooks
  utils/     Geometry, bounded pools and resilient persistence
public/assets/
  fruits/          Ten original full fruit PNGs (including golden fruit)
  fruits/halves/   Matching left and right half PNGs
  effects/         Original bomb sprite
  ui/              Original SVG app icon
  background/      Generated original night-market illustration
  audio/           Documentation for optional replacement recordings
```

## Assets and fallbacks

Branding, UI, fallback artwork, and synthesized audio were created for this project. The user's second supplied fruit sheet is now included unchanged as `public/assets/fruits/fruit-atlas.png`; its source frames supply the detailed whole and sliced fruits. The background was created with the built-in image generation tool; see `docs/artwork.md` for the exact prompt and provenance.

Each fruit has a full texture, two half textures, juice color, radius, and score in `src/assets/fruits.js`. The supplied atlas provides nine detailed fruit varieties and their halves; golden fruit and bombs use individual PNGs. If an image is missing, the original procedural Canvas texture remains active. Fruit scale is 1.3125× on desktop and 1.0875× on narrow screens (75% of the previous size, including sliced halves), with matching collision radii and wider wave spacing. Missing background artwork leaves the teal CSS environment and swaying leaves. No missing image can stop gameplay. Fruit, halves, juice, pulp, and floating text use bounded pools.

The effects and music are fully playable Web Audio synthesis, not empty placeholders. `AUDIO_PATHS` and `AudioManager.loadCustom(name, url)` allow replacing individual effects with WAV recordings. Optional paths: `slice.wav`, `fruit_hit.wav`, `combo.wav`, `bomb.wav`, `miss.wav`, `game_over.wav`, `menu_click.wav`, and `background_music.mp3`. The ambient music is synthesized by default.

`node scripts/export-assets.mjs` regenerates the PNG sprites from the Canvas source using the running dev server and captures desktop/mobile screenshots. The 60 FPS target uses Phaser's frame loop, bounded pools and one Canvas playfield; actual performance depends on device and browser. Device-specific haptics and physical phone performance have not been measured.

## Validation

- Production build completed.
- Twelve unit tests cover collision, scoring, all modes, viewport-safe trajectories and bounded pooling during a three-minute simulated Unlimited run.
- Chrome integration checks cover five-fruit swipes, half creation, pause/resume, bombs, misses, both clocks, persistence, primary/secondary touch handling and missing-image fallback.
- Desktop and phone-sized layouts visually inspected; browser integration reports no uncaught runtime errors.

Phaser implementation references: https://docs.phaser.io/phaser/concepts/game and https://docs.phaser.io/phaser/concepts/scenes.

## Visual and audio upgrade

Music defaults on after the first user interaction (a previously saved explicit preference is respected). The original 108 BPM loop combines marimba-like plucks, chords, bass, kick, and shaker. A separate music button sits beside the sound-effects toggle. Both buses mute promptly; music pauses with the game. Knife audio layers a filtered-noise whoosh, a metallic transient, and a wet fruit impact. Quick empty swipes also make a softer whoosh.

`node tests/visual-audio.mjs` verifies the music defaults and output waveform, independent music muting, knife audio output, enlarged hitboxes, atlas loading, and desktop/mobile screenshots. The existing game integration checks still cover full-path collision and missing-image fallbacks.

## WebGL rendering and mobile fullscreen

The game explicitly uses `Phaser.WEBGL` for sprite, particle, trail and effect rendering. Canvas is only used to prepare textures and fallback artwork; it is not the gameplay renderer. Browsers without WebGL show an actionable graphics message. Losing the WebGL context pauses the run, and Phaser restores textures before the player resumes.

The **Full screen** control is available in both the menu and gameplay, with a minimum 44px touch target on mobile. It uses the standard or supported WebKit fullscreen API directly from the user's tap. If native page fullscreen is unavailable, it offers an expanded in-page view, explicitly noting that browser controls may remain visible. Tap **Exit view** to leave. Browser and operating-system restrictions still apply, particularly on iPhone.

With the dev server running, `node tests/webgl-fullscreen.mjs` checks a live WebGL rendering context, native fullscreen entry/exit, the unsupported-fullscreen fallback, mobile control sizing, context-loss recovery, and the unsupported-WebGL message.

## GitHub Pages publishing

The live game is hosted at https://henasayag.github.io/Slice-Rush/ . GitHub Pages uses **GitHub Actions** as its source. Every push to `master` runs `.github/workflows/deploy-pages.yml`, installs dependencies, runs the rule tests, builds the game, and publishes `dist/`.

`npm run build:pages` sets Vite's base to `/Slice-Rush/`. Runtime texture/audio paths use `assetUrl()` so they match the project URL; the regular local development server still runs at `/`.

To reproduce the hosted build locally:

```sh
npm run build:pages
npm run preview:pages
node tests/deployment.mjs
```

Set `SLICE_RUSH_URL` to the hosted URL to run the same production browser smoke test against GitHub Pages. It checks mobile startup, WebGL, the fullscreen control, loaded fruit/background assets, and absence of runtime or HTTP errors.

## Unlimited and mobile gameplay

Classic is first in the menu and selected by default. Gameplay requires a landscape viewport on every device. Portrait view shows a rotation prompt and blocks both touch and keyboard starts/resumes. Rotating during a run pauses it without advancing the clock; return to landscape and choose Back to slicing. Fullscreen attempts a native landscape lock where supported; the rotation prompt remains the fallback.

Unlimited remains available. Each fruit launches individually with a randomized 90–150 ms gap, gradually quickening to 70–130 ms. All modes share a single launch cooldown across waves, so slow frames or a full fruit pool never cause a simultaneous catch-up burst. Unlimited gradually increases its pace, without adding bombs, a timer, or missed-fruit penalties. Active fruit caps are 24 on compact screens and 44 on larger screens; unlaunched fruit do not count against accuracy. Classic and Time Attack also start faster. Gravity increases with launch speed so the apex stays below the HUD.

The mobile menu uses a 2×2 mode grid, larger pause controls and safe-area-aware placement. Resize synchronization keeps the WebGL canvas and swipe coordinates aligned; small toolbar resizes do not pause. Mobile particles are bounded at 360, and combo text is throttled to keep dense waves readable. Fast swipes process their final pointer-up segment.

`node tests/unlimited-browser.mjs` checks small-phone, portrait, landscape and desktop layouts; a dense endless run; touch slicing; browser-toolbar resizing; and finishing/saving an Unlimited score. These are browser/emulation checks, not physical-device performance measurements.

`node tests/landscape-browser.mjs` verifies Classic is first and selected on a fresh load, portrait start/resume blocking (including keyboard controls), fullscreen fallback, small landscape layouts, and preservation of score and clock across rotation. Returning to landscape requires an explicit resume.
