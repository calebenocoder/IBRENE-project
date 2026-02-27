import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="brand-name">IBRENE</h3>
            <p>Igreja Batista Regular Nova Esperança</p>
          </div>

          <div className="footer-links">
            <h4>Links Rápidos</h4>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#visit">Visite</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contato</h4>
            <div className="contact-info">
              <p>Av. Fernando Pinto de Queiroz, 384 – Sim</p>
              <p>Feira de Santana - BA, 44085-620</p>
              <p><i>Em frente ao Fabergé Residencial</i></p>
              <p style={{ marginTop: '10px' }}>contato@ibrene.com.br</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom text-center">
          <p>&copy; {new Date().getFullYear()} IBRENE. Todos os direitos reservados.</p>
          {/* CD Test: {new Date().toISOString()} */}
        </div>
      </div>

      <style>{`
        .footer {
          background-color: var(--color-primary);
          color: var(--color-white);
          padding: 4rem 0 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1.5fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .footer h4 {
          font-size: 1.1rem;
          margin-bottom: 1.25rem;
          color: var(--color-accent);
        }

        .footer ul { list-style: none; }
        .footer ul li { margin-bottom: 0.5rem; }
        .footer a:hover { color: var(--color-accent); }
        
        .footer p { color: #94a3b8; }

        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #64748b;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};
