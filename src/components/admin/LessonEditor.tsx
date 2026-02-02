import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  text_content?: string;
  video_url?: string;
  order_index: number;
}

interface LessonEditorProps {
  moduleId: string;
  lesson: Lesson | null;
  onSave: () => void;
  onCancel: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  moduleId,
  lesson,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [textContent, setTextContent] = useState(lesson?.text_content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false  // Prevents adding extra line breaks and formatting on paste
    },
    keyboard: {
      bindings: {
        // Make Shift+Enter create line break, Enter creates new paragraph
        linebreak: {
          key: 13,
          shiftKey: true,
          handler: function (range: any) {
            // @ts-ignore
            this.quill.insertText(range.index, '\n');
            // @ts-ignore
            this.quill.setSelection(range.index + 1);
            return false;
          }
        }
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',  // Note: 'bullet' is a value of 'list', not a separate format
    'color', 'background',
    'link', 'image'
  ];

  // Sanitize HTML to remove excessive &nbsp; and clean up formatting
  const sanitizeHTML = (html: string): string => {
    return html
      // Replace multiple &nbsp; with single space
      .replace(/(&nbsp;)+/g, ' ')
      // Remove inline background-color and color from spans (keeps structure but removes styling)
      .replace(/style="[^"]*background-color:[^;"]*;?[^"]*"/gi, '')
      .replace(/style="[^"]*color:[^;"]*;?[^"]*"/gi, '')
      // Clean up empty style attributes
      .replace(/\s*style=""\s*/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    if (!textContent.trim() && !videoUrl.trim()) {
      setError('Adicione conteúdo de texto ou um vídeo');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Count existing lessons to set order_index
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', moduleId);

      const lessonData = {
        module_id: moduleId,
        title,
        content_type: 'text' as const,
        text_content: sanitizeHTML(textContent) || null,
        video_url: videoUrl || null,
        order_index: lesson?.order_index ?? (count || 0)
      };

      if (lesson) {
        // Update existing lesson
        const { error: updateError } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lesson.id);

        if (updateError) throw updateError;
      } else {
        // Create new lesson
        const { error: insertError } = await supabase
          .from('lessons')
          .insert([lessonData]);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar aula');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lesson-editor">
      <div className="editor-header">
        <h2>{lesson ? 'Editar Aula' : 'Nova Aula'}</h2>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="lesson-title">Título da Aula *</label>
          <input
            id="lesson-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Introdução à Teologia"
          />
        </div>

        <div className="form-group">
          <label htmlFor="video-url">URL do Vídeo (YouTube) - Opcional</label>
          <input
            id="video-url"
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoUrl && (
            <div className="video-preview">
              <p className="preview-label">Preview:</p>
              <div className="video-container">
                <iframe
                  src={videoUrl.replace('watch?v=', 'embed/')}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Conteúdo da Aula</label>
          <div className="quill-wrapper">
            <ReactQuill
              theme="snow"
              value={textContent}
              onChange={setTextContent}
              modules={modules}
              formats={formats}
              placeholder="Escreva o conteúdo da aula aqui..."
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="editor-actions">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Aula'}
          </button>
        </div>
      </div>

      <style>{`
        .lesson-editor {
          max-width: 900px;
        }

        .editor-header {
          margin-bottom: 32px;
        }

        .editor-header h2 {
          font-size: 1.75rem;
          color: #1a1a1a;
        }

        .editor-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #334155;
          font-size: 0.95rem;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .video-preview {
          margin-top: 12px;
        }

        .preview-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .video-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .quill-wrapper {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
        }

        .quill-wrapper :global(.ql-container) {
          min-height: 300px;
          font-size: 1rem;
        }

        .quill-wrapper :global(.ql-editor) {
          min-height: 300px;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-save {
          background: #007bff;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
