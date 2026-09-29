# Public Image Assets

## Image system

Copper Spoon uses a cohesive AI-generated editorial food-photography set. Application assets are optimized WebP files under public/images. Source PNG files are not stored in the repository.

Images contain no people, text, logos, watermarks, or third-party brand material.

next/image provides responsive source selection and lazy loading. The homepage hero uses preload. Menu cards and item details use fixed-ratio containers, explicit sizes, and object-cover. MenuVisual provides a fallback when an image is missing or fails to load.

## Asset map

| Use | Asset |
| --- | --- |
| Homepage hero | /images/hero/hero-copper-spoon.webp |
| Copper Spoon Burger | /images/menu/copper-spoon-burger.webp |
| Ember Herb Fries | /images/menu/ember-herb-fries.webp |
| Charred Seasonal Greens | /images/menu/charred-seasonal-greens.webp |
| Garden Grain Bowl | /images/menu/garden-grain-bowl.webp |
| Roasted Tomato Toast | /images/menu/roasted-tomato-toast.webp |
| Citrus Sparkler | /images/menu/citrus-sparkler.webp |
| Dark Chocolate Torte | /images/menu/dark-chocolate-torte.webp |

The current assets are 1536 by 1024 WebP images exported at quality 82. File sizes are approximately 165-312 KB.

## Visual direction

The image set uses natural-light editorial food photography for a warm, premium-casual restaurant. Shared characteristics include cream stone surfaces, copper-toned ceramics, soft window light, natural shadows, realistic portions, and a cream/copper/charcoal/botanical palette.

The images avoid people, hands, text, logos, branded packaging, watermarks, oversaturation, and unrealistic food geometry.

## Adding or replacing an asset

- Use a lowercase hyphenated filename.
- Match the existing lighting, framing, and palette.
- Export a reasonably sized WebP file beneath public/images.
- Reference it with a root-relative /images/... path.
- Update seed/bootstrap data when a menu path changes.
- Avoid external hotlinks and remote image dependencies unless the architecture decision changes.
