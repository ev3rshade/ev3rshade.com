interface ProjectCardProps {
  title: string;
  technologies: string[];
  description: string;
  highlights: string[];
  githubUrl?: string;
  websiteUrl?: string;
  liveUrl?: string;
  timeline?: string;
}

export default function ProjectCard({
  title,
  technologies,
  description,
  highlights,
  githubUrl,
  websiteUrl,
  liveUrl,
  timeline
}: ProjectCardProps) {
  return (
    <div className="project-card">
      <div className="project-content">
        <div className="project-header">
          <h2>{title}</h2>
          {timeline && <span className="timeline">{timeline}</span>}
        </div>
        
        <div className="tech-stack">
          {technologies.map((tech, index) => (
            <span key={index} className="tech-tag">{tech}</span>
          ))}
        </div>
        
        <p className="project-description">{description}</p>
        
        <ul className="project-highlights">
          {highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
        
        {(githubUrl || liveUrl || websiteUrl) && (
          <div className="project-links">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                GitHub →
              </a>
            )}
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                Live Demo →
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                Website →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}