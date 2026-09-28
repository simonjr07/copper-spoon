# Public Image Assets

## System

Copper Spoon uses a cohesive, AI-generated editorial food-photography set created with the built-in image generator. Application assets are optimized WebP derivatives under `public/images`; generated source PNGs remain outside the repository. Images contain no people, text, logos, watermarks, or third-party brand material.

`next/image` provides responsive source selection and lazy loading. The homepage hero alone uses `preload`; menu cards and item details use `fill`, explicit `sizes`, fixed-ratio containers, and `object-cover`. `MenuVisual` supplies a branded fallback for absent or failed image loads.

## Asset map

| Route/data use | Repository asset |
| --- | --- |
| Homepage hero | `/images/hero/hero-copper-spoon.webp` |
| Copper Spoon Burger | `/images/menu/copper-spoon-burger.webp` |
| Ember Herb Fries | `/images/menu/ember-herb-fries.webp` |
| Charred Seasonal Greens | `/images/menu/charred-seasonal-greens.webp` |
| Garden Grain Bowl | `/images/menu/garden-grain-bowl.webp` |
| Roasted Tomato Toast | `/images/menu/roasted-tomato-toast.webp` |
| Citrus Sparkler | `/images/menu/citrus-sparkler.webp` |
| Dark Chocolate Torte | `/images/menu/dark-chocolate-torte.webp` |

All current files are 1536 × 1024 WebP images. They were exported at quality 82 and are approximately 165–312 KB each.

## Final prompt set

The shared visual anchor was: photorealistic natural-light editorial food photography for a warm, modern, premium-casual, internationally neutral restaurant; cream limestone tabletop; handmade copper-toned ceramics; soft directional late-morning window light; gentle natural shadows; cream, copper, charcoal, and muted botanical palette; landscape 3:2, slight overhead three-quarter framing; authentic food texture and realistic portions; no people, hands, text, logos, watermark, branded packaging, stock-photo gloss, dark luxury styling, oversaturation, or impossible food geometry.

The hero requested one table spread containing the burger, herb fries, grain bowl, roasted tomato toast, seasonal greens, citrus sparkler, and dark chocolate dessert. Each menu asset reused that hero as a style reference and requested one isolated menu subject:

- Sesame-bun beef burger with pale cheddar, crisp leaves, pickled red onion, copper-colored sauce, and a few herb fries.
- Skin-on herb fries with charred scallion salt and roasted garlic dip.
- Charred seasonal greens with toasted seeds, preserved lemon, and herb oil.
- Herbed grain bowl with roasted vegetables, greens, chickpeas, radish, seeds, and lemon tahini.
- Sourdough toast with whipped herb cheese, roasted red/golden tomatoes, basil, and seeds.
- Sparkling citrus drink with lemon, rosemary, ice, bubbles, and condensation.
- Restrained bittersweet chocolate torte with toasted hazelnut and cultured cream.

## Adding or replacing an asset

Use a clear lowercase hyphenated filename, match the established shoot, export a reasonably sized WebP, store it beneath `public/images`, and reference it with a root-relative `/images/...` path. Update seed data when the menu path changes. Do not introduce external hotlinks or remote image dependencies without a new reviewed decision.
