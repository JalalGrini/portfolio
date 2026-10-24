"use client";
import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Modal from "@/components/Modal";
import {
  Contact,
  Education,
  Experience,
  ProjectDetail,
  SkillGrid,
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
              Ideas into
              <br />
              <em>intelligent</em>
              <br />
              systems.
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
          <figure className="portrait">
            <img
              src="/assets/photos/jalal.jpg"
              alt="Jalal Grini at an ENSA Al Hoceima event"
            />
            <figcaption>
              <span>Jalal Grini</span>
              <span>{profile.location}</span>
            </figcaption>
          </figure>
        </section>
        <section className="about-strip">
          <span className="eyebrow">01 / THE APPROACH</span>
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
          <div className="project-grid">
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
                    <img
                      src={`/assets/game/house-${p.category === "Research" ? "lab" : p.id === "finance" ? "office" : "academy"}.png`}
                      alt=""
                    />
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
          <Experience onProject={setSelected} />
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
          <SkillGrid />
        </section>
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">05 / FOUNDATIONS</span>
              <h2>Education.</h2>
            </div>
          </div>
          <Education />
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
