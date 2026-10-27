import * as Phaser from "phaser";
import world from "./tour-world.json";
import { gameBus, Dialogue, TourState, Preferences } from "./bus";
import {
  places,
  placeById,
  stationsFor,
  domainProps,
  Station,
} from "./catalog";
import {
  tourReduce,
  initialTour,
  makePlan,
  inRoomStage,
  TourEvent,
  toSave,
  resumeIndex,
  TOUR_SAVE_KEY,
} from "./tour";
import { Point, Rect, distance, route, isFree } from "./navigation";
type Entry = { building?: string; returnPosition?: Point; goto?: string };
export function createGame(
  parent: HTMLElement,
  sheets: Record<string, string>,
  initialReduced: boolean,
) {
  const allOff = new Set<() => void>();
  let prefs: Preferences = {
    speed: 1,
    zoom: 1,
    time: "day",
    footsteps: true,
    reduced: initialReduced,
  };
  const plan = makePlan(places);
  let tour: TourState = initialTour(plan);
  try {
    // Restore where the visitor stopped so the ribbon can offer "Resume".
    const at = resumeIndex(
      JSON.parse(localStorage.getItem(TOUR_SAVE_KEY) || "null"),
      plan,
    );
    if (at !== null)
      tour = {
        ...tour,
        index: at,
        target: plan[at].id,
        beats: plan[at].beats.length,
      };
  } catch {}
  let completedPending = false;
  let guidePosition: Point = { x: world.spawn.x + 38, y: world.spawn.y - 18 };
  const emitTour = () => gameBus.emit("tour", { ...tour });
  /** Apply a tour event; returns true when the state actually changed. */
  const dispatch = (e: TourEvent) => {
    const prev = tour;
    tour = tourReduce(plan, tour, e);
    if (tour === prev) return false;
    try {
      localStorage.setItem(TOUR_SAVE_KEY, JSON.stringify(toSave(tour)));
    } catch {}
    emitTour();
    return true;
  };
  const say = (d: Dialogue) => gameBus.emit("dialogue", d);
  class Boot extends Phaser.Scene {
    constructor() {
      super("Boot");
    }
    preload() {
      this.load.on("loaderror", () =>
        gameBus.emit(
          "error",
          "A town asset could not load. Retry or use the classic portfolio.",
        ),
      );
      this.load.image("ground", "/assets/tour/ground.png");
      for (const p of places) {
        this.load.image("room-" + p.id, `/assets/tour/room-${p.id}.png`);
        this.load.image("house-" + p.id, `/assets/tour/house-${p.id}.png`);
      }
      for (const name of domainProps)
        this.load.image("domain-" + name, `/assets/tour/prop-${name}.png`);
      for (const name of [
        "tree",
        "pine",
        "plant",
        "lamp",
        "bench",
        "flowers",
        "rug",
        "laptop",
        "chair",
        "bed",
        "barrel",
        "well",
        "fountain",
      ])
        this.load.image(name, `/assets/game/${name}.png`);
      for (const name of [
        "bookshelf",
        "desk",
        "blue-vase",
        "cabinet",
        "reading-lamp",
        "piano",
      ])
        this.load.image("interior-" + name, `/assets/rooms/${name}.png`);
      for (const [key, url] of Object.entries(sheets))
        this.load.spritesheet(key, url, { frameWidth: 64, frameHeight: 64 });
      this.load.spritesheet("jalal", "/assets/tour/jalal-sheet.png", {
        frameWidth: 64,
        frameHeight: 64,
      });
    }
    create() {
      for (const key of [...Object.keys(sheets), "jalal"])
        for (const [kind, base, n, fps] of [
          ["walk", 0, 9, 10],
          ["idle", 4, 2, 2],
          ["run", 8, 8, 13],
          ["sit", 12, 3, 2],
          ["emote", 16, 3, 5],
        ] as [string, number, number, number][])
          for (let dir = 0; dir < 4; dir++)
            this.anims.create({
              key: `${key}-${kind}-${dir}`,
              frames: this.anims.generateFrameNumbers(key, {
                start: (base + dir) * 9,
                end: (base + dir) * 9 + n - 1,
              }),
              frameRate: fps,
              repeat: kind === "sit" ? 0 : -1,
            });
      this.scene.start("Town");
    }
  }
  class World extends Phaser.Scene {
    private entry: Entry = {};
    private roomMode = false;
    private solids: Rect[] = [];
    private player!: Phaser.GameObjects.Sprite;
    private guide!: Phaser.GameObjects.Sprite;
    private guideLabel!: Phaser.GameObjects.Text;
    private guidePath: Point[] = [];
    private path: Point[] = [];
    private stations: Station[] = [];
    private seats: Point[] = [];
    private seated = false;
    private seatOrigin: Point | null = null;
    private villagers: {
      sprite: Phaser.GameObjects.Sprite;
      name: string;
      home: Point;
      index: number;
    }[] = [];
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private touch = { x: 0, y: 0 };
    private paused = false;
    private moving = false;
    private dir = 2;
    private off: (() => void)[] = [];
    private near: { label: string; kind: string; id?: string } | null = null;
    private widthPx = 0;
    private heightPx = 0;
    private transitioning = false;
    private lastEmit = 0;
    private lastStep = 0;
    private waveUntil = 0;
    private waitNotified = false;
    private weather?: Phaser.GameObjects.Rectangle;
    private velocity = { x: 0, y: 0 };
    private targetObject: string | null = null;
    private autoFollow = false;
    private followCheck = 0;
    private inputReadyAt = 0;
    private speaker = "Jalal";
    private pendingKeys = new Set<string>();
    private shadow!: Phaser.GameObjects.Ellipse;
    /** Dialogue whose closing should advance the tour ("intro" or "beat"). */
    private tourAwait: "intro" | "beat" | null = null;
    private tourAwaitOpen = false;
    constructor(key: string, roomMode = false) {
      super(key);
      this.roomMode = roomMode;
    }
    init(data: Entry) {
      this.entry = data;
      this.path = [];
      this.guidePath = [];
      this.solids = [];
      this.stations = [];
      this.seats = [];
      this.villagers = [];
      this.off = [];
      this.near = null;
      this.touch = { x: 0, y: 0 };
      this.paused = false;
      this.transitioning = false;
      this.seated = false;
      this.velocity = { x: 0, y: 0 };
      this.targetObject = null;
      this.waitNotified = false;
      this.autoFollow = false;
      this.tourAwait = null;
      this.tourAwaitOpen = false;
      this.pendingKeys.clear();
    }
    create() {
      const place = this.entry.building ? placeById(this.entry.building) : null;
      this.widthPx = place?.width ?? world.width;
      this.heightPx = place?.height ?? world.height;
      this.add
        .image(0, 0, place ? "room-" + place.id : "ground")
        .setOrigin(0)
        .setDepth(-10000);
      if (place) this.makeRoom();
      else {
        this.solids = world.solids.map((s) => ({ ...s }));
        for (const o of world.objects) {
          const im = this.add
            .image(o.x, o.y, o.key)
            .setOrigin(0)
            .setDepth(o.depth);
          if (!prefs.reduced && ["tree", "pine"].includes(o.key)) {
            im.setOrigin(0.5, 1).setPosition(
              o.x + im.width / 2,
              o.y + im.height,
            );
            this.tweens.add({
              targets: im,
              angle: { from: -0.2, to: 0.2 },
              duration: 3200 + (o.x % 1000),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });
          }
          if (o.key === "bench") this.seats.push({ x: o.x + 16, y: o.y + 34 });
        }
        for (const b of world.buildings) {
          this.add
            .text(b.doorX, b.doorY + 10, placeById(b.id).short, {
              fontFamily: "Pixelify Sans",
              fontSize: "13px",
              color: "#fff1d0",
              backgroundColor: "#273e33",
              padding: { x: 6, y: 3 },
            })
            .setOrigin(0.5)
            .setDepth(b.doorY + 28);
        }
        this.makeNPCs();
      }
      const spawn = place
        ? { x: place.width / 2, y: place.height - 54 }
        : (this.entry.returnPosition ?? world.spawn);
      this.shadow = this.add
        .ellipse(spawn.x, spawn.y + 1, 24, 8, 0x112519, 0.22)
        .setDepth(spawn.y - 1); // Persistent floor detail; player has a following shadow below.
      this.player = this.add
        .sprite(spawn.x, spawn.y, "visitor")
        .setOrigin(0.5, 0.875)
        .setDepth(spawn.y);
      this.player.play("visitor-idle-2");
      if (!place && tour.active && this.entry.returnPosition)
        guidePosition = { x: spawn.x + 36, y: spawn.y };
      this.guide = this.add
        .sprite(
          place ? spawn.x + 52 : guidePosition.x,
          place ? spawn.y - 8 : guidePosition.y,
          "jalal",
        )
        .setOrigin(0.5, 0.875)
        .setDepth(guidePosition.y);
      this.guide.play("jalal-idle-2");
      this.guideLabel = this.add
        .text(this.guide.x, this.guide.y - 66, "Jalal", {
          fontFamily: "Pixelify Sans",
          fontSize: "12px",
          color: "#fff0c8",
          backgroundColor: "#274033",
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(9000);
      const guided = !place || (tour.active && place.id === tour.target);
      this.guide.setVisible(guided);
      this.guideLabel.setVisible(guided);
      this.weather = this.add
        .rectangle(0, 0, this.widthPx, this.heightPx, 0x142740, 0)
        .setOrigin(0)
        .setDepth(2800);
      this.weather.setAlpha(prefs.time === "evening" ? 0.2 : 0);
      const cam = this.cameras.main;
      cam.setBackgroundColor("#14291f");
      cam.roundPixels = false;
      this.resize(this.scale.gameSize);
      this.transitioning = true;
      if (prefs.reduced) {
        this.transitioning = false;
        gameBus.emit("transition", null);
      } else {
        cam.fadeIn(300, 15, 29, 22);
        this.time.delayedCall(300, () => {
          this.transitioning = false;
          gameBus.emit("transition", null);
        });
      }
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
      for (const name of ["interact", "sit", "wave", "exit"]) {
        const key = this.keys[name];
        key.emitOnRepeat = false;
        const press = () => {
          if (!this.paused && !this.transitioning) this.pendingKeys.add(name);
        };
        key.on("down", press);
        this.off.push(() => key.off("down", press));
      }
      this.input.mouse?.disableContextMenu();
      this.input.keyboard!.enabled = true;
      Object.values(this.keys).forEach((k) => k.reset());
      this.inputReadyAt = this.time.now + 450;
      this.game.canvas.tabIndex = 0;
      this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (this.paused || this.transitioning) return;
        const q = cam.getWorldPoint(p.x, p.y);
        if (p.rightButtonDown()) {
          const npc = this.nearestNPC(q);
          if (npc && distance(this.player, npc.sprite) < 100)
            this.converse(npc.name);
          else if (
            distance(q, this.guide) < 48 &&
            distance(this.player, this.guide) < 110
          )
            this.converse("Jalal");
          return;
        }
        const st = this.stations.find(
          (s) => distance(q, { x: s.x + s.w / 2, y: s.y + s.h / 2 }) < 65,
        );
        if (st) {
          this.targetObject = st.id;
          this.moveTo(st.approach);
          return;
        }
        const seat = this.seats.find((s) => distance(q, s) < 30);
        if (seat) {
          this.targetObject = "seat";
          this.moveTo({ x: seat.x, y: seat.y + 28 });
          return;
        }
        this.targetObject = null;
        this.moveTo(q);
      });
      this.scale.on("resize", this.resize, this);
      this.off.push(
        gameBus.on("pause", (v) => {
          this.paused = v;
          this.input.keyboard!.enabled = !v;
          Object.values(this.keys).forEach((k) => k.reset());
          this.touch = { x: 0, y: 0 };
          this.velocity = { x: 0, y: 0 };
          if (v && this.tourAwait) this.tourAwaitOpen = true;
          if (!v && this.tourAwait && this.tourAwaitOpen) {
            const kind = this.tourAwait;
            this.tourAwait = null;
            this.tourAwaitOpen = false;
            this.time.delayedCall(140, () => this.tourAck(kind));
          }
          if (v) {
            this.player.anims.pause();
            this.guide.anims.pause();
          } else {
            this.player.anims.resume();
            this.guide.anims.resume();
          }
        }),
        gameBus.on("preferences", (p) => {
          prefs = p;
          this.resize(this.scale.gameSize);
          this.weather?.setAlpha(p.time === "evening" ? 0.2 : 0);
          if (p.reduced) this.tweens.killAll();
        }),
        gameBus.on("reduced", (v) => {
          prefs.reduced = v;
        }),
        gameBus.on("action", (a) => this.action(a)),
      );
      this.off.forEach((f) => allOff.add(f));
      this.events.once("shutdown", () => {
        this.off.forEach((f) => {
          f();
          allOff.delete(f);
        });
        this.scale.off("resize", this.resize, this);
      });
      gameBus.emit("location", {
        name: place?.name ?? "Career Town",
        room: place?.id ?? null,
      });
      gameBus.emit("ready", undefined);
      emitTour();
      if (tour.active) {
        if (place) {
          if (dispatch({ type: "enter-room", id: place.id }))
            this.time.delayedCall(prefs.reduced ? 60 : 650, () =>
              this.roomIntro(),
            );
        } else if (tour.stage === "leading" || tour.stage === "waiting")
          this.leadToStop();
      } else if (!place && completedPending) {
        completedPending = false;
        this.time.delayedCall(prefs.reduced ? 60 : 600, () =>
          this.sayComplete(),
        );
      }
      if (this.entry.goto && !place) this.navigate(this.entry.goto);
    }
    private resize(size: Phaser.Structs.Size) {
      const cam = this.cameras?.main;
      if (!cam) return;
      cam.setSize(size.width, size.height);
      cam.setZoom((size.width < 600 ? 1.35 : 1.8) * prefs.zoom);
      const padX = Math.max(0, (size.width / cam.zoom - this.widthPx) / 2),
        padY = Math.max(0, (size.height / cam.zoom - this.heightPx) / 2);
      cam.setBounds(
        -padX,
        -padY,
        this.widthPx + padX * 2,
        this.heightPx + padY * 2,
      );
      if (this.player)
        cam.startFollow(
          this.player,
          false,
          prefs.reduced ? 1 : 0.16,
          prefs.reduced ? 1 : 0.16,
        );
    }
    private makeRoom() {
      const p = placeById(this.entry.building!);
      this.solids = [
        { x: 0, y: 0, w: p.width, h: 102 },
        { x: 0, y: 0, w: 18, h: p.height },
        { x: p.width - 18, y: 0, w: 18, h: p.height },
        { x: 0, y: p.height - 24, w: p.width / 2 - 52, h: 24 },
        { x: p.width / 2 + 52, y: p.height - 24, w: p.width / 2 - 52, h: 24 },
      ];
      this.stations = stationsFor(p);
      for (const s of this.stations) {
        const key = domainProps.includes(s.prop)
          ? "domain-" + s.prop
          : [
                "bookshelf",
                "desk",
                "blue-vase",
                "cabinet",
                "reading-lamp",
                "piano",
              ].includes(s.prop)
            ? "interior-" + s.prop
            : s.prop;
        const im = this.add
          .image(s.x + s.w / 2, s.y + s.h, key)
          .setOrigin(0.5, 1)
          .setDepth(s.y + s.h);
        im.setScale(Math.min(s.w / im.width, s.h / im.height));
        this.solids.push({ x: s.x + 4, y: s.y + s.h - 22, w: s.w - 8, h: 20 });
        const ring = this.add
          .ellipse(s.approach.x, s.approach.y, 24, 8, 0xf4d997, 0.12)
          .setStrokeStyle(1, 0xf4d997, 0.7)
          .setDepth(-50);
        if (!prefs.reduced)
          this.tweens.add({
            targets: ring,
            alpha: { from: 0.3, to: 0.85 },
            duration: 1600,
            delay: this.stations.indexOf(s) * 170,
            yoyo: true,
            repeat: -1,
          });
        this.add
          .text(s.x + s.w / 2, s.y - 12, s.title, {
            fontFamily: "Pixelify Sans",
            fontSize: "11px",
            color: "#fff0c9",
            backgroundColor: "#294535",
            padding: { x: 4, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(s.y + s.h + 1);
      }
      for (const [x, y] of [
        [28, 114],
        [p.width - 56, 114],
        [28, p.height - 72],
        [p.width - 56, p.height - 72],
      ])
        this.add
          .image(x, y, "plant")
          .setOrigin(0)
          .setDepth(y + 32);
      if (p.theme === "lab") {
        this.add
          .image(p.width / 2 - 22, 66, "domain-planning")
          .setDisplaySize(44, 30)
          .setOrigin(0)
          .setDepth(98);
      }
      const seat = { x: p.width / 2 + 8, y: p.height - 130 };
      this.add
        .image(seat.x - 20, seat.y - 52, "domain-seat")
        .setDisplaySize(40, 56)
        .setOrigin(0)
        .setDepth(seat.y + 3);
      this.seats.push(seat);
      this.solids.push({ x: seat.x - 18, y: seat.y - 8, w: 36, h: 16 });
      this.add
        .text(p.width / 2, 44, p.name, {
          fontFamily: "Pixelify Sans",
          fontSize: "16px",
          color: "#fff0c9",
          backgroundColor: "#294535",
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(120);
      this.add
        .text(p.width / 2, p.height - 28, "↓ RETURN TO TOWN", {
          fontFamily: "Pixelify Sans",
          fontSize: "12px",
          color: "#fff0c9",
          backgroundColor: "#294535",
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(p.height);
    }
    private makeNPCs() {
      const first = world.buildings[0];
      for (const [i, name] of [
        "Mina",
        "Sami",
        "Noor",
        "Lina",
        "Adam",
        "Rayan",
      ].entries()) {
        const base = world.buildings[i < 3 ? 0 : [5, 10, 16][i - 3]];
        const home = {
          x: base.doorX + 110 + (i % 3) * 42,
          y: base.doorY + 45 + (i % 2) * 24,
        };
        const sprite = this.add
          .sprite(home.x, home.y, "npc" + (i % 2))
          .setOrigin(0.5, 0.875)
          .setDepth(home.y);
        sprite.play("npc" + (i % 2) + "-idle-2");
        this.villagers.push({ sprite, name, home, index: i });
        this.add
          .text(home.x, home.y - 59, name, {
            fontFamily: "Pixelify Sans",
            fontSize: "11px",
            color: "#fff1d0",
            backgroundColor: "#344734",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5)
          .setDepth(9000);
      }
    }
    private nearestNPC(p: Point) {
      return [...this.villagers]
        .sort((a, b) => distance(a.sprite, p) - distance(b.sprite, p))
        .find((v) => distance(v.sprite, p) < 55);
    }
    private converse(name: string) {
      this.speaker = name;
      say({
        speaker: name,
        portrait: "happy",
        text:
          name === "Jalal"
            ? "Welcome! I’m Jalal. Want the full journey, a quick answer, or time to explore on your own?"
            : `Hello, I’m ${name}. Nice to meet you! What would you like to know about the town?`,
        choices:
          name === "Jalal"
            ? [
                {
                  id: "tour-start",
                  label: tour.active
                    ? "Restart Jalal’s tour"
                    : "Take Jalal’s tour",
                },
                { id: "jalal-work", label: "What do you work on?" },
                { id: "jalal-research", label: "What is still in research?" },
                { id: "tour-leave", label: "I’d like to explore freely" },
              ]
            : [
                { id: "greet-" + name, label: "Greet " + name },
                { id: "town-projects", label: "How do I explore projects?" },
                { id: "town-research", label: "Tell me about the research" },
                { id: "town-help", label: "Any town tips?" },
              ],
      });
    }
    private action(a: Parameters<typeof gameBus.emit<"action">>[1]) {
      if (a.type === "direction") {
        this.touch = { x: a.x ?? 0, y: a.y ?? 0 };
        if (this.touch.x || this.touch.y) this.path = [];
        return;
      }
      if (a.type === "tour-start") {
        this.stand();
        this.tourAwait = null;
        const from = a.id ? Number(a.id) : 0;
        dispatch({ type: "start", from: Number.isFinite(from) ? from : 0 });
        if (this.roomMode) {
          this.travel("Town", { returnPosition: this.entry.returnPosition });
        } else {
          this.guide.setPosition(this.player.x + 28, this.player.y - 14);
          this.leadToStop();
        }
        return;
      }
      if (a.type === "tour-leave") {
        dispatch({ type: "leave" });
        this.tourAwait = null;
        this.autoFollow = false;
        this.guidePath = [];
        return;
      }
      if (a.type === "tour-rejoin") {
        if (!tour.active) return;
        if (this.roomMode) {
          if (this.guide.visible) this.moveTo(this.guide);
          return;
        }
        this.autoFollow = true;
        this.moveTo(this.guide);
        dispatch({ type: "visitor-near" });
        this.waitNotified = false;
        return;
      }
      if (a.type === "tour-next") {
        if (!tour.active) return;
        this.path = [];
        this.tourAwait = null;
        if (this.roomMode) {
          this.exitRoom(true);
          return;
        }
        dispatch({ type: "next" });
        if (tour.stage === "complete") {
          this.guidePath = [];
          this.sayComplete();
        } else this.leadToStop();
        return;
      }
      if (a.type === "choice") {
        const id = a.id ?? "";
        if (id.startsWith("tour-resume-")) {
          this.action({ type: "tour-start", id: id.slice(12) });
          return;
        }
        if (id === "tour-start") {
          this.action({ type: "tour-start" });
          return;
        }
        if (id === "tour-leave") {
          this.action({ type: "tour-leave" });
          return;
        }
        if (id === "tour-next") {
          this.action({ type: "tour-next" });
          return;
        }
        if (id === "skip-room") {
          this.tourAwait = null;
          if (dispatch({ type: "skip-room" })) this.tourRoomStep();
          return;
        }
        if (id === "enter-stop") {
          const b = world.buildings.find((b) => b.id === tour.target)!;
          if (
            !this.roomMode &&
            distance(this.player, { x: b.doorX, y: b.doorY + 30 }) < 125
          )
            this.enter(b.id);
          else
            say({
              speaker: "Jalal",
              text: "Come a little closer to the door, then press E to enter.",
            });
          return;
        }
        const answers: Record<string, string> = {
          "jalal-work":
            "I connect AI, data engineering and software architecture. This town includes research, data pipelines, full-stack applications and internship work. Each project has its own building.",
          "jalal-research":
            "Sentinel and ORION are design-stage research projects. I don’t present them as deployed systems or claim experimental results. Their rooms explain the planned work and my role.",
          "town-projects":
            "Each project has its own named building. Enter its door, then walk to the glowing spots near furniture. Every object explains a different aspect of that project.",
          "town-research":
            "Research ridge includes Sentinel, ORION and the deep-learning report. Check each status notebook: a design, dataset or report is not the same as a deployed product.",
          "town-help":
            "Click a path to walk, use WASD or the arrow keys, and press E near doors or objects. Right-click a nearby neighbor for conversation choices. Q sits and stays seated; move or press Q to stand.",
        };
        say({
          speaker: id.startsWith("greet-") ? id.slice(6) : this.speaker,
          portrait: "happy",
          text:
            answers[id] ??
            "Lovely to meet you. Enjoy the village—and don’t miss the little details inside each project house.",
        });
        return;
      }
      if (this.paused || this.transitioning) return;
      if (a.type === "interact") this.interact(a);
      if (a.type === "wave") {
        this.stand();
        this.path = [];
        this.waveUntil = this.time.now + 850;
      }
      if (a.type === "sit") this.toggleSit();
      if (a.type === "exit" && this.roomMode) this.exitRoom();
      if (a.type === "navigate" && a.id) {
        if (tour.active) {
          dispatch({ type: "leave" });
          this.guidePath = [];
        }
        if (this.roomMode)
          this.travel("Town", {
            returnPosition: this.entry.returnPosition,
            goto: a.id,
          });
        else this.navigate(a.id);
      }
      if (a.type === "inspect" && a.id && this.roomMode) {
        const s = this.stations.find((s) => s.id === a.id);
        if (s && distance(this.player, s.approach) < 88) this.inspect(s);
      }
    }
    private navigate(id: string) {
      const b = world.buildings.find((b) => b.id === id);
      if (b) this.moveTo({ x: b.doorX, y: b.doorY + 35 });
    }
    private moveTo(q: Point) {
      this.stand();
      this.waveUntil = 0;
      this.path = route(
        this.player,
        q,
        this.widthPx,
        this.heightPx,
        this.solids,
      );
      if (!this.path.length && distance(this.player, q) > 28)
        gameBus.emit("near", {
          label: "No clear route. Try the path beside it.",
          kind: "route",
        });
    }
    private leadToStop() {
      if (this.roomMode) return;
      const b = world.buildings.find((b) => b.id === tour.target)!;
      this.guidePath = route(
        this.guide,
        { x: b.doorX, y: b.doorY + 36 },
        this.widthPx,
        this.heightPx,
        this.solids,
      );
      this.waitNotified = false;
    }
    private enter(id: string) {
      const b = world.buildings.find((b) => b.id === id)!;
      this.travel("Interior", {
        building: id,
        returnPosition: { x: b.doorX, y: b.doorY + 50 },
      });
    }
    /** Leaving the tour's room moves the tour on to the next stop. */
    private exitRoom(viaNext = false) {
      if (this.transitioning) return;
      if (tour.active && inRoomStage(tour.stage)) {
        dispatch({ type: viaNext ? "next" : "exit-room" });
        if (tour.stage === "complete") completedPending = true;
      }
      this.travel("Town", { returnPosition: this.entry.returnPosition });
    }
    private sayComplete() {
      say({
        speaker: "Jalal",
        portrait: "happy",
        title: "Tour complete",
        text: "That’s the whole town! Thank you for walking through my work with me. Wander freely, revisit any project from the map, or start the tour again whenever you like.",
      });
    }
    private beatStation() {
      return this.stations.find((s) => s.id === tour.beatId);
    }
    /** A free spot beside an exhibit where Jalal can stand without blocking it. */
    private besideStation(s: Station): Point {
      for (const [dx, dy] of [
        [58, 8],
        [-58, 8],
        [0, 42],
        [70, 30],
        [-70, 30],
        [34, 40],
      ]) {
        const q = { x: s.approach.x + dx, y: s.approach.y + dy };
        if (isFree(q, this.widthPx, this.heightPx, this.solids)) return q;
      }
      return { ...s.approach };
    }
    private guideTo(q: Point) {
      this.guidePath = route(
        this.guide,
        q,
        this.widthPx,
        this.heightPx,
        this.solids,
      );
    }
    private roomIntro() {
      if (!this.roomMode || tour.stage !== "room-intro") return;
      const p = placeById(this.entry.building!);
      const n = tour.beats;
      this.tourAwait = "intro";
      this.tourAwaitOpen = false;
      say({
        speaker: "Jalal",
        portrait: "happy",
        title: `Stop ${tour.index + 1} of ${tour.total} · ${p.name}`,
        text:
          p.summary +
          (n
            ? ` Let me show you ${n === 1 ? "the key piece" : `the ${n} highlights`} first — follow me.`
            : " Have a look around."),
        choices: [
          { id: "close", label: n ? "Show me →" : "Let’s look" },
          { id: "skip-room", label: "I’ll explore on my own" },
        ],
      });
    }
    private tourAck(kind: "intro" | "beat") {
      if (!this.roomMode || this.transitioning) return;
      if (dispatch({ type: kind === "intro" ? "intro-done" : "beat-done" }))
        this.tourRoomStep();
    }
    /** Side effects after an in-room tour stage change. */
    private tourRoomStep() {
      if (!this.roomMode || this.transitioning || !tour.active) return;
      if (tour.stage === "to-beat") {
        const s = this.beatStation();
        if (s) this.guideTo(this.besideStation(s));
        else if (dispatch({ type: "skip-room" })) this.tourRoomStep();
        return;
      }
      if (tour.stage === "room-free") {
        const p = placeById(this.entry.building!);
        this.guideTo({ x: p.width / 2 + 64, y: p.height - 74 });
        const next = plan[tour.index + 1];
        const last = !next;
        this.time.delayedCall(prefs.reduced ? 60 : 450, () => {
          if (tour.stage !== "room-free" || !this.roomMode) return;
          say({
            speaker: "Jalal",
            portrait: "happy",
            title: p.name,
            text: `That’s the story of ${p.short}. The other glowing spots hold more details — take your time. When you’re ready, walk out the door and ${last ? "we’ll wrap up the tour" : `I’ll take you to ${placeById(next.id).short}`}.`,
            choices: [
              {
                id: "tour-next",
                label: last
                  ? "Finish the tour"
                  : `Next stop → ${placeById(next.id).short}`,
              },
              { id: "close", label: "Look around first" },
            ],
          });
        });
      }
    }
    private travel(scene: string, data: Entry) {
      if (this.transitioning) return;
      this.transitioning = true;
      this.path = [];
      this.touch = { x: 0, y: 0 };
      gameBus.emit("near", null);
      gameBus.emit("transition", {
        label: data.building ? placeById(data.building).name : "Career Town",
        building: data.building,
      });
      if (!this.roomMode) guidePosition = { x: this.guide.x, y: this.guide.y };
      if (prefs.reduced) {
        this.scene.start(scene, data);
        return;
      }
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.time.delayedCall(90, () => this.scene.start(scene, data)),
      );
      this.cameras.main.fadeOut(220, 15, 29, 22);
    }
    private inspect(s: Station) {
      this.path = [];
      this.targetObject = null;
      gameBus.emit("inspected", { place: this.entry.building!, station: s.id });
      if (tour.active && tour.stage === "to-beat" && s.id === tour.beatId)
        dispatch({ type: "reach-beat" });
      const beat = tour.active && tour.stage === "beat" && s.id === tour.beatId;
      if (beat) {
        this.tourAwait = "beat";
        this.tourAwaitOpen = false;
      }
      const last = tour.beat + 1 >= tour.beats;
      say({
        speaker: "Jalal",
        title: beat
          ? `Highlight ${tour.beat + 1} of ${tour.beats} · ${s.title}`
          : s.title,
        station: s.id,
        text: s.text,
        portrait: s.id === "status" ? "thinking" : "portrait",
        link: s.link,
        linkLabel: s.linkLabel,
        choices: beat
          ? [
              {
                id: "close",
                label: last ? "Got it — I’ll look around" : "Next highlight →",
              },
              ...(last
                ? []
                : [{ id: "skip-room", label: "Skip to free exploring" }]),
            ]
          : undefined,
      });
    }
    private updateNear() {
      let n: typeof this.near = null;
      if (this.roomMode) {
        const s = [...this.stations].sort(
          (a, b) =>
            distance(this.player, a.approach) -
            distance(this.player, b.approach),
        )[0];
        if (s && distance(this.player, s.approach) < 52)
          n = { label: "Inspect · " + s.title, kind: "exhibit", id: s.id };
        else if (
          this.player.y > this.heightPx - 90 &&
          Math.abs(this.player.x - this.widthPx / 2) < 90
        )
          n = { label: "Return to town", kind: "exit" };
      } else {
        const b = world.buildings.find(
          (b) => distance(this.player, { x: b.doorX, y: b.doorY + 24 }) < 60,
        );
        if (b)
          n = {
            label: "Enter · " + placeById(b.id).short,
            kind: "door",
            id: b.id,
          };
      }
      if (!n) {
        const seat = this.seats.find((s) => distance(this.player, s) < 50);
        if (seat)
          n = {
            label: this.seated ? "Stand up" : "Sit on the chair",
            kind: "seat",
          };
        else if (this.guide.visible && distance(this.player, this.guide) < 68)
          n = { label: "Talk to Jalal", kind: "guide" };
        else {
          const v = this.nearestNPC(this.player);
          if (v) n = { label: "Talk to " + v.name, kind: "npc", id: v.name };
        }
      }
      if (JSON.stringify(n) !== JSON.stringify(this.near)) {
        this.near = n;
        gameBus.emit("near", n);
      }
    }
    private interact(expected?: { kind?: string; id?: string }) {
      // A clicked prompt acts on the object it displayed, not a different
      // nearby NPC reached between the render and the click.
      if (expected?.kind === "door" && expected.id) {
        const b = world.buildings.find((b) => b.id === expected.id);
        if (
          !this.roomMode &&
          b &&
          distance(this.player, { x: b.doorX, y: b.doorY + 24 }) < 92
        ) {
          this.path = [];
          this.enter(b.id);
          return;
        }
      }
      if (expected?.kind === "exhibit" && expected.id) {
        const s = this.stations.find((s) => s.id === expected.id);
        if (s && distance(this.player, s.approach) < 86) {
          this.inspect(s);
          return;
        }
      }
      if (
        expected?.kind === "guide" &&
        distance(this.player, this.guide) < 100
      ) {
        this.converse("Jalal");
        return;
      }
      if (expected?.kind === "npc" && expected.id) {
        const v = this.villagers.find((v) => v.name === expected.id);
        if (v && distance(this.player, v.sprite) < 90) {
          this.converse(v.name);
          return;
        }
      }
      if (expected?.kind === "seat") {
        this.toggleSit();
        return;
      }
      if (expected?.kind === "exit" && this.roomMode) {
        this.exitRoom();
        return;
      }
      this.updateNear();
      if (!this.near) return;
      const n = this.near;
      this.path = [];
      if (n.kind === "door") this.enter(n.id!);
      if (n.kind === "exit") this.exitRoom();
      if (n.kind === "exhibit")
        this.inspect(this.stations.find((s) => s.id === n.id)!);
      if (n.kind === "guide") this.converse("Jalal");
      if (n.kind === "npc") this.converse(n.id!);
      if (n.kind === "seat") this.toggleSit();
    }
    private stand() {
      if (this.seated && this.seatOrigin)
        this.player.setPosition(this.seatOrigin.x, this.seatOrigin.y);
      this.seated = false;
      this.seatOrigin = null;
    }
    private toggleSit() {
      if (this.seated) {
        this.stand();
        return;
      }
      const seat = this.seats.find((s) => distance(this.player, s) < 55);
      this.seatOrigin = { x: this.player.x, y: this.player.y };
      if (seat) this.player.setPosition(seat.x, seat.y);
      this.seated = true;
      this.dir = 2;
      this.path = [];
      this.velocity = { x: 0, y: 0 };
      this.player.play("visitor-sit-2");
    }
    private step(
      sprite: Phaser.GameObjects.Sprite,
      path: Point[],
      speed: number,
      dt: number,
      guide = false,
    ) {
      if (!path.length) return false;
      let budget = speed * dt,
        moved = false;
      while (path.length && budget > 0) {
        const to = path[0],
          d = distance(sprite, to);
        if (d < 0.7) {
          sprite.setPosition(to.x, to.y);
          path.shift();
          continue;
        }
        const amount = Math.min(budget, d),
          dx = (to.x - sprite.x) / d,
          dy = (to.y - sprite.y) / d;
        const nx = sprite.x + dx * amount,
          ny = sprite.y + dy * amount;
        if (
          !isFree({ x: nx, y: ny }, this.widthPx, this.heightPx, this.solids)
        ) {
          path.length = 0;
          break;
        }
        sprite.setPosition(nx, ny);
        budget -= amount;
        moved = true;
        const dir =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 2 : 0;
        if (guide) sprite.play("jalal-walk-" + dir, true);
        else this.dir = dir;
        if (amount >= d) path.shift();
      }
      return moved;
    }
    private updateGuide(dt: number) {
      if (!tour.active) {
        this.guide.play("jalal-idle-2", true);
        return;
      }
      if (this.roomMode) {
        // Jalal leads inside: he walks to each highlight and waits for the visitor.
        if (!this.guide.visible) return;
        const moved = this.step(
          this.guide,
          this.guidePath,
          112 * prefs.speed,
          dt,
          true,
        );
        if (!moved) {
          const dx = this.player.x - this.guide.x,
            dy = this.player.y - this.guide.y;
          const face =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 2 : 0;
          this.guide.play("jalal-idle-" + face, true);
        }
        if (
          tour.stage === "to-beat" &&
          !this.guidePath.length &&
          !this.paused
        ) {
          const s = this.beatStation();
          if (s && distance(this.player, s.approach) < 70) {
            this.path = [];
            this.inspect(s);
          }
        }
        this.guide.setDepth(this.guide.y);
        this.guideLabel.setPosition(this.guide.x, this.guide.y - 66);
        return;
      }

      const cam = this.cameras.main;
      const leash = Math.max(
        48,
        Math.min(130, cam.worldView.width * 0.31, cam.worldView.height * 0.25),
      );
      const d = distance(this.player, this.guide);
      tour.distance = Math.round(d);
      if ((tour.stage === "leading" || tour.stage === "waiting") && d > leash) {
        dispatch({ type: "visitor-far" });
        this.guide.play("jalal-idle-2", true);
        if (!this.waitNotified) {
          this.waitNotified = true;
          say({
            speaker: "Jalal",
            portrait: "thinking",
            text: "Follow Jalal, please! I’ll wait right here so we don’t lose each other. Come closer, or choose free exploration whenever you like.",
            choices: [
              { id: "close", label: "I’m coming" },
              { id: "tour-leave", label: "Explore freely" },
            ],
          });
          emitTour();
        }
        return;
      }
      if (tour.stage === "waiting" && d < leash * 0.7) {
        dispatch({ type: "visitor-near" });
        this.waitNotified = false;
      }
      if (tour.stage === "leading") {
        const moved = this.step(
          this.guide,
          this.guidePath,
          92 * prefs.speed,
          dt,
          true,
        );
        if (!moved) this.guide.play("jalal-idle-2", true);
        if (!this.guidePath.length) {
          const b = world.buildings.find((b) => b.id === tour.target)!;
          if (distance(this.guide, { x: b.doorX, y: b.doorY + 36 }) < 30) {
            dispatch({ type: "arrive-door" });
            const p = placeById(tour.target);
            say({
              speaker: "Jalal",
              title: `Stop ${tour.index + 1} of ${tour.total} · ${p.short}`,
              text: `Here we are — ${p.name}. Step inside with me and I’ll walk you through the highlights.`,
              choices: [
                { id: "enter-stop", label: "Enter this building" },
                { id: "close", label: "Let me look around" },
              ],
            });
          } else this.leadToStop();
        }
      }
      guidePosition = { x: this.guide.x, y: this.guide.y };
      this.guide.setDepth(this.guide.y);
      this.guideLabel.setPosition(this.guide.x, this.guide.y - 66);
    }
    update(time: number, delta: number) {
      if (!this.player || this.transitioning || !this.keys) return;
      const dt = Math.min(delta, 50) / 1000;
      if (!this.paused) {
        if (this.pendingKeys.has("interact") && time > this.inputReadyAt)
          this.interact();
        if (this.pendingKeys.has("sit")) this.toggleSit();
        if (this.pendingKeys.has("wave")) {
          this.stand();
          this.waveUntil = time + 850;
        }
        if (this.pendingKeys.has("exit") && this.roomMode) this.exitRoom();
        this.pendingKeys.clear();
        let dx =
            Number(this.keys.right.isDown || this.keys.d.isDown) -
            Number(this.keys.left.isDown || this.keys.a.isDown) +
            this.touch.x,
          dy =
            Number(this.keys.down.isDown || this.keys.s.isDown) -
            Number(this.keys.up.isDown || this.keys.w.isDown) +
            this.touch.y;
        const direct = !!(dx || dy);
        this.moving = false;
        const previousPosition = { x: this.player.x, y: this.player.y };
        if (direct) this.autoFollow = false;
        if (
          this.autoFollow &&
          tour.active &&
          !this.roomMode &&
          time - this.followCheck > 350 &&
          distance(this.player, this.guide) > 36
        ) {
          this.followCheck = time;
          this.path = route(
            this.player,
            this.guide,
            this.widthPx,
            this.heightPx,
            this.solids,
          );
        }
        if (direct) {
          this.stand();
          this.path = [];
          this.targetObject = null;
          const n = Math.hypot(dx, dy);
          dx /= n;
          dy /= n;
          const targetSpeed = (this.keys.run.isDown ? 190 : 126) * prefs.speed;
          const smooth = 1 - Math.exp(-dt * 22);
          this.velocity.x += (dx * targetSpeed - this.velocity.x) * smooth;
          this.velocity.y += (dy * targetSpeed - this.velocity.y) * smooth;
          const mx = this.velocity.x * dt,
            my = this.velocity.y * dt;
          const steps = Math.max(1, Math.ceil(Math.hypot(mx, my) / 4));
          for (let i = 0; i < steps; i++) {
            const nx = this.player.x + mx / steps,
              ny = this.player.y + my / steps;
            if (
              isFree(
                { x: nx, y: this.player.y },
                this.widthPx,
                this.heightPx,
                this.solids,
              )
            ) {
              this.player.x = nx;
              this.moving = true;
            }
            if (
              isFree(
                { x: this.player.x, y: ny },
                this.widthPx,
                this.heightPx,
                this.solids,
              )
            ) {
              this.player.y = ny;
              this.moving = true;
            }
          }
          this.dir =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 2 : 0;
        } else {
          this.velocity = { x: 0, y: 0 };
          if (this.path.length)
            this.moving = this.step(
              this.player,
              this.path,
              (this.keys.run.isDown ? 190 : 126) * prefs.speed,
              dt,
            );
        }
        // Hard screen-space leash: active guidance cannot let visitor walk Jalal off screen.
        if (tour.active && this.guide.visible && !this.roomMode) {
          const cam = this.cameras.main;
          const maxX = Math.max(44, cam.worldView.width / 2 - 48),
            maxY = Math.max(44, cam.worldView.height / 2 - 84);
          const nx = Phaser.Math.Clamp(
              this.player.x,
              this.guide.x - maxX,
              this.guide.x + maxX,
            ),
            ny = Phaser.Math.Clamp(
              this.player.y,
              this.guide.y - maxY,
              this.guide.y + maxY,
            );
          if (nx !== this.player.x || ny !== this.player.y) {
            if (
              isFree({ x: nx, y: ny }, this.widthPx, this.heightPx, this.solids)
            )
              this.player.setPosition(nx, ny);
            else
              this.player.setPosition(previousPosition.x, previousPosition.y);
            this.path = [];
            if (!this.waitNotified && tour.stage === "arrived") {
              this.waitNotified = true;
              say({
                speaker: "Jalal",
                portrait: "thinking",
                text: "Follow Jalal, please! Let’s stay in sight of each other. You can also leave the tour and explore freely.",
                choices: [
                  { id: "close", label: "Stay together" },
                  { id: "tour-leave", label: "Explore freely" },
                ],
              });
            }
          }
        }
        this.player.setDepth(this.player.y + (this.seated ? 8 : 0));
        this.shadow
          .setPosition(this.player.x, this.player.y + 1)
          .setDepth(this.player.y - 1);
        if (!this.seated) {
          const kind =
            time < this.waveUntil
              ? "emote"
              : this.moving
                ? this.keys.run.isDown
                  ? "run"
                  : "walk"
                : "idle";
          this.player.play(`visitor-${kind}-${this.dir}`, true);
        } else {
          if (this.player.anims.currentAnim?.key !== "visitor-sit-2")
            this.player.play("visitor-sit-2");
          if (!this.player.anims.isPlaying) this.player.setFrame(14 * 9 + 2);
        }
        if (this.targetObject && !this.path.length) {
          const s = this.stations.find((s) => s.id === this.targetObject);
          if (s && distance(this.player, s.approach) < 40) this.inspect(s);
          else if (
            this.targetObject === "seat" &&
            this.seats.some((s) => distance(this.player, s) < 55)
          ) {
            this.targetObject = null;
            this.toggleSit();
          }
        }
        this.updateGuide(dt);
        this.updateNear();
        if (
          this.moving &&
          !prefs.reduced &&
          prefs.footsteps &&
          time - this.lastStep > 180
        ) {
          this.lastStep = time;
          const dust = this.add
            .ellipse(this.player.x, this.player.y, 5, 3, 0xe5d5a1, 0.22)
            .setDepth(this.player.y - 2);
          this.tweens.add({
            targets: dust,
            alpha: 0,
            y: dust.y - 5,
            duration: 300,
            onComplete: () => dust.destroy(),
          });
        }
      }
      if (time - this.lastEmit > 120) {
        this.lastEmit = time;
        const v = this.cameras.main.worldView;
        const visible =
          v.contains(this.guide.x, this.guide.y) &&
          v.contains(this.guide.x, this.guide.y - 48);
        gameBus.emit("position", {
          x: this.player.x,
          y: this.player.y,
          width: this.widthPx,
          height: this.heightPx,
          guideX: this.guide.x,
          guideY: this.guide.y,
          guideVisible: visible,
          sitting: this.seated,
          cameraX: v.x,
          cameraY: v.y,
          zoom: this.cameras.main.zoom,
        });
        if (tour.active) emitTour();
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    pixelArt: true,
    roundPixels: false,
    backgroundColor: "#14291f",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 60, smoothStep: false },
    scene: [Boot, new World("Town"), new World("Interior", true)],
    audio: { noAudio: true },
    render: { antialias: false, pixelArt: true },
  });
  return {
    destroy(remove: boolean) {
      allOff.forEach((f) => f());
      allOff.clear();
      game.destroy(remove);
    },
  };
}
