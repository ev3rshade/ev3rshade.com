import ProjectCard from '../components/ProjectCard';

export default function Projects() {
  const projects = [
    // {
    //   title: "netaudit - Network Security Auditor",
    //   timeline: "Dec 2025 - Present",
    //   technologies: ["C++17", "Linux", "SQLite", "Systems Programming"],
    //   description: "Real-time network intelligence tool that detects unauthorized connections and data exfiltration",
    //   highlights: [
    //     "Engineered real-time monitoring by parsing /proc filesystem and mapping sockets to processes",
    //     "Designed ML baseline engine analyzing 10,000+ connection records to flag anomalies",
    //     "Architected lock-free caching with sub-10ms latency and 0.8% CPU overhead",
    //     "Delivered production-ready CLI with real-time alerting and systemd integration"
    //   ],
    // },
    {
      title: "Currents of Culture - eBook Reader",
      timeline: "May 2025 - Present",
      technologies: ["React", "Express", "Node.js", "PostgreSQL", "Stripe"],
      description: "Full-stack web platform with custom pagination engine for interactive reading",
      highlights: [
        "Built custom JavaScript pagination engine modeled after Kindle",
        "Integrated Stripe payments and JWT-based authentication",
        "Designed polished UI/UX supporting reading, highlighting, and annotations",
        "Deployed secure, scalable platform for independent author monetization"
      ],
      
    },
    {
      title: "PGSG Grant Application Platform",
      timeline: "Nov 2025 - Present",
      technologies: ["React", "PostgreSQL", "FastAPI", "Docker"],
      description: "Digitized grant application workflow for Purdue Graduate Student Government",
      highlights: [
        "Designed comprehensive PostgreSQL schema for grant application data",
        "Developed FastAPI backend with automated database initialization",
        "Containerized infrastructure using Docker for consistent deployment",
        "Replaced manual paper process with end-to-end electronic solution"
      ],
      githubUrl: "https://github.com/Purdue-ACM-SIGAPP/pgsg-grant-app-2526/tree/main/"
    },
    {
      title: "Purdue Technical Projects Website Build",
      timeline: "April 2025 - Present",
      technologies: ["React", "TypeScript", "CSS"],
      description: "Rebuilt organization website with dynamic content management",
      highlights: [
        "Rebuilt website using React with dynamic blog project content",
        "Implemented content management system for easy updates"
      ],
      websiteUrl: "https://purdue-technical-projects.vercel.app/"
      
    }
  ];

  return (
    <div className="projects-page">
      <h1>Projects</h1>
      <p className="projects-intro">
        A collection of projects on web development and everything in between.
      </p>
      
      <div className="projects-grid">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
}