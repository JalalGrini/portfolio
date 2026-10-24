export type Project = {
  id: string;
  title: string;
  subtitle: string;
  category: "AI & Data" | "Research" | "Software";
  status: string;
  description: string;
  role?: string;
  stack: string[];
  repo?: string;
  featured?: boolean;
  highlights: string[];
};
export const profile = {
  name: "Jalal Grini",
  role: "AI & Software Engineer",
  location: "Meknes, Morocco",
  email: "jalal.grini@etu.uae.ac.ma",
  github: "https://github.com/JalalGrini",
  linkedin: "https://www.linkedin.com/in/jalal-grini-795b74316/",
  bio: "I connect machine learning, data engineering and thoughtful software architecture to turn complex ideas into useful systems. Currently studying AI & Digital Transformation at ENSA Al Hoceima, with a focus on how intelligent systems are built, deployed and maintained.",
};
const gh = (slug: string) => `https://github.com/JalalGrini/${slug}`;
export const projects: Project[] = [
  {
    id: "sentinel",
    title: "Sentinel",
    subtitle: "An operating layer for autonomous AI systems.",
    category: "Research",
    status: "Design stage · Oct 2026",
    featured: true,
    description:
      "A cloud-native platform bringing DevOps, MLOps and policy-governed autonomy into one lifecycle: detect, decide, act and verify. A six-month team research project, currently in design—not a deployed product.",
    role: "MLOps / LLMOps, GPU infrastructure & FinOps",
    stack: [
      "AWS",
      "Kubernetes",
      "Terraform",
      "MLflow",
      "PyTorch",
      "vLLM",
      "Argo CD",
    ],
    highlights: [
      "Planned lifecycle: code → secure → train → evaluate → deploy → monitor.",
      "Three autonomy levels with explicit policies, verification and rollback.",
      "Designed around reproducible training, GPU scheduling, observability and cost controls.",
      "Team: Yassir Hamri, Jalal Grini and Amine Essaouiqui. Supervisor: Abdelkhalek Bahri.",
    ],
  },
  {
    id: "orion",
    title: "ORION",
    subtitle: "Multimodal reasoning, grounded in knowledge.",
    category: "Research",
    status: "Design stage · Oct 2026",
    featured: true,
    description:
      "An explainable, multimodal AI research system for industrial reasoning and decision support. This four-month team project connects vision, knowledge graphs, agents and reinforcement learning. No experimental results are claimed yet.",
    role: "Knowledge graphs, GNNs, Graph RAG & retrieval",
    stack: [
      "Neo4j",
      "PyTorch Geometric",
      "Graph RAG",
      "Embeddings",
      "Reinforcement learning",
    ],
    highlights: [
      "Leading graph modeling, graph learning, retrieval and embedding work.",
      "Rotation work includes a vision encoder and a simple RL policy.",
      "Team: Yassir Hamri, Jalal Grini and Amal. Supervisor: Abdelkhalek Bahri.",
    ],
  },
  {
    id: "matchwork",
    title: "MatchWork",
    subtitle: "From job listings to a useful data product.",
    category: "AI & Data",
    status: "Repository project",
    featured: true,
    description:
      "An end-to-end job-data pipeline: ingestion, medallion processing, NLP skill extraction and recommendation. The project combines data engineering with an API and web experience.",
    stack: ["Airflow", "spaCy", "PostgreSQL", "FastAPI", "React", "Power BI"],
    repo: gh("matchwork-ingestion-de-donnees"),
    highlights: [
      "Bronze / Silver / Gold layers and a dimensional star schema with SCD2.",
      "Skill extraction and cosine-similarity job recommendations.",
      "Ingestion work covers Indeed, Anapec and LinkedIn sources.",
    ],
  },
  {
    id: "ocr",
    title: "Arabic & Darija OCR",
    subtitle: "A dataset-first approach to document intelligence.",
    category: "AI & Data",
    status: "Dataset pipeline",
    featured: true,
    description:
      "A synthetic text-image pipeline for Arabic and Darija OCR research, including a 10,000-image dataset, PyTorch loading and augmentation. The repository is evidence of data preparation—not a claim of production OCR accuracy.",
    stack: ["Python", "PyTorch", "Computer vision", "Data augmentation"],
    repo: gh("deep-learning-OCR-project"),
    highlights: [
      "Synthetic text-to-image dataset generation.",
      "PyTorch DataLoader and image augmentation pipeline.",
      "Arabic / Darija language focus.",
    ],
  },
  {
    id: "spam",
    title: "Phishing & Spam Detection",
    subtitle: "Security signals meet machine learning.",
    category: "AI & Data",
    status: "Repository project",
    description:
      "An email-security classification workflow using indicator-of-compromise feature engineering, dataset preparation and Random Forest / XGBoost models, with a technical report.",
    stack: ["Python", "scikit-learn", "XGBoost", "Feature engineering"],
    repo: gh("cyber_security_email_spam"),
    highlights: [
      "Engineered email and IoC features for supervised models.",
      "Dataset and experiment pipeline, accompanied by a LaTeX report.",
    ],
  },
  {
    id: "odoo",
    title: "ENSAH HR Intelligence",
    subtitle: "AI-assisted people operations in Odoo.",
    category: "AI & Data",
    status: "Repository project",
    description:
      "An Odoo 17 HR module combining employee workflows with an AI chat assistant, dashboards, evaluations and exploratory predictive features.",
    stack: ["Odoo 17", "Python", "PostgreSQL", "AI assistant"],
    repo: gh("ensah-rh-odoo"),
    highlights: [
      "HR workflows, employee evaluations and AI-assisted dashboards.",
      "Exploratory turnover-risk prediction and anomaly detection.",
    ],
  },
  {
    id: "rag",
    title: "RAG Document Assistant",
    subtitle: "Answers connected to their source material.",
    category: "AI & Data",
    status: "CV-listed project",
    description:
      "A document-question-answering assistant connecting retrieval with LLM responses through a React interface. Included from the CV; no public repository is supplied.",
    stack: ["Python", "LangChain", "LLMs", "React"],
    highlights: [
      "Document retrieval and contextual response generation.",
      "Application interface built with React.",
    ],
  },
  {
    id: "finance",
    title: "Financial Operations Platform",
    subtitle: "A shared operating system for a four-company holding.",
    category: "Software",
    status: "Undeployed · GitHub project",
    featured: true,
    description:
      "A centralized financial-operations platform built during the Groupe 3RB Extreme internship. Django REST and Next.js connect operational records, personnel, payroll, VAT and executive reporting. Presented as an undeployed repository project.",
    role: "Full-stack engineering intern",
    stack: ["Django REST", "Next.js", "TypeScript", "PostgreSQL", "Docker"],
    repo: gh("financial-operations-platform"),
    highlights: [
      "JWT role-based access, audit logging and strict TypeScript.",
      "PDF / Excel report generation and VAT calculations.",
      "217 backend tests in the reviewed repository checkpoint.",
      "AI-ready architecture for future RAG assistants and invoice OCR—not shipped AI claims.",
    ],
  },
  {
    id: "comptapilot",
    title: "ComptaPilot",
    subtitle: "Less administrative friction. Fewer missed deadlines.",
    category: "Software",
    status: "Internship project",
    description:
      "A Streamlit platform for accounting client records and recurring tax deadlines, with scheduled GitHub Actions notifications. Built during the July 2025 Comptapilot internship.",
    stack: ["Python", "Streamlit", "GitHub Actions", "Excel"],
    repo: gh("deadline_calendar"),
    highlights: [
      "Client deadline manager, calendar, notes and email customization.",
      "TVA / invoice calculations and deadline exports.",
    ],
  },
  {
    id: "pfe",
    title: "PFE Planning Platform",
    subtitle: "Structure for assignments and defense scheduling.",
    category: "Software",
    status: "Team project",
    description:
      "A Java web platform for final-year project assignment and defense planning, including Excel import and scheduling constraints.",
    stack: ["Java", "Spring MVC", "PostgreSQL", "React"],
    repo: gh("pfe-planning-jee-project"),
    highlights: [
      "Assignment and defense-planning workflows.",
      "Excel ingestion and constraint-aware planning.",
    ],
  },
  {
    id: "employees",
    title: "Employees Manager",
    subtitle: "A focused Laravel HR application.",
    category: "Software",
    status: "Repository project",
    description:
      "An employee-management application exploring practical HR workflows with Laravel.",
    stack: ["Laravel", "PHP", "MySQL"],
    repo: gh("Employees-Manager"),
    highlights: ["Employee records and management workflows."],
  },
  {
    id: "todo",
    title: "MERN Task Manager",
    subtitle: "A full-stack foundation for everyday tasks.",
    category: "Software",
    status: "Repository project",
    description:
      "A task-management application built across the MongoDB, Express, React and Node stack.",
    stack: ["MongoDB", "Express", "React", "Node.js"],
    repo: gh("TodoListApp_MERN_stack"),
    highlights: ["Full-stack task management and client/server integration."],
  },
  {
    id: "recipe",
    title: "RecipeGenix",
    subtitle: "A desktop recipe experience.",
    category: "Software",
    status: "Repository project",
    description:
      "A Python desktop application built with PySide, exploring recipe-oriented workflows and GUI development.",
    stack: ["Python", "PySide", "Desktop UI"],
    repo: gh("RecipeGenix_PySide_Project"),
    highlights: ["Desktop application architecture and interface work."],
  },
  {
    id: "salle",
    title: "Room Reservation Manager",
    subtitle: "Core systems thinking, in C.",
    category: "Software",
    status: "Repository project",
    description: "A console-based room reservation manager, built in C.",
    stack: ["C", "Data structures", "Console application"],
    repo: gh("Salle-Management-Project-C-"),
    highlights: ["Reservation logic and structured record management."],
  },
  {
    id: "tva",
    title: "TVA Calculator",
    subtitle: "A small tool for an everyday accounting job.",
    category: "Software",
    status: "Repository project",
    description:
      "A Streamlit VAT calculator with Excel export, focused on a straightforward accounting workflow.",
    stack: ["Python", "Streamlit", "Excel"],
    repo: gh("TVACALCULATOR"),
    highlights: ["TVA calculations and exportable Excel output."],
  },
  {
    id: "dl-report",
    title: "Deep Learning Research",
    subtitle: "Understanding the decisions behind a model.",
    category: "Research",
    status: "Research report · 2025–26",
    description:
      "An academic report on deep learning, hyperparameters, regularization and convolutional neural networks.",
    stack: ["Deep learning", "CNNs", "Regularization", "Research"],
    repo: gh("Recherche-DeepLearning"),
    highlights: ["TDIA2 research report, academic year 2025–26."],
  },
];
export const experience = [
  {
    title: "Full-Stack Software Engineer Intern",
    company: "Groupe 3RB Extreme",
    period: "Summer 2026",
    location: "Temara, Morocco",
    text: "Built a centralized financial-operations platform for a four-company holding. Worked across Django REST, Next.js, role-based access, audit logging, automated reporting and an AI-ready architecture.",
    project: "finance",
  },
  {
    title: "Software & Automation Engineer Intern",
    company: "Comptapilot",
    period: "July 2025",
    location: "Erfoud, Morocco",
    text: "Developed a Streamlit platform for accounting client records and recurring tax deadlines. Automated scheduled notifications with GitHub Actions and supported spreadsheet exports.",
    project: "comptapilot",
  },
];
export const skills = [
  {
    title: "AI & Data",
    items: [
      "PyTorch",
      "TensorFlow",
      "scikit-learn",
      "Pandas",
      "GNNs",
      "RAG",
      "LangChain",
      "Deep learning",
    ],
  },
  {
    title: "Backend & Web",
    items: [
      "Python",
      "Java",
      "Spring Boot",
      "Django",
      "FastAPI",
      "Next.js",
      "React",
      "TypeScript",
      "REST APIs",
    ],
  },
  {
    title: "Cloud & MLOps",
    items: [
      "AWS",
      "Docker",
      "MLflow",
      "Terraform",
      "GitHub Actions",
      "Nginx",
      "Linux",
      "LLMOps",
    ],
  },
  {
    title: "Databases",
    items: ["PostgreSQL", "Neo4j", "MySQL", "MongoDB", "Data modeling"],
  },
];
export type BuildingId =
  "about" | "academy" | "lab" | "office" | "workshop" | "library" | "contact";
export const buildings: {
  id: BuildingId;
  name: string;
  topic: string;
  number: string;
  intro: string;
}[] = [
  {
    id: "about",
    name: "The Green House",
    topic: "About me",
    number: "01",
    intro: "Every system has a person behind it. Here is a little about mine.",
  },
  {
    id: "academy",
    name: "ENSAH Academy",
    topic: "Education",
    number: "02",
    intro:
      "A foundation in mathematics and physics. A direction in intelligent systems.",
  },
  {
    id: "lab",
    name: "The AI Observatory",
    topic: "AI & research",
    number: "03",
    intro:
      "Data pipelines, learning systems and the questions worth exploring.",
  },
  {
    id: "office",
    name: "The Engineering Office",
    topic: "Experience",
    number: "04",
    intro:
      "Real constraints. Useful software. Lessons from building with teams.",
  },
  {
    id: "workshop",
    name: "The Makers Workshop",
    topic: "Software projects",
    number: "05",
    intro:
      "A collection of applications, experiments and engineering foundations.",
  },
  {
    id: "library",
    name: "The Knowledge Library",
    topic: "Skills",
    number: "06",
    intro: "The tools I reach for—and the connections between them.",
  },
  {
    id: "contact",
    name: "The Post Office",
    topic: "Contact & CV",
    number: "07",
    intro:
      "Have a project, a research question, or an opportunity? Let’s talk.",
  },
];
