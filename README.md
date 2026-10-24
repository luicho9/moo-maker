# moo maker

Build your own 3D cow in the browser. Pick a breed, shape the body, add horns and extras, or start from a famous real cow. Click the cow to hear it moo.

## Features

- Nine breeds as starting points, then free colors for base, spots, snout, hooves, tuft and horns
- Coat patterns (patches, dots, belt, white face) with amount, size, sharpness and a reroll button
- Body sliders: chubbiness, legs, size, head, ears, ear tilt, snout, tail, udder and tuft
- Horns with length, curl and color; eyes (round, sleepy, lashes, wink) and blush
- Stackable accessories, one per slot: head, neck and face, each with its own color
- Scene: background color, lighting, ground and mood (calm, chewing, dancing)
- Moo pitch and length
- Shuffle everything or one section, and lock sections you want to keep
- Undo and redo (Ctrl/⌘+Z, Ctrl/⌘+Shift+Z)
- Famous cows tab with their stories
- Saved cows gallery, kept on your device
- Shareable links: the cow is stored in the URL hash (older links still work)
- PNG download

All options are defined once in `components/cow/params.ts`; the store, shuffle, share
links and haptics are derived from that list.

## Stack

Next.js, React Three Fiber, drei, postprocessing, Zustand, Tailwind and shadcn/ui.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.
