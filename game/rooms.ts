import type { BuildingId } from "@/content/portfolio";
export type Furnishing = {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type RoomDesign = {
  subtitle: string;
  note: string;
  accent: number;
  notes: { x: number; y: number };
  furniture: Furnishing[];
};
const p = (
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Furnishing => ({ key, x, y, w, h });
export const roomProps = [
  "round-table",
  "reading-lamp",
  "blue-vase",
  "wall-clock",
  "archive",
  "workbench",
  "long-counter",
  "reading-bench",
  "small-stool",
  "desk",
  "bookshelf",
  "cabinet",
  "piano",
];
export const rooms: Record<BuildingId, RoomDesign> = {
  about: {
    subtitle: "A quiet corner of the journey",
    note: "PERSONAL JOURNAL",
    accent: 0xc8d8a0,
    notes: { x: 352, y: 246 },
    furniture: [
      p("bed", 54, 160, 64, 65),
      p("piano", 480, 160, 128, 42),
      p("bookshelf", 72, 62, 64, 35),
      p("blue-vase", 172, 162, 32, 14),
      p("reading-lamp", 596, 124, 32, 14),
      p("desk", 304, 176, 96, 24),
      p("chair", 128, 394, 32, 20),
      p("round-table", 88, 330, 64, 30),
      p("plant", 582, 350, 28, 14),
    ],
  },
  academy: {
    subtitle: "Foundations for what comes next",
    note: "STUDY RECORD",
    accent: 0xc4cce0,
    notes: { x: 352, y: 200 },
    furniture: [
      p("bookshelf", 48, 68, 64, 34),
      p("bookshelf", 560, 68, 64, 34),
      p("desk", 304, 128, 96, 24),
      ...[76, 500].flatMap((x) =>
        [200, 304].flatMap((y) => [
          p("desk", x, y, 96, 24),
          p("chair", x + 32, y + 34, 32, 18),
        ]),
      ),
      p("wall-clock", 220, 16, 32, 30),
      p("plant", 620, 380, 28, 14),
    ],
  },
  lab: {
    subtitle: "Experiments, systems and open questions",
    note: "RESEARCH TERMINAL",
    accent: 0xa9dadd,
    notes: { x: 352, y: 214 },
    furniture: [
      p("archive", 54, 54, 32, 42),
      p("archive", 92, 54, 32, 42),
      p("archive", 130, 54, 32, 42),
      p("desk", 288, 142, 96, 24),
      p("laptop", 322, 122, 32, 10),
      p("desk", 520, 184, 96, 24),
      p("laptop", 552, 164, 32, 10),
      p("chair", 552, 240, 32, 20),
      p("cabinet", 60, 286, 64, 38),
      p("blue-vase", 606, 338, 32, 14),
      p("bookshelf", 550, 66, 64, 30),
    ],
  },
  office: {
    subtitle: "Where engineering meets everyday work",
    note: "PROJECT DOSSIER",
    accent: 0xd7c498,
    notes: { x: 352, y: 250 },
    furniture: [
      p("archive", 52, 54, 32, 40),
      p("archive", 92, 54, 32, 40),
      p("wall-clock", 214, 12, 32, 30),
      p("long-counter", 272, 160, 128, 30),
      p("laptop", 322, 144, 32, 10),
      p("chair", 226, 186, 32, 20),
      p("chair", 426, 186, 32, 20),
      p("desk", 510, 302, 96, 24),
      p("laptop", 542, 282, 32, 10),
      p("reading-bench", 64, 340, 64, 16),
      p("plant", 610, 104, 28, 14),
    ],
  },
  workshop: {
    subtitle: "Ideas become useful things here",
    note: "BUILD LOG",
    accent: 0xe6bf8b,
    notes: { x: 352, y: 250 },
    furniture: [
      p("workbench", 44, 112, 128, 28),
      p("workbench", 500, 112, 128, 28),
      p("cabinet", 56, 250, 64, 38),
      p("cabinet", 560, 254, 64, 38),
      p("barrel", 160, 316, 32, 24),
      p("barrel", 516, 330, 32, 24),
      p("desk", 304, 176, 96, 24),
      p("laptop", 336, 154, 32, 10),
      p("small-stool", 258, 216, 32, 12),
      p("archive", 230, 50, 32, 36),
      p("plant", 618, 376, 28, 14),
    ],
  },
  library: {
    subtitle: "A collection, not a finish line",
    note: "KNOWLEDGE INDEX",
    accent: 0xd2bbd7,
    notes: { x: 352, y: 246 },
    furniture: [
      ...[48, 112, 528, 592].map((x) => p("bookshelf", x, 58, 64, 35)),
      ...[62, 570].flatMap((x) =>
        [170, 274].map((y) => p("bookshelf", x, y, 64, 34)),
      ),
      p("desk", 304, 164, 96, 24),
      p("round-table", 178, 294, 64, 24),
      p("reading-lamp", 212, 262, 32, 14),
      p("chair", 180, 362, 32, 20),
      p("round-table", 442, 294, 64, 24),
      p("reading-lamp", 476, 262, 32, 14),
      p("chair", 472, 362, 32, 20),
    ],
  },
  contact: {
    subtitle: "Good conversations start somewhere",
    note: "LETTERS & CONTACT",
    accent: 0xc5dcc5,
    notes: { x: 352, y: 252 },
    furniture: [
      ...[56, 96, 136].map((x) => p("mailboxes", x, 128, 32, 28)),
      p("long-counter", 288, 152, 128, 30),
      p("laptop", 338, 130, 32, 10),
      p("mailboxes", 558, 112, 32, 28),
      p("cabinet", 546, 230, 64, 36),
      p("reading-bench", 64, 340, 64, 16),
      p("reading-bench", 152, 340, 64, 16),
      p("blue-vase", 592, 350, 32, 14),
      p("wall-clock", 456, 22, 32, 30),
    ],
  },
};
