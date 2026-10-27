import * as Phaser from "phaser";
import type { Place, Station } from "./catalog";
import {
  roomLayouts,
  roomSolids,
  roomSeats,
  type Furniture,
  furnitureDepth,
} from "./authoredRooms";
/** One authored layout per room. Art and collision anchors share the same registry. */
export function renderAuthoredRoom(
  scene: Phaser.Scene,
  p: Place,
  stations: Station[],
  reduced: boolean,
) {
  const l = roomLayouts[p.id];
  if (!l) return null;
  // Steady soft light pools are decorative effects, never replacement furniture art.
  if (!scene.textures.exists("home-lamp-glow")) {
    const tex = scene.textures.createCanvas("home-lamp-glow", 128, 128);
    if (tex) {
      const ctx = tex.getContext(),
        g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      g.addColorStop(0, "rgba(255,215,138,.8)");
      g.addColorStop(0.45, "rgba(255,185,92,.3)");
      g.addColorStop(1, "rgba(255,170,75,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      tex.refresh();
    }
  }
  for (const f of l.furniture)
    if (f.prop === "lamp")
      scene.add
        .image(f.x + f.w / 2, f.y + f.h, "home-lamp-glow")
        .setDepth(-40)
        .setAlpha(0.22)
        .setBlendMode(Phaser.BlendModes.ADD);

  for (const f of l.furniture as Furniture[]) {
    const im = scene.add
      .image(f.x, f.y, f.texture || "authored-" + f.prop)
      .setOrigin(0)
      .setDisplaySize(f.w, f.h)
      .setDepth(furnitureDepth(f));
    im.setData("room-prop", f.id);
  }
  for (const s of stations) {
    const ring = scene.add
      .ellipse(s.approach.x, s.approach.y, 20, 7, 0xf4d997, 0.1)
      .setStrokeStyle(1, 0xf4d997, 0.5)
      .setDepth(-50);
    if (!reduced)
      scene.tweens.add({
        targets: ring,
        alpha: { from: 0.25, to: 0.65 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
      });
  }
  // Descriptions stay in interactions rather than four oversized floating labels.
  scene.add
    .text(p.width / 2, 34, p.name, {
      fontFamily: "Pixelify Sans",
      fontSize: "14px",
      color: "#fff0c9",
      backgroundColor: "#294535",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5)
    .setDepth(120);
  scene.add
    .text(p.width / 2, p.height - 28, "↓ RETURN TO TOWN", {
      fontFamily: "Pixelify Sans",
      fontSize: "11px",
      color: "#fff0c9",
      backgroundColor: "#294535",
      padding: { x: 6, y: 4 },
    })
    .setOrigin(0.5)
    .setDepth(p.height);
  return { solids: roomSolids(l), seats: roomSeats(l) };
}
