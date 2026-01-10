import React from 'react';

export const ServiceTimes: React.FC = () => {
    return (
        <section id="visit" className="section-padding times-section">
            <div className="container">
                <div className="grid-2-col">
                    <div className="times-content">
                        <h2 className="section-title">Estamos ansiosos em te conhecer</h2>
                        <p className="section-text">
                            Não importa onde você esteja em sua jornada espiritual, você é bem-vindo aqui.
                            Temos atividades para todas as idades.
                        </p>

                        <div className="schedule-box">
                            <h3>Horários dos Cultos</h3>
                            <ul className="schedule-list">
                                <li>
                                    <span className="day">Domingo</span>
                                    <span className="time">09:00 - Escola Bíblica</span>
                                </li>
                                <li>
                                    <span className="day">Domingo</span>
                                    <span className="time">18:00 - Culto de Adoração</span>
                                </li>
                                <li>
                                    <span className="day">Quarta-feira</span>
                                    <span className="time">19:30 - Culto de Oração</span>
                                </li>
                            </ul>
                        </div>

                        <a href="https://maps.google.com" target="_blank" className="btn btn-primary mt-4">
                            Ver no Mapa
                        </a>
                    </div>

                    <div className="location-image">
                        {/* Placeholder for location map or image */}
                        <div className="map-placeholder">
                            <span>Localização</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .section-padding { padding: var(--spacing-xl) 0; }
        .times-section { background-color: var(--color-off-white); }
        
        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-lg);
          align-items: center;
        }

        .section-title {
          font-size: var(--font-size-h2);
          color: var(--color-primary);
          margin-bottom: var(--spacing-sm);
        }

        .section-text {
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-md);
          font-size: 1.125rem;
        }

        .schedule-box {
          background: var(--color-white);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .schedule-box h3 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: var(--color-secondary);
        }

        .schedule-list {
          list-style: none;
        }

        .schedule-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .schedule-list li:last-child { border-bottom: none; }

        .day { font-weight: 600; color: var(--color-primary); }
        .time { color: var(--color-text-muted); }

        .map-placeholder {
          background: #e2e8f0;
          height: 400px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .grid-2-col { grid-template-columns: 1fr; gap: var(--spacing-md); }
          .section-padding { padding: var(--spacing-lg) 0; }
        }
      `}</style>
        </section>
    );
};
