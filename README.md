# Kid QR

A kid-friendly QR code workshop. Make codes from words, websites, WiFi details or secret messages, then watch them get built dot by dot and learn what every dot does. Scratch codes to test the backup dots, decorate them, scan real codes with the camera, and run a treasure hunt around the house. Quests, stars, XP, levels and badges keep it fun.

Runs in any modern browser (installable as an offline app on Android tablets and Chromebooks), on GitHub Pages, on any static web host, or as a desktop app (Electron).

## Features

- **Make a Code**: text, website, WiFi and secret-message templates, with a live preview, PNG download and print
- **How It Works**: an animated, narrated build of your code: eyes, rulers, settings, letters to bits, backup dots and the mask. Tap any dot to see its job.
- **Scratch Lab**: rub out dots and see how much damage each backup level can survive
- **Decorate**: colours, dot shapes and stickers, with a live check that the design still scans
- **Scanner**: camera scanning (or pick a photo) that explains what the code contains
- **Treasure Hunt**: write clues, print the codes, then scan them to track the hunt
- **Quests**: six puzzle games with stars, a daily challenge, XP, levels, badges and unlockables
- Read-aloud for every explanation, sound effects, optional procedural music

## Development

Prerequisites: [Node.js](https://nodejs.org/) 24 (see `.nvmrc`).

```bash
npm install
npm run dev          # start the dev server at http://localhost:5173
```

Other scripts:

| Command                  | What it does                                            |
| ------------------------ | ------------------------------------------------------- |
| `npm test`               | Unit tests (Vitest)                                     |
| `npm run test:e2e`       | End-to-end tests in tablet and phone viewports (Playwright; run `npx playwright install chromium` once first) |
| `npm run lint`           | ESLint                                                  |
| `npm run build`          | Type-check and build the static site into `dist/`      |
| `npm run preview`        | Serve the production build locally                      |
| `npm run electron:dev`   | Run the desktop app against the dev server              |
| `npm run electron:build` | Build a desktop installer for your OS into `release/`   |
| `npm run icons`          | Regenerate app icons from `scripts/generate-icons.mjs`  |

To test on a tablet on the same network, run `npm run dev -- --host` and open the printed network URL. Note that the camera needs HTTPS or `localhost`, so test scanning on the deployed site or with the photo picker.

## Project layout

```
src/
  app/          App shell: routing, top bar, reward pop-ups, shared state
  components/   Reusable UI (buttons, mascot, panels, QR renderer)
  core/         Framework-free logic
    qr/         QR encoder that records what every dot means
    payload/    WiFi / URL / treasure-clue formats
  features/     One folder per screen (maker, how-it-works, quests, ...)
  game/         XP, levels, badges, quests, streaks and unlockables
  services/     Audio, speech, camera, storage
  assets/       Images, sounds and emoji (see CREDITS.md)
  styles/       Design tokens and global CSS
electron/       Desktop app entry point
scripts/        Asset generation
tests/          unit/ (Vitest) and e2e/ (Playwright)
```

## Credits

Art and sound come from CC0 and openly licensed sources. See [CREDITS.md](CREDITS.md).

## License

[MIT](LICENSE)
