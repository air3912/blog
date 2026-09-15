# World assets

Runtime art for the visual-novel prologue and interactive personal homepage.

- `backgrounds/room-desktop.webp`: main 16:9 room
- `backgrounds/room-title.webp`: darker title-screen treatment
- `backgrounds/room-mobile.webp`: recomposed 9:16 mobile room
- `characters/host-neutral.webp`: canonical transparent sprite
- `characters/host-happy.webp`: happy expression
- `characters/host-thinking.webp`: thoughtful expression
- `characters/host-surprised.webp`: surprised expression

The active lossless PNG sources are kept under `art-source/world/final-v1/`; use the WebP files here at runtime.

Buttons, dialogue panels, hover glows, and click regions should remain HTML/CSS assets so text and responsive behavior stay maintainable.
