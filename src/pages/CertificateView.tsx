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

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Você precisa estar logado para visualizar este certificado.');
          return;
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
    <div className="cert-page">
      {/* Buttons — hidden when printing */}
      <div className="cert-actions no-print">
        <button onClick={() => navigate('/dashboard')} className="btn-back-cert">
          ← Voltar ao Painel
        </button>
        <button onClick={handlePrint} className="btn-print-cert">
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* The actual certificate — exactly A4 landscape */}
      <div className="cert-box" id="cert-box">
        <div className="cert-inner">
          <div className="cert-header-block">
            <img src={logo} alt="IBRENE" className="cert-logo" />
            <h1 className="cert-title">Certificado de Conclusão</h1>
          </div>

          <p className="cert-label">Certificamos que</p>
          <h2 className="cert-name">{certificate.user_full_name}</h2>
          <p className="cert-label">concluiu com êxito o curso de</p>
          <h3 className="cert-course">{certificate.course_title}</h3>

          <div className="cert-footer-row">
            <div className="cert-sig">
              <div className="cert-sig-line" />
              <p>{certificate.course_instructor}</p>
              <small>Instrutor</small>
            </div>
            <div className="cert-date-block">
              <p>{certificate.issued_at}</p>
              <small>Data de Emissão</small>
            </div>
          </div>
        </div>

        <div className="cert-code-vertical">
          Código de verificação: {certificate.certificate_code}
        </div>
      </div>

      {/* Import Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />

      <style>{`
        /* ─── Screen styles ──────────────────────────────────────── */
        .cert-page {
          background: #f0f2f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          /* no min-height: 100vh — so print isn't forced taller */
        }

        .cert-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-back-cert, .btn-print-cert {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-back-cert {
          background: white;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-print-cert {
          background: #3b82f6;
          color: white;
        }

        /* A4 landscape certificate box */
        .cert-box {
          background: white;
          width: 297mm;
          height: 210mm;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          box-sizing: border-box;
        }

        .cert-inner {
          width: 82%;
          text-align: center;
          color: #1a365d;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cert-header-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cert-logo {
          height: 60px;
          margin-bottom: 0.6rem;
        }

        .cert-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        }

        .cert-label {
          font-size: 1rem;
          font-style: italic;
          margin: 0.4rem 0;
          color: #334155;
        }

        .cert-name {
          font-family: 'Great Vibes', cursive;
          font-size: 3rem;
          color: #2563eb;
          border-bottom: 1.5px solid #e2e8f0;
          padding: 0 2rem;
          margin: 0.4rem 0 0.8rem;
        }

        .cert-course {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a365d;
          margin: 0.4rem 0 1.2rem;
        }

        .cert-footer-row {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 0.5rem;
        }

        .cert-sig, .cert-date-block {
          text-align: center;
          font-size: 0.9rem;
          color: #334155;
        }

        .cert-sig-line {
          width: 160px;
          height: 1px;
          background: #1a365d;
          margin: 0 auto 0.4rem;
        }

        .cert-sig small, .cert-date-block small {
          font-size: 0.75rem;
          color: #64748b;
          display: block;
          margin-top: 2px;
        }

        .cert-code-vertical {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%) rotate(90deg);
          transform-origin: center;
          font-size: 0.6rem;
          color: #94a3b8;
          font-family: monospace;
          white-space: nowrap;
        }

        /* Mobile scaling */
        @media (max-width: 900px) {
          .cert-page { padding: 1rem; }
          .cert-actions { flex-direction: column; align-items: stretch; }
          .cert-box {
            width: 100%;
            height: auto;
            aspect-ratio: 297 / 210;
          }
          .cert-title { font-size: 1.2rem; }
          .cert-name { font-size: 1.8rem; }
          .cert-course { font-size: 1rem; }
          .cert-label { font-size: 0.75rem; }
          .cert-logo { height: 35px; }
          .cert-footer-row { font-size: 0.7rem; }
          .cert-sig-line { width: 100px; }
        }

        /* ─── Print styles ───────────────────────────────────────── */
        @media print {
          @page {
            size: 297mm 210mm;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: 210mm !important;
          }

          /* Hide everything outside the cert-box */
          .no-print { display: none !important; }

          /* Strip the page wrapper — let cert-box stand alone and centered */
          .cert-page {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 297mm !important;
            height: 210mm !important;
            min-height: unset !important;
          }

          /* Slightly smaller than A4 (approx 96%) to handle browser margins/defaults */
          .cert-box {
            box-shadow: none !important;
            margin: auto !important;
            width: 285mm !important;
            height: 201mm !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            border: none !important;
          }
        }

        .loading, .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.25rem;
        }
        .error { color: red; }
      `}</style>
    </div>
  );
};
