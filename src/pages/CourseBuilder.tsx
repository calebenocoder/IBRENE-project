import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';
import { ModuleManager } from '../components/admin/ModuleManager';
import { LessonEditor } from '../components/admin/LessonEditor';
import { TestEditor } from '../components/admin/TestEditor';

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  text_content?: string;
  video_url?: string;
  order_index: number;
}

export const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editMode, setEditMode] = useState<'lesson' | 'test' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    checkAdminAndFetchData();
  }, [courseId]);

  const checkAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.user_metadata?.is_admin) {
        navigate('/dashboard');
        return;
      }

      await fetchCourseData();
    } catch (error) {
      console.error('Error:', error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseData = async () => {
    if (!courseId) return;

    // Fetch course
    const { data: courseData } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    if (courseData) {
      setCourseTitle(courseData.title);
    }

    // Fetch modules
    await fetchModules();
  };

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (!error && data) {
      setModules(data);
    }
  };

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setSelectedLesson(null);
    setEditMode(null);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    // If no module is selected or the selected module is different from the lesson's module,
    // find and select the correct module.
    if (!selectedModule || selectedModule.id !== lesson.module_id) {
      const parentModule = modules.find(m => m.id === lesson.module_id);
      if (parentModule) {
        setSelectedModule(parentModule);
      }
    }

    setSelectedLesson(lesson);
    setEditMode(lesson.content_type === 'quiz' ? 'test' : 'lesson');
  };

  const handleNewLesson = () => {
    if (!selectedModule) return;
    setSelectedLesson(null);
    setEditMode('lesson');
  };

  const handleNewTest = () => {
    if (!selectedModule) return;
    setSelectedLesson(null);
    setEditMode('test');
  };

  const handleSaveComplete = () => {
    setSelectedLesson(null);
    setEditMode(null);
    fetchModules();
  };

  const handleModulesChange = (newModules?: any[]) => {
    if (newModules) {
      setModules(newModules);
    }
    fetchModules();
  };

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setTempTitle(courseTitle);
  };

  const handleSaveTitle = async () => {
    if (!tempTitle.trim() || !courseId) return;

    const { error } = await supabase
      .from('courses')
      .update({ title: tempTitle.trim() })
      .eq('id', courseId);

    if (!error) {
      setCourseTitle(tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setTempTitle('');
  };

  useEffect(() => {
    const handleAddLesson = () => {
      setEditMode('lesson');
    };

    const handleAddQuiz = () => {
      setEditMode('test');
    };

    window.addEventListener('addLesson', handleAddLesson);
    window.addEventListener('addQuiz', handleAddQuiz);

    return () => {
      window.removeEventListener('addLesson', handleAddLesson);
      window.removeEventListener('addQuiz', handleAddQuiz);
    };
  }, []);

  return (
    <>
      {loading ? (
        <div className="builder-loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Carregando editor de cursos...</p>
          </div>
        </div>
      ) : (
        <div className="course-builder">
          <header className="builder-header">
            <div className="header-content">
              <div className="header-left">
                <Link to="/admin" className="back-link">← Voltar ao Admin</Link>
                {isEditingTitle ? (
                  <div className="title-edit-wrapper">
                    <input
                      type="text"
                      className="title-input"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEditTitle();
                      }}
                      autoFocus
                    />
                    <div className="title-edit-actions">
                      <button className="btn-save-title" onClick={handleSaveTitle}>✓</button>
                      <button className="btn-cancel-title" onClick={handleCancelEditTitle}>×</button>
                    </div>
                  </div>
                ) : (
                  <h1 className="editable-title" onClick={handleStartEditTitle} title="Clique para editar">
                    {courseTitle}
                    <span className="edit-icon">✎</span>
                  </h1>
                )}
                <p className="subtitle">Editor de Conteúdo</p>
              </div>
              <img src={logo} alt="IBRENE Logo" className="header-logo" />
            </div>
          </header>

          <div className="builder-layout">
            <aside className="modules-sidebar">
              <ModuleManager
                courseId={courseId!}
                modules={modules}
                onModulesChange={handleModulesChange}
                onModuleSelect={handleModuleSelect}
                onLessonSelect={handleLessonSelect}
                selectedModuleId={selectedModule?.id}
                selectedLessonId={selectedLesson?.id}
              />
            </aside>

            <main className="content-editor">
              {!selectedModule && !editMode && (
                <div className="empty-state">
                  <h2>Organize seu curso</h2>
                  <p>Crie módulos e adicione aulas para começar</p>
                </div>
              )}

              {selectedModule && !editMode && (
                <div className="builder-module-header">
                  <h2>{selectedModule.title}</h2>
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={handleNewLesson}>
                      + Nova Aula
                    </button>
                    <button className="btn btn-secondary" onClick={handleNewTest}>
                      + Novo Questionário
                    </button>
                  </div>
                </div>
              )}

              {editMode === 'lesson' && selectedModule && (
                <LessonEditor
                  key={selectedLesson?.id || 'new-lesson'}
                  moduleId={selectedModule.id}
                  lesson={selectedLesson}
                  onSave={handleSaveComplete}
                  onCancel={() => setEditMode(null)}
                />
              )}

              {editMode === 'test' && selectedModule && (
                <TestEditor
                  key={selectedLesson?.id || 'new-test'}
                  courseId={courseId!}
                  moduleId={selectedModule.id}
                  lesson={selectedLesson}
                  onSave={handleSaveComplete}
                  onCancel={() => setEditMode(null)}
                />
              )}
            </main>
          </div>
        </div>
      )}

      <style>{`
        .course-builder {
          min-height: 100vh;
          background: #f8fafc;
          padding-top: 220px; /* Increased to account for larger header */
        }

        .builder-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 32px 24px 24px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-logo {
          height: 40px;
          object-fit: contain;
          margin-top: 10px;
        }

        .back-link {
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 12px;
          display: block;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #3b82f6;
        }

        .builder-header h1 {
          font-size: 2.25rem;
          color: #0f172a;
          margin-bottom: 8px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .editable-title {
          cursor: pointer;
          display: inline-block;
          padding: 4px 12px;
          margin-left: -12px;
          border-radius: 8px;
          transition: all 0.2s;
          position: relative;
        }

        .editable-title:hover {
          background: #f8fafc;
        }

        .edit-icon {
          opacity: 0;
          font-size: 1.2rem;
          color: #64748b;
          transition: opacity 0.2s;
          margin-left: 8px;
        }

        .editable-title:hover .edit-icon {
          opacity: 1;
        }

        .title-edit-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-input {
          font-size: 2.25rem;
          color: #0f172a;
          font-weight: 800;
          letter-spacing: -0.025em;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 8px 16px;
          background: white;
          outline: none;
          min-width: 400px;
        }

        .title-edit-actions {
          display: flex;
          gap: 8px;
        }

        .btn-save-title,
        .btn-cancel-title {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-save-title {
          background: #22c55e;
          color: white;
        }

        .btn-save-title:hover {
          background: #16a34a;
          transform: scale(1.1);
        }

        .btn-cancel-title {
          background: #ef4444;
          color: white;
        }

        .btn-cancel-title:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .subtitle {
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
        }

        .builder-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          max-width: 1400px;
          margin: 0 auto;
          gap: 32px;
          padding: 0 24px 40px;
          align-items: start;
        }

        .modules-sidebar {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 220px; /* Match course-builder padding-top */
          max-height: calc(100vh - 260px);
          overflow-y: auto;
        }

        .content-editor {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          min-height: 600px;
        }

        @media (max-width: 1024px) {
          .builder-layout {
            grid-template-columns: 1fr;
          }
          .modules-sidebar {
            position: relative;
            top: 0;
            max-height: none;
          }
        }

        .empty-state {
          text-align: center;
          padding: 100px 20px;
          color: #64748b;
        }

        .empty-state h2 {
          font-size: 1.75rem;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .builder-module-header {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: flex-start;
        }

        .builder-module-header h2 {
          font-size: 1.85rem;
          color: #0f172a;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .builder-module-header p {
          color: #64748b;
          margin-bottom: 40px;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
        }

        .btn {
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 1rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .builder-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .builder-loading p {
          color: #0f172a;
          font-size: 1.25rem;
          font-weight: 500;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
