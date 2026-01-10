import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content container text-center">
        <h1 className="hero-title">Bem-vindo a IBRENE</h1>
        <p className="hero-subtitle">Um lugar de fé, esperança e amor.</p>
        <div className="hero-actions flex gap-sm" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <a href="#visit" className="btn btn-primary">Planeje sua Visita</a>
          <a href="#live" className="btn btn-outline">Assista Online</a>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          height: 100vh;
          width: 100%;
          /* background-image provided by html/body for overscroll fix */
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-white);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7));
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.5rem);
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </section>
  );
};
