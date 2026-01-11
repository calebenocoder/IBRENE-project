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
  const [formData, setFormData] = useState({
    title: course?.title || '',
    instructor: course?.instructor || '',
    description: course?.description || '',
    gradient_css: course?.gradient_css || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        gradient_css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do curso..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gradient">Gradiente CSS</label>
            <input
              id="gradient"
              type="text"
              value={formData.gradient_css}
              onChange={(e) => setFormData({ ...formData, gradient_css: e.target.value })}
              placeholder="linear-gradient(...)"
            />
            <div
              className="gradient-preview"
              style={{ background: formData.gradient_css }}
            />
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

        .gradient-preview {
          height: 60px;
          border-radius: 8px;
          margin-top: 8px;
          border: 1px solid #e2e8f0;
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
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .footer-right {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.95rem;
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
