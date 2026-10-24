"use client";
import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import {
  Reveal,
  ReadingProgress,
  ProjectSpotlight,
  SkillsWorkbench,
} from "@/components/PortfolioStory";
import Modal from "@/components/Modal";
import {
  Contact,
  Education,
  Experience,
  ProjectDetail,
  Tags,
} from "@/components/PortfolioContent";
import { profile, projects, Project } from "@/content/portfolio";
export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const filtered = projects.filter(
    (p) =>
      (filter === "All" || p.category === filter) &&
      `${p.title} ${p.stack.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Nav />
      <ReadingProgress />
      <a className="skip-link" href="#work">
        Skip to projects
      </a>
      <main className="classic">
        <section className="portfolio-hero">
          <div>
            <span className="eyebrow">
              <span className="live-dot" /> AI & DIGITAL TRANSFORMATION
              ENGINEERING
            </span>
            <h1>
              Engineering,
              <br />
              with a little
              <br />
              <em>wonder.</em>
            </h1>
            <p>
              I’m Jalal. I build at the intersection of machine learning, data
              and software engineering.
            </p>
            <div className="button-row">
              <a href="#work" className="button primary">
                Explore my work ↓
              </a>
              <a href="/files/Jalal-Grini-CV.pdf" download className="button">
                Download CV ↗
              </a>
            </div>
            <div className="hero-caption">
              <span>ENSA Al Hoceima</span>
              <span>Expected graduation · 2027</span>
            </div>
          </div>
          <div className="portfolio-window">
            <div className="window-heading">
              <span>AN ENGINEER’S FIELD NOTES</span>
              <span>01 — 16</span>
            </div>
            <Link
              href="/play/"
              className="window-world"
              aria-label="Explore my interactive career town"
            >
              <img
                src="/assets/game/town-preview.png"
                alt="A forest village built to explore Jalal’s engineering journey"
              />
              <div className="window-world-caption">
                <span>There’s a world behind the work.</span>
                <span className="round-arrow">↗</span>
              </div>
            </Link>
            <div className="workbench-label">
              <span className="live-dot" /> ON THE WORKBENCH
            </div>
            {projects.slice(0, 3).map((p, i) => (
              <button
                className="workbench-row"
                key={p.id}
                onClick={() => setSelected(p)}
              >
                <span className="workbench-number">0{i + 1}</span>
                <span>
                  <strong>{p.title}</strong>
                  <small>
                    {p.id === "sentinel"
                      ? "Cloud-native MLOps & LLMOps"
                      : p.id === "orion"
                        ? "Knowledge graphs & multimodal AI"
                        : "Data engineering & recommendations"}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>
        <section className="about-strip">
          <div className="about-identity">
            <img
              src="/assets/photos/jalal.jpg"
              alt="Jalal Grini at an ENSA Al Hoceima event"
            />
            <div>
              <span className="eyebrow">01 / THE PERSON</span>
              <h2>Jalal Grini.</h2>
              <span>{profile.location}</span>
            </div>
          </div>
          <p>{profile.bio}</p>
          <div className="approach-notes">
            <span>Model with purpose.</span>
            <span>Build with structure.</span>
            <span>Think beyond deployment.</span>
          </div>
        </section>
        <section id="work" className="work-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / SELECTED WORK & EXPLORATIONS</span>
              <h2>
                Built. Researched.
                <br />
                <em>Still asking questions.</em>
              </h2>
            </div>
            <p>
              From data pipelines to full-stack platforms. Design-stage research
              is labeled as such.
            </p>
          </div>
          <Reveal>
            <ProjectSpotlight onProject={setSelected} />
          </Reveal>
          <div className="catalog-heading">
            <span className="eyebrow">THE COMPLETE PROJECT INDEX</span>
            <span>Search, filter, or follow a curiosity.</span>
          </div>
          <div className="project-toolbar">
            <div className="filter-group" aria-label="Filter projects">
              {["All", "AI & Data", "Research", "Software"].map((f) => (
                <button
                  key={f}
                  aria-pressed={f === filter}
                  className={f === filter ? "active" : ""}
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
          <div className="project-grid" key={filter + search}>
            {filtered.map((p, i) => (
              <button
                className={`project-card ${p.featured ? "featured" : ""}`}
                key={p.id}
                onClick={() => setSelected(p)}
              >
                <div className="card-top">
                  <span>
                    {String(i + 1).padStart(2, "0")} / {p.category}
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
                {p.featured && (
                  <div className={`project-art art-${p.id}`} aria-hidden="true">
                    <span className="project-monogram">
                      {p.title.split(" ")[0]}
                    </span>
                    <span className="project-discipline">
                      {p.category === "Research"
                        ? "RESEARCH NOTE"
                        : p.category === "Software"
                          ? "SOFTWARE STUDY"
                          : "DATA EXPLORATION"}
                    </span>
                  </div>
                )}
                <span className="status">{p.status}</span>
                <h3>{p.title}</h3>
                <p>{p.subtitle}</p>
                <Tags items={p.stack.slice(0, 4)} />
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <h3>No matching projects.</h3>
              <p>Try another title or technology, or clear the filters.</p>
              <button
                className="button"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Show all projects
              </button>
            </div>
          )}
        </section>
        <section className="section-block" id="experience">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / IN PRACTICE</span>
              <h2>
                Learning by
                <br />
                <em>building.</em>
              </h2>
            </div>
          </div>
          <Reveal>
            <Experience onProject={setSelected} />
          </Reveal>
        </section>
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">04 / THE TOOLKIT</span>
              <h2>
                Across the stack.
                <br />
                <em>Connected by curiosity.</em>
              </h2>
            </div>
          </div>
          <Reveal>
            <SkillsWorkbench onProject={setSelected} />
          </Reveal>
        </section>
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">05 / FOUNDATIONS</span>
              <h2>Education.</h2>
            </div>
          </div>
          <Reveal>
            <Education />
          </Reveal>
        </section>
        <section className="contact-section" id="contact">
          <span className="eyebrow">06 / WHAT’S NEXT?</span>
          <Contact />
        </section>
        <div className="town-invitation">
          <img src="/assets/game/house-about.png" alt="" />
          <div>
            <span className="eyebrow">A DIFFERENT WAY TO EXPLORE</span>
            <h3>There’s a little world behind this work.</h3>
            <p>
              Create a character and discover the same portfolio, one place at a
              time.
            </p>
            <Link className="text-button" href="/play/">
              Take a walk through career town ↗
            </Link>
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <span>© 2026 Jalal Grini</span>
        <Link href="/credits/">Credits & licenses ↗</Link>
        <a href={profile.github} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </footer>
      {selected && (
        <Modal title="PROJECT / FIELD NOTES" onClose={() => setSelected(null)}>
          <ProjectDetail project={selected} />
        </Modal>
      )}
    </>
  );
}
