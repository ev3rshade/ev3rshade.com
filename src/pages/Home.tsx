import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="tile hero-tile">
        <h1 className="pottaOne">w e b s i t e</h1>
        <p>Welcome | ようこそ</p>
      </div>

      <div className="nav-grid">
        <Link to="/about" className="tile nav-tile">
          <h2>hanako keney</h2>
          <p className="caption">(about me)</p>
        </Link>

        <Link to="/projects" className="tile nav-tile">
          <h2>Projects</h2>
          <p className="caption">cool things i've made</p>
        </Link>

        <Link to="/blog" className="tile nav-tile">
          <h2>blog</h2>
          <p className="caption">my place in the world</p>
        </Link>

        <div className="tile decorative-tile medium" style={{background: 'linear-gradient(135deg, var(--tile-rose), var(--tile-sage))'}}>
          <span style={{fontSize: '1.0rem'}}>Currently Working On a network security tool for my Arch Linux, and a setup of my Obsidian</span>
        </div>

        <div className="tile image-tile">
          <img src="/assets/hydrangea1.jpg" alt="Tessellated origami" />
        </div>

        <div className="tile decorative-tile small" style={{background: 'linear-gradient(135deg, var(--tile-yellow), var(--tile-lemon))'}}>
          <span style={{color: '#2c3e50'}}>✨</span>
        </div>

        <div className="tile decorative-tile medium" style={{background: 'linear-gradient(135deg, var(--tile-rose), var(--tile-salmon))'}}>
          <p style={{fontSize: '0.8rem', margin: 0}}>Computer Science @ Purdue</p>
        </div>

        <div className="tile decorative-tile small" style={{background: 'linear-gradient(135deg, var(--tile-mint), var(--tile-sage))'}}>
          <span style={{fontSize: '1.5rem'}}>💻</span>
        </div>

        <div className="tile decorative-tile medium" style={{background: 'linear-gradient(135deg, var(--tile-azure), var(--tile-sky-light))'}}>
          <p style={{fontSize: '0.8rem', margin: 0}}>carvomg my space on the internet</p>
        </div>
      </div>

      <p className="citation">
        "<a rel="noopener noreferrer" href="https://www.flickr.com/photos/115665376@N07/26365080812">
          Tessellated Clover Folding
        </a>" by{' '}
        <a rel="noopener noreferrer" href="https://www.flickr.com/photos/115665376@N07">
          modular.dodecahedron
        </a>{' '}
        is licensed under{' '}
        <a rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-sa/2.0/?ref=openverse">
          CC BY-SA 2.0
        </a>.
      </p>
    </div>
  );
}