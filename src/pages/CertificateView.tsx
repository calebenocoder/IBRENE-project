import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export const CertificateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        if (!id) return;

        // Fetch certificate with related user and course data
        // Note: We need to join with courses, but user data might need a separate fetch 
        // if we can't join auth.users easily.
        // Actually, we can get the user's metadata from the current session if it's their certificate,
        // or we rely on the fact that we stored user_id.
        // For simplicity, we'll fetch the certificate and then the course info.

        const { data: cert, error: certError } = await supabase
          .from('certificates')
          .select(`
            *,
            courses (
              title,
              instructor
            )
          `)
          .eq('id', id)
          .single();

        if (certError) throw certError;

        // Fetch user details (assuming viewing own certificate for now)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== cert.user_id) {
          // If viewing someone else's certificate, we might need a public profile table.
          // For now, assume it's the logged in user or we just show "Estudante" if mismatched
          // (In a real app, you'd have a public profiles table)
          if (!user) {
            setError('Você precisa estar logado para visualizar este certificado.');
            return;
          }
        }

        setCertificate({
          id: cert.id,
          user_full_name: user.user_metadata?.full_name || 'Estudante',
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
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Carregando certificado...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!certificate) return null;

  return (
    <div className="certificate-page">
      <div className="no-print header-actions">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          &larr; Voltar ao Painel
        </button>
        <button onClick={handlePrint} className="btn-print">
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <div className="certificate-container">
        <div className="certificate-content">
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
      </div>

      <style>{`
        .certificate-page {
          min-height: 100vh;
          background: #f0f2f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        }

        .header-actions {
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
        }

        .btn-back, .btn-print {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-back {
          background: white;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-print {
          background: #3b82f6;
          color: white;
        }

        .certificate-container {
          background: white;
          width: 297mm; /* A4 Landscape */
          height: 210mm;
          padding: 0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* This will be replaced by the user's image */
        .certificate-content {
          position: relative;
          z-index: 2;
          width: 80%;
          text-align: center;
          color: #1a365d;
        }

        .cert-logo {
          height: 80px;
          margin-bottom: 1rem;
        }

        .cert-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .cert-header h1 {
          font-family: 'Playfair Display', serif; /* Need to import this or fallback */
          font-size: 3rem;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .cert-text {
          font-size: 1.25rem;
          margin: 1rem 0;
          font-style: italic;
        }

        .student-name {
          font-family: 'Great Vibes', cursive; /* Fancy font */
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
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.25rem;
        }

        .error { color: red; }

        @media print {
          body {
            background: white;
            height: auto;
          }
          
          /* Hide non-certificate content */
          .no-print { 
            display: none !important; 
          }

          /* Position the certificate page */
          .certificate-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            visibility: visible !important;
          }

          .certificate-page * {
            visibility: visible !important;
          }

          .certificate-container {
             box-shadow: none !important;
             margin: 0 !important;
             width: 297mm !important;
             height: 210mm !important;
           }

          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Import Google Fonts for Certificate */}
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );
};
