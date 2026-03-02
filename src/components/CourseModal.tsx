import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  course?: {
    id: string;
    title: string;
    instructor: string;
    description?: string;
    gradient_css: string;
    published: boolean;
  } | null;
}

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, onSave, course }) => {
  const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)'
  ];

  const [formData, setFormData] = useState({
    title: course?.title || '',
    instructor: course?.instructor || '',
    description: course?.description || '',
    gradient_css: course?.gradient_css || GRADIENTS[0],
    published: course?.published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update form data when course prop changes (for editing)
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        instructor: course.instructor,
        description: course.description || '',
        gradient_css: course.gradient_css,
        published: course.published,
      });
    } else {
      // Reset form for new course
      setFormData({
        title: '',
        instructor: '',
        description: '',
        gradient_css: GRADIENTS[0],
        published: false,
      });
    }
  }, [course, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (course) {
        // Update existing course
        const { error: updateError } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', course.id);

        if (updateError) throw updateError;
      } else {
        // Create new course
        const { error: insertError } = await supabase
          .from('courses')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar curso');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{course ? 'Editar Curso' : 'Novo Curso'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título do Curso *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Teologia Sistemática I"
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructor">Instrutor *</label>
            <input
              id="instructor"
              type="text"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              required
              placeholder="Ex: Pastor João Silva"
            />
          </div>

          <div className="form-group">
            <label>Cores de Fundo</label>
            <div className="gradient-selector">
              <div className="gradient-grid">
                {GRADIENTS.map((grad, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`gradient-option ${formData.gradient_css === grad ? 'active' : ''}`}
                    style={{ background: grad }}
                    onClick={() => setFormData({ ...formData, gradient_css: grad })}
                    title={`Opção ${index + 1}`}
                  />
                ))}
              </div>
              <div
                className="gradient-current-preview"
                style={{ background: formData.gradient_css }}
              >
                <span>Sua Escolha</span>
              </div>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <span>Publicado (visível para alunos)</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            {course && (
              <button
                type="button"
                className="btn btn-manage-content"
                onClick={() => {
                  onClose();
                  window.location.href = `/admin/course/${course.id}/builder`;
                }}
              >
                Gerenciar Conteúdo (Módulos/Aulas)
              </button>
            )}
            <div className="footer-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: #f1f5f9;
          color: #1a1a1a;
        }

        .modal-content form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input[type="text"]:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .gradient-selector {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .gradient-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        @media (max-width: 480px) {
          .gradient-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
        }

        .gradient-option {
          aspect-ratio: 1;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }

        .gradient-option:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .gradient-option.active {
          border-color: #007bff;
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2);
        }

        .gradient-current-preview {
          height: 60px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
        }

        .gradient-current-preview span {
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-group span {
          font-weight: 500;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        @media (max-width: 640px) {
          .modal-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
        }

        .footer-right {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .footer-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.95rem;
          white-space: nowrap;
          text-align: center;
        }

        @media (max-width: 640px) {
          .btn {
            padding: 12px 16px;
            font-size: 0.9rem;
            white-space: normal;
          }
        }

        .btn-manage-content {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0 !important;
        }

        .btn-manage-content:hover {
          background: #dcfce7;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
