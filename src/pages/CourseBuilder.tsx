import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ModuleManager } from '../components/admin/ModuleManager';
import { LessonEditor } from '../components/admin/LessonEditor';
import { TestEditor } from '../components/admin/TestEditor';

interface Module {
  id: string;
  title: string;
  description?: string;
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

  if (loading) {
    return (
      <div className="builder-loading">
        <p>Carregando editor de curso...</p>
      </div>
    );
  }

  return (
    <div className="course-builder">
      <header className="builder-header">
        <div className="header-content">
          <Link to="/admin" className="back-link">← Voltar ao Admin</Link>
          <h1>{courseTitle}</h1>
          <p className="subtitle">Editor de Conteúdo</p>
        </div>
      </header>

      <div className="builder-layout">
        <aside className="modules-sidebar">
          <ModuleManager
            courseId={courseId!}
            modules={modules}
            onModulesChange={fetchModules}
            onModuleSelect={handleModuleSelect}
            onLessonSelect={handleLessonSelect}
            selectedModuleId={selectedModule?.id}
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
            <div className="module-actions">
              <h2>{selectedModule.title}</h2>
              <p>{selectedModule.description || 'Sem descrição'}</p>
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
              moduleId={selectedModule.id}
              lesson={selectedLesson}
              onSave={handleSaveComplete}
              onCancel={() => setEditMode(null)}
            />
          )}

          {editMode === 'test' && selectedModule && (
            <TestEditor
              moduleId={selectedModule.id}
              lesson={selectedLesson}
              onSave={handleSaveComplete}
              onCancel={() => setEditMode(null)}
            />
          )}
        </main>
      </div>

      <style>{`
        .course-builder {
          min-height: 100vh;
          background: #f5f5f7;
          padding-top: 160px; /* Increased to avoid header overlap */
        }

        .builder-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 32px 24px 24px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000; /* Increased z-index */
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .back-link {
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #007bff;
        }

        .builder-header h1 {
          font-size: 2.25rem;
          color: #1a1a1a;
          margin-bottom: 8px;
          font-weight: 800;
          letter-spacing: -0.025em;
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
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          height: fit-content;
          position: sticky;
          top: 160px; /* Match course-builder padding-top */
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .content-editor {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
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
          color: #1a1a1a;
          margin-bottom: 12px;
        }

        .module-actions {
          padding: 10px;
        }

        .module-actions h2 {
          font-size: 1.85rem;
          color: #1a1a1a;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .module-actions p {
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
          background: #007bff;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
        }

        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 123, 255, 0.3);
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
          color: #64748b;
          background: #f5f5f7;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};
