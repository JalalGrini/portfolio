import * as Phaser from "phaser";
import townData from "@/public/assets/game/town.json";
import { gameBus } from "./bus";
import { rooms, roomProps } from "./rooms";
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
      for (const id of Object.keys(rooms))
        this.load.image(`room-${id}`, `/assets/rooms/floor-${id}.png`);
      for (const prop of roomProps)
        this.load.image(`interior-${prop}`, `/assets/rooms/${prop}.png`);
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
      idleUntil?: number;
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
    private marker?: Phaser.GameObjects.Ellipse;
    private transitioning = false;
    private lastStep = 0;
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
      this.transitioning = false;
      this.lastStep = 0;
    }
    create() {
      this.widthPx = this.roomMode ? 704 : townData.width;
      this.heightPx = this.roomMode ? 512 : townData.height;
      this.add
        .image(0, 0, this.roomMode ? `room-${this.entry.building}` : "ground")
        .setOrigin(0)
        .setDepth(-10000);
      this.solids = this.roomMode
        ? this.makeRoom()
        : townData.solids.map((s) => ({ ...s }));
      if (!this.roomMode) {
        for (const o of townData.objects) {
          const image = this.add
            .image(o.x, o.y, o.key)
            .setOrigin(0)
            .setDepth(o.depth);
          if (!reduced && ["tree", "pine", "bush", "flowers"].includes(o.key)) {
            image
              .setOrigin(0.5, 1)
              .setPosition(o.x + image.width / 2, o.y + image.height);
            this.tweens.add({
              targets: image,
              angle: { from: -0.35, to: 0.35 },
              duration: 2600 + (o.x % 1300),
              delay: o.y % 1400,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });
          }
        }
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
      cam.setZoom(
        this.roomMode && this.scale.width >= 600
          ? Math.min(2, this.scale.width / 704, this.scale.height / 512)
          : this.scale.width < 600
            ? 1.45
            : 2,
      );
      cam.startFollow(
        this.player,
        true,
        reduced ? 1 : 0.12,
        reduced ? 1 : 0.12,
      );
      cam.roundPixels = true;
      this.onResize(this.scale.gameSize);
      if (!reduced) {
        this.transitioning = true;
        cam.fadeIn(500, 14, 25, 20);
        this.time.delayedCall(500, () => {
          this.transitioning = false;
          gameBus.emit("transition", null);
        });
      } else gameBus.emit("transition", null);
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
          if (v) {
            this.path = [];
            this.tweens.pauseAll();
          } else this.tweens.resumeAll();
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
              this.travel("Town", {
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
      const cam = this.cameras.main;
      cam.setSize(size.width, size.height);
      if (this.roomMode && size.width >= 600) {
        cam.setZoom(Math.min(2, size.width / 704, size.height / 512));
        cam.stopFollow();
        cam.removeBounds();
        cam.centerOn(352, 256);
      } else {
        cam.setBounds(0, 0, this.widthPx, this.heightPx);
        cam.setZoom(size.width < 600 ? 1.45 : 2);
        if (this.player)
          cam.startFollow(
            this.player,
            true,
            reduced ? 1 : 0.12,
            reduced ? 1 : 0.12,
          );
      }
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
      const id = this.entry.building!;
      const design = rooms[id];
      const solids: Rect[] = [
        { x: 0, y: 0, w: 704, h: 106 },
        { x: 0, y: 0, w: 20, h: 512 },
        { x: 684, y: 0, w: 20, h: 512 },
        { x: 0, y: 486, w: 300, h: 26 },
        { x: 404, y: 486, w: 300, h: 26 },
      ];
      for (const prop of design.furniture) {
        const image = this.add
          .image(
            prop.x,
            prop.y,
            roomProps.includes(prop.key) ? `interior-${prop.key}` : prop.key,
          )
          .setOrigin(0);
        image.setDepth(prop.y + image.height);
        solids.push({
          x: prop.x,
          y: prop.y + image.height - prop.h,
          w: prop.w,
          h: prop.h,
        });
        if (prop.key === "reading-lamp") {
          const glow = this.add
            .ellipse(prop.x + 16, prop.y + 44, 100, 54, 0xffdda2, 0.1)
            .setDepth(-800);
          if (!reduced)
            this.tweens.add({
              targets: glow,
              alpha: { from: 0.07, to: 0.13 },
              duration: 2400,
              yoyo: true,
              repeat: -1,
            });
        }
        if (prop.key === "laptop") {
          const led = this.add
            .rectangle(prop.x + 13, prop.y + 16, 2, 2, design.accent)
            .setDepth(prop.y + 33);
          if (!reduced)
            this.tweens.add({
              targets: led,
              alpha: { from: 0.2, to: 1 },
              duration: 1400,
              yoyo: true,
              repeat: -1,
            });
        }
      }
      // A small wall plaque, not an obstructing in-world heading.
      const building = buildings.find((b) => b.id === id)!;
      this.add
        .text(352, 38, building.name, {
          fontFamily: "Pixelify Sans",
          fontSize: "17px",
          color: "#fff1ce",
          backgroundColor: "#253c34",
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5)
        .setDepth(115);
      // Each room has its own readable station in front of its focal object.
      const station = this.add
        .ellipse(
          design.notes.x,
          design.notes.y + 6,
          42,
          14,
          design.accent,
          0.14,
        )
        .setStrokeStyle(1, design.accent, 0.6)
        .setDepth(-750);
      if (!reduced)
        this.tweens.add({
          targets: station,
          alpha: { from: 0.45, to: 1 },
          scaleX: { from: 0.9, to: 1.1 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
        });
      this.add
        .text(design.notes.x, design.notes.y - 22, design.note, {
          fontFamily: "Pixelify Sans",
          fontSize: "11px",
          color: "#fff1ce",
          backgroundColor: "#253c34",
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(design.notes.y + 6);
      this.add
        .text(352, 477, "↓ TOWN SQUARE", {
          fontFamily: "Pixelify Sans",
          fontSize: "13px",
          color: "#f4e5bc",
          backgroundColor: "#253c34",
          padding: { x: 8, y: 4 },
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
      for (const o of townData.objects.filter((o) => o.key === "fountain")) {
        for (let i = 0; i < 3; i++) {
          const ripple = this.add
            .ellipse(o.x + 48, o.y + 66, 12, 5)
            .setStrokeStyle(1, 0xd8f3e4, 0.5)
            .setDepth(o.depth + 1);
          this.tweens.add({
            targets: ripple,
            scaleX: 3,
            scaleY: 2.2,
            alpha: 0,
            duration: 1800,
            delay: i * 600,
            repeat: -1,
          });
        }
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
          // A free grid-cell center is not enough: small pots can block an
          // edge between two free centers. Validate the entire walking segment.
          let clear = true;
          for (let step = 1; step <= 4; step++) {
            if (
              !this.free(
                p.x * 32 + 16 + dx * step * 8,
                p.y * 32 + 16 + dy * step * 8,
              )
            ) {
              clear = false;
              break;
            }
          }
          if (!clear) continue;
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
      const center = { x: start.x * 32 + 16, y: start.y * 32 + 16 };
      if (distance(this.player, center) > 3 && this.free(center.x, center.y))
        path.unshift(center);
      this.path = path;
      this.walkBlocked = 0;
      this.marker?.destroy();
      const marker = this.add
        .ellipse(goal.x * 32 + 16, goal.y * 32 + 16, 18, 9, 0xf4e8b4, 0.12)
        .setStrokeStyle(1.5, 0xf4e8b4, 0.9)
        .setDepth(1);
      this.marker = marker;
      if (!reduced)
        this.tweens.add({
          targets: marker,
          scaleX: 1.8,
          scaleY: 1.8,
          alpha: 0,
          duration: 650,
          repeat: 1,
          onComplete: () => marker.destroy(),
        });
      else this.time.delayedCall(1200, () => marker.destroy());
    }
    private travel(scene: string, data: Entry) {
      if (this.transitioning) return;
      this.transitioning = true;
      this.path = [];
      this.touch = { x: 0, y: 0 };
      gameBus.emit("near", null);
      if (!reduced)
        gameBus.emit("transition", {
          label: data.building
            ? buildings.find((b) => b.id === data.building)!.name
            : "Founders’ Square",
          building: data.building,
        });
      if (reduced) {
        this.scene.start(scene, data);
        return;
      }
      const camera = this.cameras.main;
      camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.time.delayedCall(130, () => this.scene.start(scene, data)),
      );
      camera.fadeOut(320, 14, 24, 20);
    }
    private updateNear() {
      let n: typeof this.near = null;
      if (this.roomMode) {
        if (distance(this.player, rooms[this.entry.building!].notes) < 76)
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
      if (!this.near || this.transitioning) return;
      const n = this.near;
      if (n.kind === "door") {
        const b = townData.buildings.find((b) => b.id === n.id)!;
        this.travel("Interior", {
          building: b.id as BuildingId,
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
      this.travel("Town", { returnPosition: this.entry.returnPosition });
    }
    update(time: number, delta: number) {
      if (!this.player || !this.keys || this.transitioning) return;
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
        if (
          moving &&
          !reduced &&
          !this.roomMode &&
          time - this.lastStep > 170
        ) {
          this.lastStep = time;
          const dust = this.add
            .ellipse(this.player.x, this.player.y - 2, 6, 3, 0xe2d5a6, 0.28)
            .setDepth(this.player.y - 1);
          this.tweens.add({
            targets: dust,
            x: dust.x - dx * 8,
            y: dust.y - 4,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.5,
            duration: 420,
            onComplete: () => dust.destroy(),
          });
        }
        for (const v of this.villagers) {
          if (reduced) {
            v.sprite.play(`npc${v.offset}-idle-2`, true);
            continue;
          }
          if (time < (v.idleUntil || 0)) {
            v.sprite.play(`npc${v.offset}-idle-2`, true);
            continue;
          }
          const p = v.points[v.index],
            d = distance(v.sprite, p);
          if (d < 3) {
            v.index = (v.index + 1) % v.points.length;
            v.idleUntil = time + 1000 + v.offset * 550;
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
