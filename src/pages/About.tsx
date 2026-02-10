export default function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>Hanako Keney</h1>
        <p className="subtitle">Computer Science Student & Full-Stack Developer</p>
      </div>

      <div className="about-content">
        <section className="bio">
          <h2>About Me</h2>
          <p>
            CS @ Purdue!! I'm interested in linux systems and web development!
          </p>
          <p>
            Currently, I'm focused on systems programming and web development. Working on a network tool on my Arch Linux setup and a Grant Application form for Purdue Graduate Student Board. 
          </p>
          <p>
            I'm a part of Purdue Undergraduate Board of Computer Science, teaching a class to 500+ students. I am also a part of Purdue Japan Student Association as an Events Coordinator and ACM SigAPP!
          </p>
        </section>

        <section className="quick-facts">
          <h2>Quick Facts</h2>
          <ul>
            <li><strong>Location:</strong> Littleton, CO</li>
            <li><strong>Education:</strong> Purdue University, BS in Computer Science (Expected May 2028)</li>
            <li><strong>GPA:</strong> 3.6 / 4.0</li>
            <li><strong>Interests:</strong> Systems Programming, Web Development, Linux</li>
          </ul>
        </section>

        <section className="skills">
          <h2>Technical Skills</h2>
          <div className="skill-category">
            <h3>Languages</h3>
            <p>Python, Java, C/C++, Bash, JavaScript, TypeScript, SQL</p>
          </div>
          <div className="skill-category">
            <h3>Frameworks & Tools</h3>
            <p>React/React Native, Node.js, Flask, FastAPI, Django, Docker, PostgreSQL</p>
          </div>
          <div className="skill-category">
            <h3>Areas of Expertise</h3>
            <p>Full-Stack Development, Systems Programming, Network Security, Database Design</p>
          </div>
        </section>

        <section className="contact">
          <h2>Get in Touch</h2>
          <div className="contact-links">
            <a href="mailto:hskeney@gmail.com">Email</a>
            <a href="https://github.com/ev3rshade" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/hanako-keney/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </section>
      </div>
    </div>
  );
}