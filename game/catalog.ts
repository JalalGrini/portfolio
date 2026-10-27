import { authoredStations } from "./authoredRooms";
import { projects, profile, experience, skills } from "@/content/portfolio";
export type Exhibit = {
  id: string;
  title: string;
  text: string;
  prop: string;
  link?: string;
  linkLabel?: string;
};
export type Place = {
  id: string;
  name: string;
  short: string;
  district: string;
  summary: string;
  projectId?: string;
  theme: string;
  width: number;
  height: number;
  exhibits: Exhibit[];
};
const e = (
  id: string,
  title: string,
  text: string,
  prop: string,
  link?: string,
  linkLabel?: string,
): Exhibit => ({ id, title, text, prop, link, linkLabel });
const civic: Place[] = [
  {
    id: "about",
    name: "Jalal’s Green House",
    short: "Meet Jalal",
    district: "The beginning",
    summary: profile.bio,
    theme: "about",
    width: 704,
    height: 576,
    exhibits: [
      e("welcome", "A person behind the systems", profile.bio, "notebook"),
      e(
        "home",
        "From Meknes, Morocco",
        `${profile.name} · ${profile.role}. ${profile.location}.`,
        "blue-vase",
      ),
      e(
        "direction",
        "What connects the work",
        "Machine learning, data engineering and thoughtful software architecture are the threads connecting this town. Every project has its own door and its own evidence.",
        "desk",
      ),
      e(
        "github",
        "The public work",
        "Browse the public repositories; some research projects remain in design rather than deployed products.",
        "workstation",
        profile.github,
        "Open GitHub",
      ),
    ],
  },
  {
    id: "academy",
    name: "ENSAH Academy",
    short: "Education",
    district: "The beginning",
    summary: "AI & Digital Transformation at ENSA Al Hoceima.",
    theme: "academy",
    width: 768,
    height: 512,
    exhibits: [
      e(
        "study",
        "AI & Digital Transformation",
        "Currently studying AI & Digital Transformation at ENSA Al Hoceima.",
        "notebook",
      ),
      e(
        "foundation",
        "Foundations",
        "Mathematics, physics and engineering foundations support the work on intelligent systems.",
        "bookshelf",
      ),
      e(
        "practice",
        "Learning by building",
        "Explore the individual project houses to see research reports, data pipelines, applications and practical engineering.",
        "planning",
      ),
      e(
        "research",
        "Research with clear boundaries",
        "Design-stage research is labeled as such. A plan, dataset or report is not presented as a deployed product.",
        "microscope",
      ),
    ],
  },
  {
    id: "office",
    name: "The Experience Office",
    short: "Experience",
    district: "The beginning",
    summary: "Internships, responsibilities and engineering lessons.",
    theme: "office",
    width: 704,
    height: 448,
    exhibits: [
      ...experience.map((x, i) =>
        e(
          "experience-" + i,
          x.company,
          `${x.title} · ${x.period} · ${x.location}. ${x.text}`,
          "files",
        ),
      ),
      e(
        "role",
        "Working across the stack",
        "Backend APIs, data models, interface work, role-based access and practical reporting recur across the internship work.",
        "workstation",
      ),
      e(
        "honesty",
        "Evidence matters",
        "The financial-operations platform is presented as an undeployed repository project. Its own building explains the implementation details.",
        "notebook",
      ),
    ],
  },
  {
    id: "library",
    name: "The Skills Library",
    short: "Toolbox",
    district: "The beginning",
    summary: "The tools that connect the projects.",
    theme: "library",
    width: 832,
    height: 576,
    exhibits: skills.map((s, i) =>
      e(
        "skills-" + i,
        s.title,
        s.items.join(" · "),
        i % 2 ? "server" : "bookshelf",
      ),
    ),
  },
];
const fieldProps: Record<string, string[]> = {
  Research: ["telescope", "microscope", "server", "notebook", "planning"],
  "AI & Data": ["workstation", "server", "microscope", "notebook", "files"],
  Software: ["workstation", "planning", "printer", "files", "notebook"],
};
const categoryOrder: Record<string, number> = {
  Research: 0,
  "AI & Data": 1,
  Software: 2,
};
const orderedProjects = [...projects].sort(
  (a, b) => categoryOrder[a.category] - categoryOrder[b.category],
);
const projectPlaces: Place[] = orderedProjects.map((p, i) => {
  const props = fieldProps[p.category];
  const focal =
    p.id === "recipe"
      ? "kitchen"
      : p.id === "spam"
        ? "security"
        : p.id === "ocr"
          ? "printer"
          : p.id === "rag"
            ? "bookshelf"
            : p.id === "finance"
              ? "files"
              : props[0];
  return {
    id: "project-" + p.id,
    projectId: p.id,
    name: p.title,
    short: p.title,
    district:
      p.category === "Research"
        ? "Research ridge"
        : p.category === "AI & Data"
          ? "Data gardens"
          : "Builders’ lane",
    summary: p.subtitle,
    theme:
      p.category === "Research"
        ? "lab"
        : p.category === "AI & Data"
          ? "academy"
          : "workshop",
    width: [640, 832, 704, 576, 768][i % 5],
    height: [480, 576, 512, 448, 544][i % 5],
    exhibits: [
      e("overview", "The idea", p.description, focal),
      e(
        "stack",
        "The workbench",
        `Tools and technologies: ${p.stack.join(" · ")}. ${p.role ? "Jalal’s role: " + p.role + "." : ""}`,
        props[1],
      ),
      e("details", "Inside the project", p.highlights.join("\n\n"), props[2]),
      e(
        "status",
        "What exists today",
        `${p.status}. ${p.status.includes("Design") ? "This is design-stage research. No deployment or experimental results are claimed." : p.status.includes("CV-listed") ? "Included from the CV. No public repository is supplied." : "The descriptions reflect the portfolio’s reviewed source material; no additional results or adoption metrics are implied."}`,
        props[3],
      ),
      e(
        "source",
        "Source & next steps",
        p.repo
          ? "Inspect the repository for source code and project documentation."
          : "No public repository is supplied for this project. Ask Jalal about its current scope and next steps.",
        props[4],
        p.repo,
        p.repo ? "Open this project’s repository" : undefined,
      ),
    ],
  };
});
const contact: Place = {
  id: "contact",
  name: "The Post Office",
  short: "Contact & CV",
  district: "Until next time",
  summary: "Leave with a connection, not just a tour.",
  theme: "contact",
  width: 544,
  height: 416,
  exhibits: [
    e(
      "email",
      "The telephone desk",
      `Have a project, research question or opportunity? Contact ${profile.name} at ${profile.email}.`,
      "phone",
      "mailto:" + profile.email,
      "Write an email",
    ),
    e(
      "cv",
      "The CV counter",
      "Download the public CV for a direct overview of the background, experience and skills.",
      "printer",
      "/files/Jalal-Grini-CV.pdf",
      "Download the CV",
    ),
    e(
      "linkedin",
      "Stay connected",
      "Find Jalal on LinkedIn.",
      "notebook",
      profile.linkedin,
      "Open LinkedIn",
    ),
    e(
      "github",
      "Keep exploring",
      "The public GitHub profile brings the repositories together.",
      "workstation",
      profile.github,
      "Open GitHub",
    ),
  ],
};
export const places: Place[] = [...civic, ...projectPlaces, contact];
export const placeById = (id: string) => places.find((p) => p.id === id)!;
export const tourOrder = places.map((p) => p.id);
export const domainProps = [
  "server",
  "telescope",
  "microscope",
  "phone",
  "security",
  "workstation",
  "kitchen",
  "files",
  "planning",
  "notebook",
  "printer",
  "seat",
];
export type Station = Exhibit & {
  x: number;
  y: number;
  w: number;
  h: number;
  approach: { x: number; y: number };
};
export function stationsFor(place: Place): Station[] {
  const authored = authoredStations(place);
  if (authored) return authored;
  const spots = [
    { x: 72, y: 124 },
    { x: place.width - 172, y: 124 },
    { x: 72, y: place.height - 160 },
    { x: place.width - 172, y: place.height - 160 },
    { x: place.width / 2 - 48, y: 116 },
  ];
  const rotation = place.projectId
    ? (projects.findIndex((p) => p.id === place.projectId) * 2) % spots.length
    : 0;
  const spot = (i: number) => spots[(i + rotation) % spots.length];
  return place.exhibits.map((ex, i) => ({
    ...ex,
    ...spot(i),
    w: ["server", "files"].includes(ex.prop) ? 48 : 80,
    h: ["server", "files"].includes(ex.prop) ? 112 : 72,
    approach: {
      x: spot(i).x + 40,
      y: spot(i).y + (["server", "files"].includes(ex.prop) ? 128 : 88),
    },
  }));
}
