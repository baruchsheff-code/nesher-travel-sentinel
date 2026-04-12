

## Nesher — Premium Travel App Homepage

### What we're building
A single, pixel-perfect mobile-first homepage for "Nesher" — a premium dark-mode travel app with gold accents.

### Design System (global)
- Dark mode only, deep navy background (#0A0F1E), card bg #1A2332
- Gold accent #C9A84C, alert red #E74C3C
- White primary text, #8899AA secondary text
- Inter font throughout (14/18/28px)
- 16px border radius, subtle gold borders on cards
- 200ms fade transitions, no sharp corners

### Homepage Layout (full screen, vertically centered)
1. **Top-left logo**: "Nesher" in gold 32px bold with eagle wing icon (Lucide `Bird` or similar)
2. **Hero section** (centered):
   - Headline: "Book smarter. Travel safer. Recover faster." — white, 36px
   - Subtext: "Your AI travel agent — licensed, intelligent, always watching." — secondary, 16px
3. **Search bar**: Full-width (32px padding), #1A2332 background, gold search icon, placeholder "Where do you want to go?", rounded
4. **Trust badges row**: Three badges with emoji icons, secondary text, vertical dividers
5. **Floating AI button**: Fixed bottom-right, 56px gold circle with chat bubble icon

### Implementation
- Update CSS variables for the dark theme
- Add Inter font via Google Fonts
- Build the homepage as a single responsive component
- Add fade-in animation on mount

