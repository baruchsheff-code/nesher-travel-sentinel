# Nesher Travel Lovable

Build a mobile-first premium travel app called Nesher. 

DESIGN SYSTEM (apply globally to every screen):

- Dark mode only for now

- Background: #0A0F1E (deep navy)

- Card background: #1A2332

- Primary accent: #C9A84C (gold)

- Alert red: #E74C3C

- Text: #FFFFFF primary, #8899AA secondary

- Font: Inter for all UI text, sizes 14px body / 18px subheading / 28px heading

- Border radius: 16px on all cards

- All cards have a very subtle 1px border: rgba(201, 168, 76, 0.15)

- Smooth fade transitions between all pages (200ms)

- No sharp corners anywhere on the UI

HOMEPAGE (this is the only screen to build right now):

- Full screen hero section, vertically centered

- Top left: the word "Nesher" in gold (#C9A84C), bold, 32px, 

  with a small eagle wing icon to the left of it

- Hero headline (centered, white, 36px): 

  "Book smarter. Travel safer. Recover faster."

- Hero subtext (centered, secondary color, 16px): 

  "Your AI travel agent — licensed, intelligent, always watching."

- Below subtext: a large rounded search bar (full width minus 32px padding)

  Placeholder text: "Where do you want to go?"

  Gold search icon on the left inside the bar

  The bar background should be #1A2332

- Below the search bar, three trust badges in a row:

  "🛡️ Licensed Agent" | "📡 Live Crisis Intel" | "👤 24/7 Human Backup"

  Small text, secondary color, separated by vertical dividers

- No signup wall. No modal. Just the search bar, open and ready.

- Bottom of screen: a floating gold circle button (56px) 

  with a chat bubble icon — this is the AI assistant button, 

  always visible on every screen

Do not build any other screens yet. Get this homepage pixel-perfect first.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nesher-travel-sentinel.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6183874d-079c-49a9-a9e1-7c7e25f7227e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
