"use client";
import { useId, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { Project, projects, skills } from "@/content/portfolio";
import { Tags } from "./PortfolioContent";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="reading-progress"
      aria-hidden="true"
      style={{ scaleX: reduced ? scrollYProgress : smooth }}
    />
  );
}
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ y: reduced ? 0 : 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
const focus = ["sentinel", "orion", "finance", "matchwork"];
export function ProjectSpotlight({
  onProject,
}: {
  onProject: (p: Project) => void;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const list = focus
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => !!p);
  const p = list[index];
  const id = useId();
  return (
    <div className="casebook">
      <div
        className="casebook-index"
        role="tablist"
        aria-label="Featured project field notes"
        aria-orientation="vertical"
      >
        <p className="eyebrow">A CLOSER LOOK</p>
        {list.map((project, i) => (
          <button
            role="tab"
            key={project.id}
            aria-selected={i === index}
            tabIndex={i === index ? 0 : -1}
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel`}
            onClick={() => setIndex(i)}
            onKeyDown={(e) => {
              if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? list.length - 1
                    : (i + (e.key === "ArrowDown" ? 1 : list.length - 1)) %
                      list.length;
              setIndex(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
            className={i === index ? "active" : ""}
          >
            <span>0{i + 1}</span>
            <strong>{project.title}</strong>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div
        className="casebook-sheet"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${index}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.id}
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -8 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <div className="casebook-topline">
              <span className="status">{p.status}</span>
              <span className="casebook-page">FIELD NOTE / 0{index + 1}</span>
            </div>
            <h3>{p.title}</h3>
            <p className="casebook-subtitle">{p.subtitle}</p>
            <p className="casebook-description">{p.description}</p>
            <div className="casebook-focus">
              <span>MY FOCUS</span>
              <p>{p.role || p.stack.slice(0, 3).join(" · ")}</p>
            </div>
            <Tags items={p.stack.slice(0, 5)} />
            <button className="button primary" onClick={() => onProject(p)}>
              Open the field note <span>↗</span>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
const contexts = [
  {
    line: "From information to understanding.",
    text: "Models matter. So do the data, retrieval, and evaluation decisions around them.",
    project: "orion",
    note: "Knowledge graphs · Graph RAG · GNNs",
  },
  {
    line: "An idea is only useful when people can use it.",
    text: "Interfaces, APIs, permissions, and tests form one product—not four disconnected demos.",
    project: "finance",
    note: "Django REST · Next.js · JWT RBAC",
  },
  {
    line: "Beyond the notebook. Into the real world.",
    text: "Reproducible delivery, observable services, and infrastructure designed with cost in mind.",
    project: "sentinel",
    note: "MLOps · LLMOps · FinOps",
  },
  {
    line: "Give the system a dependable foundation.",
    text: "Relational, document, and graph data models chosen for the questions the application needs to answer.",
    project: "matchwork",
    note: "PostgreSQL · Neo4j · data modeling",
  },
];
export function SkillsWorkbench({
  onProject,
}: {
  onProject: (p: Project) => void;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const reduced = useReducedMotion();
  const context = contexts[active];
  const project = projects.find((p) => p.id === context.project);
  return (
    <div className="skills-workbench">
      <div
        className="skill-domain-tabs"
        role="tablist"
        aria-label="Engineering domains"
      >
        {skills.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel`}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? 3
                    : (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
              setActive(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            <span>0{i + 1}</span>
            <strong>{s.title}</strong>
            <span aria-hidden="true">{i === active ? "−" : "+"}</span>
          </button>
        ))}
      </div>
      <div
        className="skill-domain-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        <motion.div
          key={active}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        >
          <span className="eyebrow">THE THINKING BEHIND THE TOOLS</span>
          <h3>{context.line}</h3>
          <p>{context.text}</p>
          <div className="skill-instruments">
            {skills[active].items.map((item, i) => (
              <motion.span
                key={item}
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : i * 0.025 }}
              >
                {item}
              </motion.span>
            ))}
          </div>
          {project && (
            <button className="skill-proof" onClick={() => onProject(project)}>
              <span>
                EXPLORE IN CONTEXT<strong>{project.title}</strong>
                <small>{context.note}</small>
              </span>
              <b aria-hidden="true">↗</b>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
