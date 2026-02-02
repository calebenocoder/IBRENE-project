import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

interface CertificateData {
  id: string;
  user_full_name: string;
  course_title: string;
  course_instructor: string;
  issued_at: string;
  certificate_code: string;
}

interface CertificateModalProps {
  certificateId: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificateId, onClose }) => {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        if (!certificateId) return;

        const { data: cert, error: certError } = await supabase
          .from('certificates')
          .select(`
            *,
            courses (
              title,
              instructor
            )
          `)
          .eq('id', certificateId)
          .single();

        if (certError) throw certError;

        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== cert.user_id) {
          if (!user) {
            setError('Você precisa estar logado para visualizar este certificado.');
            return;
          }
        }

        setCertificate({
          id: cert.id,
          user_full_name: user?.user_metadata?.full_name || 'Estudante',
          course_title: cert.courses?.title || 'Curso IBRENE',
          course_instructor: cert.courses?.instructor || 'IBRENE',
          issued_at: new Date(cert.issued_at).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          certificate_code: cert.certificate_code
        });

      } catch (err: any) {
        console.error('Error fetching certificate:', err);
        setError('Certificado não encontrado ou inválido.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  if (!certificateId) return null;

  return (
    <div className="certificate-modal-overlay" onClick={onClose}>
      <div className="certificate-modal-content" onClick={e => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose}>×</button>

        {loading ? (
          <div className="loading">Carregando certificado...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : certificate ? (
          <>
            <div className="no-print modal-actions">
              <button onClick={handlePrint} className="btn-print">
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>

            <div className="certificate-container">
              <div className="certificate-body">
                <div className="cert-header">
                  <img src={logo} alt="IBRENE" className="cert-logo" />
                  <h1>Certificado de Conclusão</h1>
                </div>

                <p className="cert-text">Certificamos que</p>

                <h2 className="student-name">{certificate.user_full_name}</h2>

                <p className="cert-text">concluiu com êxito o curso de</p>

                <h2 className="course-name">{certificate.course_title}</h2>

                <div className="cert-footer">
                  <div className="cert-signature">
                    <div className="line"></div>
                    <p>{certificate.course_instructor}</p>
                    <small>Instrutor</small>
                  </div>

                  <div className="cert-date">
                    <p>{certificate.issued_at}</p>
                    <small>Data de Emissão</small>
                  </div>
                </div>

              </div>
              <div className="cert-code">
                Código de verificação: {certificate.certificate_code}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style>{`
        .certificate-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 2rem;
          backdrop-filter: blur(4px);
        }

        .certificate-modal-content {
          position: relative;
          background: transparent;
          max-width: 100%;
          max-height: 100vh;
          overflow: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .btn-close-modal {
          position: absolute;
          top: -40px;
          right: -40px;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
        }

        .modal-actions {
          margin-bottom: 1rem;
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }

        .btn-print {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        /* Certificate Styles (Copied and Scoped) */
        .certificate-container {
          background: white;
          width: 297mm; /* A4 Landscape */
          height: 210mm;
          padding: 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center top;
        }
        
        /* Scale down for smaller screens */
        @media (max-width: 1200px) {
            .certificate-container {
                zoom: 0.8;
            }
        }
        @media (max-width: 900px) {
            .certificate-container {
                zoom: 0.6;
            }
        }
        @media (max-width: 600px) {
             .certificate-container {
                zoom: 0.4;
            }
        }

        .certificate-body {
          position: relative;
          z-index: 2;
          width: 80%;
          text-align: center;
          color: #1a365d;
        }

        .cert-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .cert-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .cert-logo {
          height: 80px;
          margin-bottom: 1rem;
        }

        .cert-text {
            font-size: 1.25rem;
            margin: 1rem 0;
            font-style: italic;
        }

        .student-name {
            font-family: 'Great Vibes', cursive;
            font-size: 4rem;
            margin: 1rem 0 2rem;
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            display: inline-block;
            padding: 0 2rem;
        }

        .course-name {
            font-size: 2.5rem;
            margin: 1rem 0 3rem;
            font-weight: 700;
        }

        .cert-footer {
            display: flex;
            justify-content: space-around;
            margin-top: 4rem;
        }

        .cert-signature, .cert-date {
            text-align: center;
        }

        .cert-signature .line {
          width: 200px;
          height: 1px;
          background: #1a365d;
          margin: 0 auto 0.5rem;
        }

        .cert-code {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%) rotate(-90deg);
          transform-origin: center right;
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
          white-space: nowrap;
        }

        .loading, .error {
          color: white;
          font-size: 1.5rem;
          padding: 2rem;
          background: rgba(0,0,0,0.5);
          border-radius: 8px;
        }

        @media print {
          /* 1. Collapse the dashboard structure completely */
          body {
            background: white;
            height: auto;
          }

          /* Hide dashboard elements explicitly so they take 0 height */
          .dashboard-top-header,
          .dashboard-container,
          .dashboard-page > *:not(.certificate-modal-overlay),
          .no-print, 
          .btn-close-modal {
            display: none !important;
          }

          /* Reset the dashboard page wrapper */
          .dashboard-page {
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 2. Position the certificate simply */
          .certificate-modal-overlay {
            position: absolute !important; /* absolute allows it to set the page size naturally */
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            visibility: visible !important;
          }

          .certificate-modal-overlay * {
            visibility: visible !important;
          }

          .certificate-modal-content {
            box-shadow: none !important;
            background: transparent !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }

          .certificate-container {
             transform: none !important;
             zoom: 1 !important;
             box-shadow: none !important;
             margin: 0 !important;
             /* Force A4 Landscape size */
             width: 297mm !important;
             height: 210mm !important;
           }

          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );
};
