import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Lesson {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  video_url?: string;
  text_content?: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

export const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // Fetch Course with Modules and Lessons
        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            modules (
              id,
              title,
              order_index,
              lessons (
                id,
                title,
                content_type,
                video_url,
                text_content,
                order_index
              )
            )
          `)
          .eq('id', courseId)
          .single();

        if (error) throw error;

        // Sort modules and lessons by order_index
        const sortedData = {
          ...data,
          modules: (data.modules as any[]).sort((a, b) => a.order_index - b.order_index).map(m => ({
            ...m,
            lessons: (m.lessons as any[]).sort((a, b) => a.order_index - b.order_index)
          }))
        };

        setCourse(sortedData);

        // Set Active Lesson
        if (lessonId) {
          const lesson = sortedData.modules
            .flatMap(m => m.lessons)
            .find(l => l.id === lessonId);
          setActiveLesson(lesson || null);
        } else if (sortedData.modules.length > 0 && sortedData.modules[0].lessons.length > 0) {
          // Default to first lesson
          const firstLesson = sortedData.modules[0].lessons[0];
          setActiveLesson(firstLesson);
          navigate(`/course/${courseId}/lesson/${firstLesson.id}`, { replace: true });
        }

      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, lessonId, navigate]);

  if (loading) return (
    <div className="classroom-loading">
      <div className="spinner"></div>
      <p>Preparando sua sala de aula...</p>
    </div>
  );

  if (!course) return <div className="p-10 text-center">Curso não encontrado.</div>;

  return (
    <div className="course-player-layout">
      {/* Sidebar */}
      <aside className="course-sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="btn-back">← Voltar ao Início</Link>
          <h2 className="course-title">{course.title}</h2>
        </div>

        <div className="modules-list">
          {course.modules.length === 0 && (
            <p className="empty-modules-message">Aguardando aulas serem cadastradas...</p>
          )}
          {course.modules.map((module) => (
            <div key={module.id} className="module-item">
              <h4 className="module-title">{module.title}</h4>
              <div className="lessons-list">
                {module.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/course/${course.id}/lesson/${lesson.id}`}
                    className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                  >
                    <span className="lesson-icon">
                      {lesson.content_type === 'video' ? '▶' : '📄'}
                    </span>
                    <span className="lesson-title">{lesson.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lesson-content">
        {activeLesson ? (
          <div className="lesson-view">
            <header className="lesson-header">
              <h1>{activeLesson.title}</h1>
            </header>

            <div className="media-container">
              {activeLesson.content_type === 'video' && activeLesson.video_url && (
                <div className="video-wrapper">
                  <ReactPlayer
                    url={activeLesson.video_url}
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                  />
                </div>
              )}
            </div>

            <div className="text-content">
              {activeLesson.text_content && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeLesson.text_content}
                </ReactMarkdown>
              )}
            </div>

            <footer className="lesson-footer">
              <button className="btn-complete">
                Concluir Aula
              </button>
            </footer>
          </div>
        ) : (
          <div className="empty-state">
            <p>Selecione uma aula para começar.</p>
          </div>
        )}
      </main>

      <style>{`
        .course-player-layout {
          display: flex;
          height: 100vh;
          background: #f8fafc;
          overflow: hidden;
          padding-top: 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        /* Sidebar Styling */
        .course-sidebar {
          width: 350px;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .btn-back {
          color: #64748b;
          text-decoration: none;
          font-size: 0.85rem;
          margin-bottom: 12px;
          display: block;
        }

        .btn-back:hover {
          color: #007bff;
        }

        .course-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1717;
          line-height: 1.4;
        }

        .modules-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }

        .empty-modules-message {
          padding: 24px;
          font-size: 0.9rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.6;
        }

        .module-item {
          margin-bottom: 8px;
        }

        .module-title {
          padding: 12px 24px;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          font-weight: 600;
        }

        .lessons-list {
          display: flex;
          flex-direction: column;
        }

        .lesson-item {
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #475569;
          font-size: 0.95rem;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .lesson-item:hover {
          background: #f8fafc;
          color: #007bff;
        }

        .lesson-item.active {
          background: #f1f7ff;
          color: #007bff;
          border-left-color: #007bff;
          font-weight: 500;
        }

        .lesson-icon {
          font-size: 0.8rem;
          opacity: 0.6;
        }

        /* Main Content Styling */
        .lesson-content {
          flex: 1;
          overflow-y: auto;
          background: #f8fafc;
        }

        .lesson-view {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        .lesson-header h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 32px;
        }

        .media-container {
          margin-bottom: 32px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          background: #000;
        }

        .video-wrapper {
          position: relative;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
        }

        .video-wrapper > div {
          position: absolute;
          top: 0;
          left: 0;
        }

        .text-content {
          color: #334155;
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .text-content h2, .text-content h3 {
          color: #0f172a;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .text-content p {
          margin-bottom: 1.5rem;
        }

        .lesson-footer {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .btn-complete {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-complete:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .classroom-loading {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: #f8fafc;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .course-player-layout {
            flex-direction: column;
          }
          .course-sidebar {
            width: 100%;
            height: auto;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};
