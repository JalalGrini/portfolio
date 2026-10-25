export type Character = {
  body: "male" | "female";
  skin: string;
  eye: string;
  hair: string;
  hairColor: string;
  beard: string;
  top: string;
  topColor: string;
  legs: string;
  legsColor: string;
  feet: string;
  feetColor: string;
  glasses: string;
};
export const defaultCharacter: Character = {
  body: "male",
  skin: "olive",
  eye: "brown",
  hair: "curly_short2",
  hairColor: "black",
  beard: "none",
  top: "tshirt",
  topColor: "forest",
  legs: "pants",
  legsColor: "charcoal",
  feet: "shoes",
  feetColor: "black",
  glasses: "none",
};
export const jalalCharacter: Character = {
  ...defaultCharacter,
  skin: "light",
  hair: "natural",
  beard: "mustache",
  top: "longsleeve",
  topColor: "tan",
};
export const hairStyles = [
  "afro",
  "bangs",
  "bedhead",
  "bob",
  "buzzcut",
  "cornrows",
  "curly_short",
  "curly_short2",
  "curtains",
  "dreadlocks_short",
  "flat_top_fade",
  "high_and_tight",
  "long",
  "long_straight",
  "loose",
  "messy1",
  "natural",
  "parted",
  "pixie",
  "plain",
  "spiked",
  "swoop",
];
export const tops: Record<string, string> = {
  tshirt: "shortsleeve/tshirt",
  vneck: "shortsleeve/tshirt_vneck",
  polo: "shortsleeve/shortsleeve_polo",
  longsleeve: "longsleeve/longsleeve",
  cardigan: "longsleeve/longsleeve2_cardigan",
  buttoned: "longsleeve/longsleeve2_buttoned",
  sleeveless: "sleeveless/sleeveless2",
};
export const legStyles: Record<string, string> = {
  pants: "pants",
  cuffed: "cuffed",
  formal: "formal",
  shorts: "shorts/shorts",
  leggings: "leggings",
};
export const feetStyles: Record<string, string> = {
  shoes: "shoes/basic",
  boots: "boots/basic",
  sandals: "sandals",
};
export const skinColors = [
  "light",
  "amber",
  "olive",
  "taupe",
  "bronze",
  "brown",
  "black",
];
export const hairColors = [
  "black",
  "raven",
  "dark_brown",
  "chestnut",
  "light_brown",
  "blonde",
  "ginger",
  "white",
  "gray",
  "rose",
  "purple",
  "blue",
  "green",
];
export const clothColors = [
  "forest",
  "teal",
  "navy",
  "blue",
  "sky",
  "white",
  "tan",
  "brown",
  "maroon",
  "red",
  "pink",
  "lavender",
  "purple",
  "yellow",
  "gray",
  "charcoal",
  "black",
];
export const swatches: Record<string, string> = {
  light: "#f4d2b3",
  amber: "#d7a26b",
  olive: "#c79470",
  taupe: "#ab8270",
  bronze: "#a46b47",
  brown: "#7c503c",
  black: "#34282a",
  raven: "#20222e",
  dark_brown: "#49352d",
  chestnut: "#78503c",
  light_brown: "#a06f44",
  blonde: "#d4b174",
  ginger: "#c2783e",
  white: "#e9e5d7",
  gray: "#93938b",
  rose: "#b57280",
  purple: "#8870a2",
  blue: "#6487b2",
  green: "#669967",
  forest: "#476b52",
  teal: "#448584",
  navy: "#37435c",
  sky: "#9abcc1",
  tan: "#c3a57e",
  maroon: "#774a54",
  red: "#b86552",
  pink: "#cf9ca4",
  lavender: "#b4a3c8",
  yellow: "#d6ba78",
  charcoal: "#454b4b",
};
const base = "/assets/game/lpc/spritesheets/";
type Palette = Record<string, Record<string, string[]>>;
let palettes: Promise<Palette> | undefined;
const images = new Map<string, Promise<HTMLImageElement>>();
function image(src: string) {
  if (!images.has(src))
    images.set(
      src,
      new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () =>
          reject(new Error(`Character layer unavailable: ${src}`));
        im.src = src;
      }),
    );
  return images.get(src)!;
}
const rgb = (s: string) => {
  s = s.replace("#", "");
  return parseInt(s, 16);
};
function recolor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: Palette,
  maps: [string, string][],
) {
  const d = ctx.getImageData(0, 0, w, h);
  const lut = new Map<number, number>();
  const defaults: Record<string, string> = {
    body: "light",
    hair: "orange",
    cloth: "white",
    eye: "blue",
  };
  for (const [m, target] of maps) {
    const from = pal[m][defaults[m]],
      to = pal[m][target] || from;
    from.forEach((s, i) => lut.set(rgb(s), rgb(to[i])));
  }
  for (let i = 0; i < d.data.length; i += 4) {
    if (!d.data[i + 3]) continue;
    const v = lut.get((d.data[i] << 16) | (d.data[i + 1] << 8) | d.data[i + 2]);
    if (v !== undefined) {
      d.data[i] = v >> 16;
      d.data[i + 1] = (v >> 8) & 255;
      d.data[i + 2] = v & 255;
    }
  }
  ctx.putImageData(d, 0, 0);
}
export async function composeCharacter(
  c: Character,
  full = true,
  staticPreview = false,
): Promise<HTMLCanvasElement> {
  const pal = await (palettes ??= fetch("/assets/game/lpc/palettes.json").then(
    (r) => r.json(),
  ));
  const thin = c.body === "female" ? "thin" : "male";
  const layers: {
    path: string;
    maps: [string, string][];
    glasses?: boolean;
  }[] = [
    { path: `body/bodies/${c.body}`, maps: [["body", c.skin]] },
    {
      path: `feet/${feetStyles[c.feet]}/${thin}`,
      maps: [["cloth", c.feetColor]],
    },
    {
      path: `legs/${legStyles[c.legs]}/${thin}`,
      maps: [["cloth", c.legsColor]],
    },
    {
      path: `torso/clothes/${tops[c.top]}/${c.body}`,
      maps: [["cloth", c.topColor]],
    },
    {
      path: `head/heads/human/${c.body}`,
      maps: [
        ["body", c.skin],
        ["eye", c.eye],
      ],
    },
    ...(c.beard !== "none"
      ? [
          {
            path:
              c.beard === "mustache"
                ? "beards/mustache/basic"
                : `beards/beard/${c.beard}`,
            maps: [["hair", c.hairColor]] as [string, string][],
          },
        ]
      : []),
    ...(c.glasses !== "none"
      ? [
          {
            path: `facial/glasses/${c.glasses}/adult`,
            maps: [] as [string, string][],
            glasses: true,
          },
        ]
      : []),
    ...(c.hair !== "none"
      ? [
          {
            path: `hair/${c.hair}/adult`,
            maps: [["hair", c.hairColor]] as [string, string][],
          },
        ]
      : []),
  ];
  const anims = full ? ["walk", "idle", "run", "sit", "emote"] : ["walk"];
  const out = document.createElement("canvas");
  out.width = staticPreview ? 64 : 576;
  out.height = staticPreview ? 64 : 256 * anims.length;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  await Promise.all(
    anims.map(async (anim, ai) => {
      const loaded = await Promise.all(
        layers.map((l) =>
          image(
            base + l.path + "/" + anim + (l.glasses ? "/black" : "") + ".png",
          ),
        ),
      );
      const local = document.createElement("canvas");
      local.width = staticPreview ? 64 : 576;
      local.height = staticPreview ? 64 : 256;
      const lc = local.getContext("2d")!;
      for (let i = 0; i < layers.length; i++) {
        lc.clearRect(0, 0, local.width, local.height);
        if (staticPreview)
          lc.drawImage(loaded[i], 0, 128, 64, 64, 0, 0, 64, 64);
        else lc.drawImage(loaded[i], 0, 0);
        if (layers[i].maps.length)
          recolor(lc, local.width, local.height, pal, layers[i].maps);
        ctx.drawImage(local, 0, ai * 256);
      }
    }),
  );
  return out;
}
export function randomCharacter(): Character {
  return {
    ...defaultCharacter,
    body: Math.random() > 0.5 ? "male" : "female",
    skin: skinColors[Math.floor(Math.random() * skinColors.length)],
    hair: hairStyles[Math.floor(Math.random() * hairStyles.length)],
    hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
    top: Object.keys(tops)[
      Math.floor(Math.random() * Object.keys(tops).length)
    ],
    topColor: clothColors[Math.floor(Math.random() * clothColors.length)],
    legsColor: ["navy", "charcoal", "tan", "black"][
      Math.floor(Math.random() * 4)
    ],
    glasses: Math.random() > 0.75 ? "round" : "none",
  };
}
export function validCharacter(v: unknown): v is Character {
  if (!v || typeof v !== "object") return false;
  const c = v as Character;
  return (
    ["male", "female"].includes(c.body) &&
    skinColors.includes(c.skin) &&
    [
      "blue",
      "green",
      "purple",
      "red",
      "orange",
      "yellow",
      "brown",
      "gray",
    ].includes(c.eye) &&
    (c.hair === "none" || hairStyles.includes(c.hair)) &&
    hairColors.includes(c.hairColor) &&
    ["none", "basic", "trimmed", "mustache", "5oclock_shadow"].includes(
      c.beard,
    ) &&
    c.top in tops &&
    clothColors.includes(c.topColor) &&
    c.legs in legStyles &&
    clothColors.includes(c.legsColor) &&
    c.feet in feetStyles &&
    clothColors.includes(c.feetColor) &&
    ["none", "glasses", "round", "nerd", "shades"].includes(c.glasses)
  );
}
