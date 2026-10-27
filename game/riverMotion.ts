import * as Phaser from "phaser";
/** Decorative source-art ripples only: never part of collisions or guide routing. */
export function renderRiverMotion(
  scene: Phaser.Scene,
  points: { x: number; y: number; phase: number }[],
  reduced: boolean,
) {
  if (reduced) return; // Static ripples are already baked into the source-derived terrain.
  for (const p of points) {
    const wave = scene.add
      .image(p.x, p.y, "outdoor-ripple")
      .setDepth(-9000)
      .setAlpha(0.08);
    scene.tweens.add({
      targets: wave,
      alpha: { from: 0.06, to: 0.28 },
      y: p.y + 2,
      duration: 2600,
      delay: p.phase,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }
}
