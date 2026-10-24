import * as Phaser from "phaser";
import townData from "@/public/assets/game/town.json";
import { gameBus } from "./bus";
import { buildings, BuildingId } from "@/content/portfolio";
type Rect = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
type Entry = {
  building?: BuildingId;
  returnPosition?: Point;
  goto?: BuildingId;
};
type WorldBuilding = (typeof townData.buildings)[number];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function createGame(
  parent: HTMLElement,
  sheets: Record<string, string>,
  initialReduced: boolean,
) {
  let reduced = initialReduced;
  class Boot extends Phaser.Scene {
    constructor() {
      super("Boot");
    }
    preload() {
      this.load.on("loaderror", () =>
        gameBus.emit(
          "error",
          "A world asset could not load. Check your connection or use the classic portfolio.",
        ),
      );
      this.load.image("ground", "/assets/game/town-ground.png");
      this.load.image("room", "/assets/game/room-ground.png");
      for (const key of townData.textures)
        this.load.image(key, `/assets/game/${key}.png`);
      for (const [key, url] of Object.entries(sheets))
        this.load.spritesheet(key, url, { frameWidth: 64, frameHeight: 64 });
    }
    create() {
      for (const key of Object.keys(sheets))
        for (const [kind, base, n, fps] of [
          ["walk", 0, 9, 9],
          ["idle", 4, 2, 2],
          ["run", 8, 8, 12],
          ["sit", 12, 3, 2],
          ["emote", 16, 3, 5],
        ] as [string, number, number, number][]) {
          for (let dir = 0; dir < 4; dir++)
            this.anims.create({
              key: `${key}-${kind}-${dir}`,
              frames: this.anims.generateFrameNumbers(key, {
                start: (base + dir) * 9,
                end: (base + dir) * 9 + n - 1,
              }),
              frameRate: fps,
              repeat: -1,
            });
        }
      this.scene.start("Town");
    }
  }
  class World extends Phaser.Scene {
    private roomMode: boolean;
    private entry: Entry = {};
    private solids: Rect[] = [];
    private player!: Phaser.GameObjects.Sprite;
    private guide?: Phaser.GameObjects.Sprite;
    private villagers: {
      sprite: Phaser.GameObjects.Sprite;
      points: Point[];
      index: number;
      offset: number;
    }[] = [];
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private dir = 2;
    private path: Point[] = [];
    private paused = false;
    private touch = { x: 0, y: 0 };
    private near: { label: string; kind: string; id?: string } | null = null;
    private lastEmit = 0;
    private emoteUntil = 0;
    private sitting = false;
    private off: (() => void)[] = [];
    private widthPx = 0;
    private heightPx = 0;
    private marker?: Phaser.GameObjects.Text;
    private walkBlocked = 0;
    constructor(key: string, roomMode = false) {
      super(key);
      this.roomMode = roomMode;
    }
    init(data: Entry) {
      this.entry = data;
      this.path = [];
      this.off = [];
      this.villagers = [];
      this.near = null;
      this.paused = false;
      this.sitting = false;
      this.touch = { x: 0, y: 0 };
      this.emoteUntil = 0;
    }
    create() {
      this.widthPx = this.roomMode ? 704 : townData.width;
      this.heightPx = this.roomMode ? 512 : townData.height;
      this.add
        .image(0, 0, this.roomMode ? "room" : "ground")
        .setOrigin(0)
        .setDepth(-10000);
      this.solids = this.roomMode
        ? this.makeRoom()
        : townData.solids.map((s) => ({ ...s }));
      if (!this.roomMode) {
        for (const o of townData.objects)
          this.add.image(o.x, o.y, o.key).setOrigin(0).setDepth(o.depth);
        this.buildLabels();
        this.makeNPCs();
      }
      const spawn = this.roomMode
        ? { x: 352, y: 428 }
        : this.entry.returnPosition || townData.spawn;
      this.player = this.add
        .sprite(spawn.x, spawn.y, "visitor")
        .setOrigin(0.5, 0.875)
        .setDepth(spawn.y);
      this.player.play("visitor-idle-2");
      const cam = this.cameras.main;
      cam.setBounds(0, 0, this.widthPx, this.heightPx);
      cam.setBackgroundColor("#111c18");
      cam.setZoom(this.scale.width < 600 ? 1.45 : 2);
      cam.startFollow(
        this.player,
        true,
        reduced ? 1 : 0.12,
        reduced ? 1 : 0.12,
      );
      cam.roundPixels = true;
      if (!reduced) cam.fadeIn(400, 14, 25, 20);
      this.scale.on("resize", this.onResize, this);
      this.events.once("shutdown", () => {
        this.off.forEach((f) => f());
        this.scale.off("resize", this.onResize, this);
      });
      this.keys = this.input.keyboard!.addKeys(
        {
          up: "UP",
          down: "DOWN",
          left: "LEFT",
          right: "RIGHT",
          w: "W",
          a: "A",
          s: "S",
          d: "D",
          run: "SHIFT",
          interact: "E",
          wave: "F",
          sit: "Q",
          exit: "ESC",
        },
        false,
      ) as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (this.paused) return;
        const world = cam.getWorldPoint(p.x, p.y);
        this.moveTo(world);
      });
      this.off.push(
        gameBus.on("pause", (v) => {
          this.paused = v;
          this.input.keyboard!.enabled = !v;
          Object.values(this.keys).forEach((key) => key.reset());
          this.touch = { x: 0, y: 0 };
          if (v) this.path = [];
        }),
        gameBus.on("reduced", (v) => {
          reduced = v;
          cam.setLerp(v ? 1 : 0.12);
          if (v) this.tweens.killAll();
        }),
        gameBus.on("action", (a) => {
          if (a.type === "direction") {
            this.touch = { x: a.x || 0, y: a.y || 0 };
            this.path = [];
            return;
          }
          if (this.paused) return;
          if (a.type === "interact") this.interact();
          if (a.type === "wave") {
            this.emoteUntil = this.time.now + 1000;
            this.path = [];
          }
          if (a.type === "sit") {
            this.sitting = !this.sitting;
            this.path = [];
          }
          if (a.type === "exit" && this.roomMode) this.exitRoom();
          if (a.type === "navigate" && a.id) {
            if (this.roomMode)
              this.scene.start("Town", {
                returnPosition: this.entry.returnPosition,
                goto: a.id,
              });
            else {
              const b = townData.buildings.find((b) => b.id === a.id)!;
              this.moveTo({ x: b.doorX, y: b.doorY + 22 });
            }
          }
        }),
      );
      const name = this.roomMode
        ? buildings.find((b) => b.id === this.entry.building)!.name
        : "Founders’ Square";
      gameBus.emit("location", {
        name,
        room: this.roomMode ? this.entry.building! : null,
      });
      gameBus.emit("ready", undefined);
      if (this.entry.goto) {
        const b = townData.buildings.find((b) => b.id === this.entry.goto)!;
        this.moveTo({ x: b.doorX, y: b.doorY + 22 });
      }
      if (!this.roomMode && !reduced) this.makeAtmosphere();
    }
    private onResize(size: Phaser.Structs.Size) {
      this.cameras.main
        .setSize(size.width, size.height)
        .setZoom(size.width < 600 ? 1.45 : 2);
    }
    private buildLabels() {
      for (const b of townData.buildings) {
        this.add
          .text(b.doorX, b.doorY + 27, b.label, {
            fontFamily: "Pixelify Sans",
            fontSize: "15px",
            color: "#f1efda",
            backgroundColor: "#253c30",
            padding: { x: 7, y: 4 },
            align: "center",
          })
          .setOrigin(0.5, 0)
          .setDepth(b.doorY + 35);
      }
    }
    private makeRoom(): Rect[] {
      const id = this.entry.building;
      const solids: Rect[] = [
        { x: 0, y: 0, w: 704, h: 108 },
        { x: 0, y: 0, w: 20, h: 512 },
        { x: 684, y: 0, w: 20, h: 512 },
        { x: 0, y: 486, w: 300, h: 26 },
        { x: 404, y: 486, w: 300, h: 26 },
      ];
      const put = (key: string, x: number, y: number, w: number, h: number) => {
        const image = this.add.image(x, y, key).setOrigin(0);
        image.setDepth(y + image.height);
        solids.push({ x, y: y + image.height - h, w, h });
      };
      for (const x of [64, 128, 448, 512]) put("bookshelf", x, 70, 64, 42);
      if (id === "about") {
        put("bed", 70, 180, 64, 70);
        put("piano", 440, 185, 128, 50);
        put("plant", 610, 140, 28, 15);
      } else if (id === "lab" || id === "office") {
        for (const x of [70, 450]) {
          put("desk", x, 180, 96, 24);
          put("chair", x + 30, 222, 32, 22);
          this.add.image(x + 48, 176, "laptop").setDepth(215);
        }
        put("cabinet", 590, 170, 64, 40);
      } else if (id === "library" || id === "academy") {
        for (const x of [70, 510])
          for (const y of [170, 270]) put("bookshelf", x, y, 64, 38);
      } else if (id === "workshop") {
        put("piano", 70, 180, 128, 60);
        put("cabinet", 530, 180, 64, 40);
      } else {
        put("mailboxes", 94, 154, 32, 40);
        put("mailboxes", 550, 154, 32, 40);
        put("desk", 480, 250, 96, 24);
      }
      put("desk", 304, 180, 96, 25);
      for (const x of [240, 432]) put("chair", x, 322, 32, 22);
      for (const x of [48, 620]) put("plant", x, 390, 28, 14);
      this.add.image(352, 178, "laptop").setDepth(216);
      this.add
        .text(352, 252, "FIELD NOTES", {
          fontFamily: "Pixelify Sans",
          fontSize: "16px",
          color: "#ece8c8",
          backgroundColor: "#28392e",
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(270);
      this.add
        .text(352, 475, "↓ TOWN SQUARE", {
          fontFamily: "Pixelify Sans",
          fontSize: "14px",
          color: "#e8debd",
          backgroundColor: "#28392e",
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(490);
      return solids;
    }
    private makeNPCs() {
      this.guide = this.add
        .sprite(30.5 * 32, 25.5 * 32, "jalal")
        .setOrigin(0.5, 0.875)
        .setDepth(25.5 * 32);
      this.guide.play("jalal-idle-2");
      this.add
        .text(this.guide.x, this.guide.y - 56, "Jalal", {
          fontFamily: "Pixelify Sans",
          fontSize: "13px",
          color: "#fff8df",
          backgroundColor: "#293e32",
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(2000);
      const routes: Point[][] = [
        [
          { x: 25 * 32, y: 20 * 32 },
          { x: 31 * 32, y: 20 * 32 },
          { x: 31 * 32, y: 22 * 32 },
          { x: 25 * 32, y: 22 * 32 },
        ],
        [
          { x: 27 * 32, y: 30 * 32 },
          { x: 29 * 32, y: 30 * 32 },
          { x: 29 * 32, y: 36 * 32 },
          { x: 27 * 32, y: 36 * 32 },
        ],
      ];
      routes.forEach((points, i) => {
        const sprite = this.add
          .sprite(points[0].x, points[0].y, `npc${i}`)
          .setOrigin(0.5, 0.875);
        sprite.play(`npc${i}-idle-2`);
        this.villagers.push({ sprite, points, index: 1, offset: i });
      });
    }
    private makeAtmosphere() {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xdfd29a, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture("mote", 2, 2);
      g.destroy();
      for (let i = 0; i < 22; i++) {
        const mote = this.add
          .image(
            Phaser.Math.Between(120, 1660),
            Phaser.Math.Between(100, 1300),
            "mote",
          )
          .setAlpha(0.15)
          .setDepth(3000);
        this.tweens.add({
          targets: mote,
          x: mote.x + Phaser.Math.Between(-70, 70),
          y: mote.y - 50,
          alpha: { from: 0, to: 0.45 },
          duration: Phaser.Math.Between(4000, 8500),
          yoyo: true,
          repeat: -1,
          delay: i * 150,
        });
      }
      // Time-aware grading, intentionally subtle so paths and text stay readable.
      const hour = new Date().getHours();
      if (hour >= 19 || hour < 7) {
        this.add
          .rectangle(0, 0, townData.width, townData.height, 0x102633, 0.12)
          .setOrigin(0)
          .setDepth(2800);
        for (const o of townData.objects.filter((o) => o.key === "lamp")) {
          const glow = this.add
            .circle(o.x + 13, o.y + 17, 27, 0xf6d994, 0.06)
            .setDepth(2801);
          this.tweens.add({
            targets: glow,
            alpha: 0.1,
            duration: 1700,
            yoyo: true,
            repeat: -1,
          });
        }
      }
    }
    private free(x: number, y: number) {
      if (x < 16 || y < 24 || x > this.widthPx - 16 || y > this.heightPx - 12)
        return false;
      const a = { x: x - 10, y: y - 11, w: 20, h: 12 };
      return !this.solids.some(
        (b) =>
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y,
      );
    }
    private moveTo(target: Point) {
      this.sitting = false;
      this.emoteUntil = 0;
      const cols = Math.floor(this.widthPx / 32),
        rows = Math.floor(this.heightPx / 32);
      const start = {
        x: Math.floor(this.player.x / 32),
        y: Math.floor(this.player.y / 32),
      };
      let goal = {
        x: Phaser.Math.Clamp(Math.floor(target.x / 32), 0, cols - 1),
        y: Phaser.Math.Clamp(Math.floor(target.y / 32), 0, rows - 1),
      };
      const walk = (x: number, y: number) =>
        this.free(x * 32 + 16, y * 32 + 16);
      if (!walk(goal.x, goal.y)) {
        let found = false;
        for (let r = 1; r <= 4 && !found; r++)
          for (let yy = -r; yy <= r && !found; yy++)
            for (let xx = -r; xx <= r; xx++)
              if (walk(goal.x + xx, goal.y + yy)) {
                goal = { x: goal.x + xx, y: goal.y + yy };
                found = true;
                break;
              }
        if (!found) return;
      }
      const key = (p: Point) => `${p.x},${p.y}`;
      const open = [start],
        came = new Map<string, Point>(),
        cost = new Map<string, number>([[key(start), 0]]);
      let found = false;
      let loops = 0;
      while (open.length && loops++ < 4000) {
        open.sort(
          (a, b) =>
            cost.get(key(a))! +
            Math.abs(a.x - goal.x) +
            Math.abs(a.y - goal.y) -
            (cost.get(key(b))! +
              Math.abs(b.x - goal.x) +
              Math.abs(b.y - goal.y)),
        );
        const p = open.shift()!;
        if (key(p) === key(goal)) {
          found = true;
          break;
        }
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const n = { x: p.x + dx, y: p.y + dy };
          if (
            n.x < 0 ||
            n.y < 0 ||
            n.x >= cols ||
            n.y >= rows ||
            !walk(n.x, n.y)
          )
            continue;
          const c = cost.get(key(p))! + 1;
          if (c < (cost.get(key(n)) ?? Infinity)) {
            came.set(key(n), p);
            cost.set(key(n), c);
            if (!open.some((o) => key(o) === key(n))) open.push(n);
          }
        }
      }
      if (!found) {
        gameBus.emit("near", {
          label: "No clear route. Try a nearby path.",
          kind: "route",
        });
        return;
      }
      const path: Point[] = [];
      let at = goal;
      while (key(at) !== key(start)) {
        path.unshift({ x: at.x * 32 + 16, y: at.y * 32 + 16 });
        const prev = came.get(key(at));
        if (!prev) break;
        at = prev;
      }
      this.path = path;
      this.walkBlocked = 0;
      this.marker?.destroy();
      this.marker = this.add
        .text(goal.x * 32 + 16, goal.y * 32 + 16, "+", {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#fff2a9",
        })
        .setOrigin(0.5)
        .setDepth(2800);
      this.time.delayedCall(1500, () => this.marker?.destroy());
    }
    private updateNear() {
      let n: typeof this.near = null;
      if (this.roomMode) {
        if (distance(this.player, { x: 352, y: 246 }) < 88)
          n = { label: "Read the field notes", kind: "notes" };
        else if (this.player.y > 425)
          n = { label: "Return to the town", kind: "exit" };
      } else {
        const b = townData.buildings.find(
          (b) => distance(this.player, { x: b.doorX, y: b.doorY + 12 }) < 68,
        );
        if (b) n = { label: `Enter · ${b.label}`, kind: "door", id: b.id };
        else if (this.guide && distance(this.player, this.guide) < 70)
          n = { label: "Talk to Jalal", kind: "guide" };
        else {
          const v = this.villagers.find(
            (v) => distance(this.player, v.sprite) < 60,
          );
          if (v)
            n = {
              label: "Talk to a neighbor",
              kind: "neighbor",
              id: String(v.offset),
            };
        }
      }
      if (JSON.stringify(n) !== JSON.stringify(this.near)) {
        this.near = n;
        gameBus.emit("near", n);
      }
    }
    private interact() {
      this.updateNear();
      if (!this.near) return;
      const n = this.near;
      if (n.kind === "door") {
        const b = townData.buildings.find((b) => b.id === n.id)!;
        this.scene.start("Interior", {
          building: b.id,
          returnPosition: { x: b.doorX, y: b.doorY + 45 },
        });
      }
      if (n.kind === "notes") gameBus.emit("open", this.entry.building!);
      if (n.kind === "exit") this.exitRoom();
      if (n.kind === "guide")
        gameBus.emit("dialogue", {
          speaker: "Jalal",
          text: "Welcome to my little corner of the world. The observatory holds my AI and research work; the office holds my internships. Visit any door, press E to enter, and read the field notes inside. Take your time—there’s no wrong route.",
        });
      if (n.kind === "neighbor")
        gameBus.emit("dialogue", {
          speaker: "A curious neighbor",
          text:
            n.id === "0"
              ? "Sentinel and ORION live in the observatory. They’re research projects in the design stage—good questions and clear architecture come before big claims."
              : "Looking for the practical side? Try the engineering office for internships, or the workshop for applications. The post office has the CV and contact links.",
        });
    }
    private exitRoom() {
      gameBus.emit("near", null);
      this.scene.start("Town", { returnPosition: this.entry.returnPosition });
    }
    update(time: number, delta: number) {
      if (!this.player || !this.keys) return;
      const dt = Math.min(delta, 250) / 1000;
      if (!this.paused) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.interact();
        if (Phaser.Input.Keyboard.JustDown(this.keys.wave))
          this.emoteUntil = time + 1000;
        if (Phaser.Input.Keyboard.JustDown(this.keys.sit))
          this.sitting = !this.sitting;
        if (Phaser.Input.Keyboard.JustDown(this.keys.exit) && this.roomMode)
          this.exitRoom();
        let dx =
          Number(this.keys.right.isDown || this.keys.d.isDown) -
          Number(this.keys.left.isDown || this.keys.a.isDown) +
          this.touch.x;
        let dy =
          Number(this.keys.down.isDown || this.keys.s.isDown) -
          Number(this.keys.up.isDown || this.keys.w.isDown) +
          this.touch.y;
        if (dx || dy) {
          this.path = [];
          this.sitting = false;
          this.emoteUntil = 0;
        } else if (this.path.length) {
          const p = this.path[0];
          const d = distance(this.player, p);
          if (d < 5) this.path.shift();
          else {
            dx = (p.x - this.player.x) / d;
            dy = (p.y - this.player.y) / d;
          }
        }
        const moving = !!(dx || dy);
        if (moving) {
          const l = Math.hypot(dx, dy);
          dx /= l;
          dy /= l;
          this.dir =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 2 : 0;
          const speed = this.keys.run.isDown ? 175 : 105;
          const amount = this.path.length
            ? Math.min(speed * dt, distance(this.player, this.path[0]))
            : speed * dt;
          const steps = Math.max(1, Math.ceil(amount / 8));
          let changed = false;
          for (let i = 0; i < steps; i++) {
            const nx = this.player.x + (dx * amount) / steps,
              ny = this.player.y + (dy * amount) / steps;
            if (this.free(nx, this.player.y)) {
              this.player.x = nx;
              changed = true;
            }
            if (this.free(this.player.x, ny)) {
              this.player.y = ny;
              changed = true;
            }
          }
          if (!changed) {
            if (++this.walkBlocked > 10) this.path = [];
          } else this.walkBlocked = 0;
        }
        const kind =
          this.emoteUntil > time
            ? "emote"
            : this.sitting
              ? "sit"
              : moving
                ? this.keys.run.isDown
                  ? "run"
                  : "walk"
                : "idle";
        this.player.play(`visitor-${kind}-${this.dir}`, true);
        this.player.setDepth(this.player.y);
        for (const v of this.villagers) {
          if (reduced) {
            v.sprite.play(`npc${v.offset}-idle-2`, true);
            continue;
          }
          const p = v.points[v.index],
            d = distance(v.sprite, p);
          if (d < 3) {
            v.index = (v.index + 1) % v.points.length;
            continue;
          }
          const vx = (p.x - v.sprite.x) / d,
            vy = (p.y - v.sprite.y) / d;
          v.sprite.x += vx * 22 * dt;
          v.sprite.y += vy * 22 * dt;
          v.sprite.setDepth(v.sprite.y);
          const dir =
            Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 3 : 1) : vy > 0 ? 2 : 0;
          v.sprite.play(`npc${v.offset}-walk-${dir}`, true);
        }
      } else this.player.play(`visitor-idle-${this.dir}`, true);
      if (time - this.lastEmit > 130) {
        this.lastEmit = time;
        this.updateNear();
        gameBus.emit("position", {
          x: this.player.x,
          y: this.player.y,
          width: this.widthPx,
          height: this.heightPx,
        });
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: "#111c18",
    pixelArt: true,
    fps: { target: 60, smoothStep: false },
    roundPixels: true,
    antialias: false,
    scene: [Boot, new World("Town"), new World("Interior", true)],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    input: { activePointers: 3 },
    callbacks: {
      postBoot: (g) => {
        g.canvas.setAttribute(
          "aria-label",
          "Explorable pixel-art career town. Use WASD or arrows to walk, E to interact. All information is also available in the classic portfolio.",
        );
        g.canvas.setAttribute("tabindex", "0");
        g.canvas.focus({ preventScroll: true });
      },
    },
  });
  return game;
}
