"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";
import {
  profile,
  projects,
  skills,
  experience,
  Project,
} from "@/content/portfolio";
import Modal from "./Modal";
import FlowArtwork from "./FlowArtwork";
import { ProjectDetail } from "./PortfolioContent";

const featuredIds = ["orion", "sentinel", "finance", "matchwork"];
const covers: Record<string, string> = {
  orion: "orion",
  sentinel: "sentinel",
  finance: "terrain",
  matchwork: "orion",
};
const domains = [
  {
    title: "Intelligence",
    description:
      "Models that retrieve, reason, and explain. Data and evaluation come before big claims.",
    project: "orion",
    icons: ["python", "pytorch", "scikitlearn"],
    tools: skills[0].items,
  },
  {
    title: "Platforms",
    description:
      "Interfaces and services engineered as one coherent product—from permissions to the last interaction.",
    project: "finance",
    icons: ["react", "nextdotjs", "typescript", "fastapi"],
    tools: skills[1].items,
  },
  {
    title: "Infrastructure",
    description:
      "The work beyond a notebook: reproducible delivery, observable services, and cost-aware infrastructure.",
    project: "sentinel",
    icons: ["docker", "terraform", "githubactions"],
    tools: skills[2].items,
  },
  {
    title: "Foundations",
    description:
      "Relational, document, and graph models chosen for the questions a system needs to answer.",
    project: "matchwork",
    icons: ["postgresql", "neo4j", "python"],
    tools: skills[3].items,
  },
];
function Word({
  children,
  index,
  total,
  progress,
  reduced,
}: {
  children: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const color = useTransform(
    progress,
    [Math.max(0, (index - 2) / total), Math.min(1, (index + 3) / total)],
    ["#696b60", "#20251d"],
  );
  return (
    <motion.span style={{ color: reduced ? "#20251d" : color }}>
      {children}{" "}
    </motion.span>
  );
}
function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center 30%"],
  });
  const words =
    "I turn complex ideas into systems people can actually use. From intelligent models to the software and infrastructure that bring them to life.".split(
      " ",
    );
  return (
    <section className="studio-manifesto" id="about" ref={ref}>
      <div className="studio-section-label">
        <span>01 — THE WAY I THINK</span>
        <span>ENGINEERING / WITH INTENT</span>
      </div>
      <h2>
        {words.map((w, i) => (
          <Word
            key={i}
            index={i}
            total={words.length}
            progress={scrollYProgress}
            reduced={!!reduced}
          >
            {w}
          </Word>
        ))}
      </h2>
      <div className="studio-person">
        <div className="studio-person-photo">
          <img
            src="/assets/photos/jalal.jpg"
            alt="Jalal Grini at ENSA Al Hoceima"
            loading="lazy"
          />
        </div>
        <div>
          <h3>Jalal Grini</h3>
          <p>
            AI & Digital Transformation Engineering
            <br />
            ENSA Al Hoceima · Morocco · Expected 2027
          </p>
        </div>
        <p className="studio-person-note">
          A curious mind.
          <br />
          An end-to-end approach.
        </p>
      </div>
    </section>
  );
}
export default function CinematicPortfolio() {
  const reduced = useReducedMotion();
  const hero = useRef<HTMLElement>(null);
  const timeline = useRef<HTMLElement>(null);
  const [light, setLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [domain, setDomain] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { scrollYProgress } = useScroll();
  const reading = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const { scrollYProgress: heroProgress } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 180]);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timeline,
    offset: ["start 75%", "end 60%"],
  });
  const px = useMotionValue(0),
    py = useMotionValue(0);
  const mx = useSpring(px, { stiffness: 40, damping: 25 }),
    my = useSpring(py, { stiffness: 40, damping: 25 });
  useEffect(() => {
    let preference: string | null = null;
    try {
      preference = localStorage.getItem("portfolio-theme");
    } catch {}
    const preferredLight = preference
      ? preference === "light"
      : matchMedia("(prefers-color-scheme: light)").matches;
    setLight(preferredLight);
    document.documentElement.dataset.theme = preferredLight ? "light" : "dark";
  }, []);
  function toggleTheme() {
    const v = !light;
    setLight(v);
    document.documentElement.dataset.theme = v ? "light" : "dark";
    try {
      localStorage.setItem("portfolio-theme", v ? "light" : "dark");
    } catch {}
  }
  const list = featuredIds
    .map((id) => projects.find((p) => p.id === id)!)
    .filter(Boolean);
  const current = list[active];
  const d = domains[domain];
  const filtered = projects.filter(
    (p) =>
      (filter === "All" || p.category === filter) &&
      `${p.title} ${p.stack.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function choose(i: number) {
    setDirection(i > active ? 1 : -1);
    setActive((i + list.length) % list.length);
  }
  return (
    <div className="studio-root" data-mode={light ? "light" : "dark"}>
      <a className="skip-link" href="#work">
        Skip to projects
      </a>
      <motion.div
        className="studio-reading"
        aria-hidden="true"
        style={{ scaleX: reduced ? scrollYProgress : reading }}
      />
      <header className="studio-nav" data-open={menuOpen}>
        <Link href="/" className="studio-brand" aria-label="Jalal Grini home">
          JG
          <span>
            ENGINEERING
            <br />& INTELLIGENCE
          </span>
        </Link>
        <nav
          id="studio-nav-links"
          aria-label="Main navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#work">WORK</a>
          <a href="#about">ABOUT</a>
          <a href="#skills">STACK</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="studio-nav-actions">
          <button
            className="studio-menu-toggle"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="studio-nav-links"
            onClick={() => setMenuOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenuOpen(false);
            }}
          >
            {menuOpen ? "CLOSE" : "MENU"}
          </button>
          <button
            className="studio-theme"
            onClick={toggleTheme}
            aria-label={
              light ? "Switch to dark theme" : "Switch to light theme"
            }
          >
            {light ? "◐" : "◑"}
          </button>
          <Link href="/play/" className="studio-world-link">
            <span className="studio-world-label">
              <span className="studio-world-prefix">ENTER </span>TOWN
            </span>
            <span>↗</span>
          </Link>
        </div>
      </header>
      <main id="main" className="studio-main">
        <section
          className="studio-hero"
          ref={hero}
          onPointerMove={(e) => {
            if (!reduced && e.pointerType === "mouse") {
              px.set((e.clientX / innerWidth - 0.5) * -22);
              py.set((e.clientY / innerHeight - 0.5) * -18);
            }
          }}
          onPointerLeave={() => {
            px.set(0);
            py.set(0);
          }}
        >
          <motion.div
            className="studio-hero-depth"
            style={{ y: reduced ? 0 : heroY }}
          >
            <motion.div
              className="studio-flow-frame"
              style={{ x: reduced ? 0 : mx, y: reduced ? 0 : my }}
            >
              <FlowArtwork />
            </motion.div>
          </motion.div>
          <div className="studio-hero-shade" />
          <div className="studio-hero-content">
            <motion.p
              className="studio-kicker"
              initial={{ y: reduced ? 0 : 12 }}
              animate={{ y: 0 }}
            >
              AI & SOFTWARE ENGINEERING — MOROCCO
            </motion.p>
            <h1>
              <motion.span
                initial={{ y: reduced ? 0 : 40 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              >
                JALAL
              </motion.span>
              <motion.span
                className="studio-outline"
                initial={{ y: reduced ? 0 : 60 }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              >
                GRINI
              </motion.span>
            </h1>
            <div className="studio-hero-actions">
              <a
                href="/files/Jalal-Grini-CV.pdf"
                className="studio-button filled"
                download
              >
                DOWNLOAD CV <span>↓</span>
              </a>
              <a href="#work" className="studio-button">
                VIEW THE WORK <span>↗</span>
              </a>
              <a href="#contact" className="studio-button">
                LET’S TALK <span>↗</span>
              </a>
            </div>
            <p className="studio-hero-line">
              Intelligence, built into useful systems.
            </p>
          </div>
          <div className="studio-hero-foot">
            <span>MODELS · SOFTWARE · INFRASTRUCTURE</span>
            <a href="#about">
              SCROLL TO EXPLORE <span>↓</span>
            </a>
            <span>01 / 06</span>
          </div>
        </section>
        <Manifesto />
        <section className="studio-work" id="work">
          <div className="studio-section-label">
            <span>02 — SELECTED WORK</span>
            <span>
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(list.length).padStart(2, "0")}
            </span>
          </div>
          <div className="studio-work-heading">
            <h2>
              Systems.
              <br />
              <span>Not just screens.</span>
            </h2>
            <p>
              Research in progress. Products put into practice.
              <br />
              Different problems. The same curiosity.
            </p>
          </div>
          <div
            className="cinema-showcase"
            aria-label="Selected project showcase"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={current.id}
                className="cinema-project"
                role="tabpanel"
                id="featured-project-panel"
                aria-label={current.title}
                initial={{
                  opacity: reduced ? 1 : 0,
                  x: reduced ? 0 : direction * 45,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: reduced ? 1 : 0,
                  x: reduced ? 0 : direction * -35,
                }}
                transition={{
                  duration: reduced ? 0 : 0.48,
                  ease: [0.2, 0.75, 0.2, 1],
                }}
              >
                <button
                  className="cinema-cover"
                  onClick={() => setSelected(current)}
                  aria-label={`View case study — ${current.title}`}
                >
                  <img
                    src={`/assets/studio/${covers[current.id]}.webp`}
                    alt={`Conceptual visual study for ${current.title}; not a product screenshot`}
                    loading="lazy"
                  />
                  <div className="cinema-cover-shade" />
                  <span className="cinema-project-category">
                    {current.category} /{" "}
                    {current.id === "finance"
                      ? "2026"
                      : "RESEARCH & ENGINEERING"}
                  </span>
                  <span className="cinema-cover-title">{current.title}</span>
                  <span className="cinema-open">
                    OPEN CASE STUDY <b>↗</b>
                  </span>
                </button>
                <div className="cinema-caption">
                  <div>
                    <span className="status">{current.status}</span>
                    <h3>{current.subtitle}</h3>
                  </div>
                  <div className="cinema-stack">
                    {current.stack.slice(0, 4).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="cinema-controls">
              <div
                className="cinema-project-tabs"
                role="tablist"
                aria-label="Featured projects"
              >
                {list.map((p, i) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Feature ${p.title}`}
                    aria-controls="featured-project-panel"
                    tabIndex={i === active ? 0 : -1}
                    id={`feature-${i}`}
                    onKeyDown={(e) => {
                      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                        e.preventDefault();
                        const next =
                          (i + (e.key === "ArrowRight" ? 1 : list.length - 1)) %
                          list.length;
                        choose(next);
                        document.getElementById(`feature-${next}`)?.focus();
                      }
                    }}
                    onClick={() => choose(i)}
                  >
                    <span>0{i + 1}</span>
                    <strong>{p.title}</strong>
                  </button>
                ))}
              </div>
              <div className="cinema-arrows">
                <button
                  aria-label="Previous featured project"
                  onClick={() => choose(active - 1)}
                >
                  ←
                </button>
                <button
                  aria-label="Next featured project"
                  onClick={() => choose(active + 1)}
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <div className="studio-catalog">
            <div className="studio-catalog-heading">
              <h3>The complete index.</h3>
              <span>{projects.length} PROJECTS / EXPLORATIONS</span>
            </div>
            <div className="project-toolbar">
              <div className="filter-group" aria-label="Filter projects">
                {["All", "AI & Data", "Research", "Software"].map((f) => (
                  <button
                    key={f}
                    aria-pressed={filter === f}
                    className={filter === f ? "active" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <label className="project-search">
                <span className="sr-only">
                  Search projects by title or technology
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a project or technology…"
                />
              </label>
            </div>
            <p className="results-count" aria-live="polite">
              {filtered.length} projects
            </p>
            <div className="studio-index">
              {filtered.map((p, i) => (
                <button
                  className="project-card"
                  key={p.id}
                  onClick={() => setSelected(p)}
                >
                  <span className="studio-index-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{p.title}</h3>
                  <span className="studio-index-category">{p.category}</span>
                  <span className="status">{p.status}</span>
                  <span className="studio-index-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-state">
                <h3>No matching projects.</h3>
                <p>Try another title or technology.</p>
                <button
                  className="studio-button"
                  onClick={() => {
                    setFilter("All");
                    setSearch("");
                  }}
                >
                  Show all projects
                </button>
              </div>
            )}
          </div>
        </section>
        <section className="studio-skills" id="skills">
          <div className="studio-section-label">
            <span>03 — THE ENGINEERING STACK</span>
            <span>CONNECTED BY PURPOSE</span>
          </div>
          <div className="studio-skills-layout">
            <div className="studio-skills-intro">
              <h2>
                One practice.
                <br />
                <span>Many layers.</span>
              </h2>
              <p>
                A model is only part of a system.
                <br />
                Select a layer to explore the rest.
              </p>
              <div
                className="studio-domain-tabs"
                role="tablist"
                aria-label="Engineering domains"
              >
                {domains.map((x, i) => (
                  <button
                    key={x.title}
                    role="tab"
                    id={`domain-${i}`}
                    aria-controls="domain-panel"
                    aria-selected={domain === i}
                    tabIndex={domain === i ? 0 : -1}
                    onClick={() => setDomain(i)}
                    onKeyDown={(e) => {
                      if (
                        [
                          "ArrowRight",
                          "ArrowDown",
                          "ArrowLeft",
                          "ArrowUp",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                        const n =
                          (i +
                            (["ArrowRight", "ArrowDown"].includes(e.key)
                              ? 1
                              : 3)) %
                          4;
                        setDomain(n);
                        document.getElementById(`domain-${n}`)?.focus();
                      }
                    }}
                  >
                    <span>0{i + 1}</span>
                    {x.title}
                    <b aria-hidden="true">{i === domain ? "−" : "+"}</b>
                  </button>
                ))}
              </div>
            </div>
            <div
              className="studio-domain-panel"
              id="domain-panel"
              role="tabpanel"
              aria-labelledby={`domain-${domain}`}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={domain}
                  initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -12 }}
                  transition={{ duration: reduced ? 0 : 0.3 }}
                >
                  <div className="studio-domain-art">
                    <span className="studio-domain-number" aria-hidden="true">
                      0{domain + 1}
                    </span>
                    <div className="studio-logo-row">
                      {d.icons.map((icon, i) => (
                        <motion.div
                          key={icon}
                          initial={{ y: reduced ? 0 : 20 }}
                          animate={{ y: 0 }}
                          transition={{
                            delay: reduced ? 0 : i * 0.05,
                            duration: 0.5,
                          }}
                        >
                          <img
                            src={`/assets/brands/${icon}.svg`}
                            alt={icon.replace("dotjs", ".js")}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <h3>{d.title}</h3>
                  <p>{d.description}</p>
                  <div className="studio-tools">
                    {d.tools.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <button
                    className="studio-proof"
                    onClick={() =>
                      setSelected(projects.find((p) => p.id === d.project)!)
                    }
                  >
                    <span>
                      SEE IT IN CONTEXT
                      <strong>
                        {projects.find((p) => p.id === d.project)?.title}
                      </strong>
                    </span>
                    <b>↗</b>
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
        <section className="studio-journey" id="experience" ref={timeline}>
          <div className="studio-section-label">
            <span>04 — THE JOURNEY</span>
            <span>LEARN / BUILD / REPEAT</span>
          </div>
          <div className="studio-journey-layout">
            <div>
              <h2>
                Progress is
                <br />
                <span>a practice.</span>
              </h2>
              <p>
                Foundations in mathematics and physics.
                <br />
                Experience making ideas work.
              </p>
            </div>
            <div className="studio-timeline">
              <motion.div
                className="studio-timeline-line"
                style={{ scaleY: reduced ? 1 : timelineProgress }}
              />
              {[
                {
                  period: "2022 — 2024",
                  title: "Mathematics & Physics",
                  company: "ENSA Al Hoceima",
                  text: "Integrated preparatory cycle. Learning to take complex problems apart.",
                },
                {
                  period: "2024 — 2027 · Expected",
                  title: "AI & Digital Transformation",
                  company: "ENSA Al Hoceima",
                  text: "Engineering degree. Connecting intelligent models, software architecture, and practical systems.",
                },
                ...experience.map((e) => ({
                  period: e.period,
                  title: e.title,
                  company: e.company,
                  text: e.text,
                  project: e.project,
                })),
              ].map((e, i) => (
                <motion.article
                  key={e.title}
                  initial={{ y: reduced ? 0 : 24 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7 }}
                >
                  <span className="studio-timeline-dot" />
                  <span className="studio-kicker">{e.period}</span>
                  <h3>{e.title}</h3>
                  <strong>{e.company}</strong>
                  <p>{e.text}</p>
                  {"project" in e && (
                    <button
                      className="studio-text-link"
                      onClick={() =>
                        setSelected(projects.find((p) => p.id === e.project)!)
                      }
                    >
                      EXPLORE THE WORK ↗
                    </button>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
        <section className="studio-contact" id="contact">
          <div className="studio-section-label">
            <span>05 — WHAT’S NEXT</span>
            <span>{profile.location.toUpperCase()}</span>
          </div>
          <p className="studio-kicker">GOOD WORK STARTS WITH A CONVERSATION.</p>
          <h2>
            LET’S BUILD
            <br />
            <span>SOMETHING REAL.</span>
          </h2>
          <a className="studio-email" href={`mailto:${profile.email}`}>
            {profile.email}
            <span>↗</span>
          </a>
          <div className="studio-contact-links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              GITHUB ↗
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN ↗
            </a>
            <a href="/files/Jalal-Grini-CV.pdf" download>
              DOWNLOAD CV ↓
            </a>
          </div>
        </section>
      </main>
      <footer className="studio-footer">
        <span>© 2026 JALAL GRINI</span>
        <span>ENGINEERED WITH CURIOSITY.</span>
        <Link href="/credits/">CREDITS ↗</Link>
      </footer>
      {selected && (
        <Modal
          title={`${selected.category.toUpperCase()} / CASE STUDY`}
          className="studio-modal"
          onClose={() => setSelected(null)}
        >
          {covers[selected.id] && (
            <img
              className="studio-case-image"
              src={`/assets/studio/${covers[selected.id]}.webp`}
              alt="Conceptual project imagery"
            />
          )}
          <ProjectDetail project={selected} />
        </Modal>
      )}
    </div>
  );
}
