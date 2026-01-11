import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'www.youtube.com/embed/');
  }
  return url;
};

interface Alternative {
  id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  title: string;
  order_index: number;
  alternatives: Alternative[];
}

interface Test {
  id: string;
  title: string;
  passing_percentage: number;
  questions: Question[];
}

interface Lesson {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  video_url?: string;
  text_content?: string;
  order_index: number;
  tests?: Test[];
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentQuestionAnswered, setCurrentQuestionAnswered] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { completed: boolean; quiz_score?: number }>>({});

  // 1. Fetch Course Data (Only if ID changes or not loaded)
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      if (course && course.id === courseId) return; // Don't refetch if already loaded

      try {
        setLoading(true);

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
                order_index,
                tests (
                  id,
                  title,
                  passing_percentage,
                  questions (
                    id,
                    title,
                    order_index,
                    alternatives (
                      id,
                      text,
                      is_correct,
                      order_index
                    )
                  )
                )
              )
            )
          `)
          .eq('id', courseId)
          .single();

        if (error) throw error;

        const sortedData = {
          ...data,
          modules: (data.modules as any[]).sort((a, b) => a.order_index - b.order_index).map(m => ({
            ...m,
            lessons: (m.lessons as any[]).sort((a, b) => a.order_index - b.order_index)
          }))
        };

        setCourse(sortedData);
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // 2. Handle Active Lesson Selection (Depends on course data and URL param)
  useEffect(() => {
    if (!course) return;

    if (lessonId) {
      const lesson = course.modules
        .flatMap(m => m.lessons)
        .find(l => l.id === lessonId);

      if (lesson) {
        setActiveLesson(lesson);
      }
    } else if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      // Navigate to first lesson if none selected
      const firstLesson = course.modules[0].lessons[0];
      navigate(`/course/${course.id}/lesson/${firstLesson.id}`, { replace: true });
    }
  }, [course, lessonId, navigate]);

  // 3. Fetch Lesson Progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!courseId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_progress')
          .select('lesson_id, completed, quiz_score')
          .eq('user_id', user.id);

        if (error) throw error;

        const progressMap: Record<string, { completed: boolean; quiz_score?: number }> = {};
        data?.forEach(item => {
          progressMap[item.lesson_id] = {
            completed: item.completed,
            quiz_score: item.quiz_score
          };
        });

        setLessonProgress(progressMap);
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    };

    fetchProgress();
  }, [courseId]);


  const handleAnswerSelect = (questionId: string, alternativeId: string) => {
    if (currentQuestionAnswered) return; // Already confirmed answer
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: alternativeId
    }));
  };

  const handleConfirmAnswer = () => {
    setCurrentQuestionAnswered(true);
  };

  const handleNextQuestion = () => {
    const totalQuestions = activeTest?.questions.length || 0;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestionAnswered(false);
    }
  };

  const handleCompleteQuiz = () => {
    setIsQuizCompleted(true);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionAnswered(false);
    setIsQuizCompleted(false);
    setCurrentQuestionIndex(0);
  };

  const getAlternativeLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

  const calculateScore = () => {
    if (!activeTest) return { percentage: 0, passed: false, correct: 0, total: 0 };

    const sortedQuestions = activeTest.questions.sort((a, b) => a.order_index - b.order_index);
    let correctCount = 0;

    sortedQuestions.forEach(question => {
      const selectedAltId = selectedAnswers[question.id];
      if (selectedAltId) {
        const selectedAlt = question.alternatives.find(alt => alt.id === selectedAltId);
        if (selectedAlt?.is_correct) {
          correctCount++;
        }
      }
    });

    const total = sortedQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= (activeTest.passing_percentage || 70);

    return { percentage, passed, correct: correctCount, total };
  };

  const markLessonComplete = async (quizScore?: number) => {
    if (!activeLesson) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: activeLesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
          quiz_score: quizScore,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error marking lesson complete:', error);
        alert('Erro ao marcar aula como concluída. Verifique se a migração do banco de dados foi aplicada.');
        return;
      }

      // Update local state
      setLessonProgress(prev => ({
        ...prev,
        [activeLesson.id]: { completed: true, quiz_score: quizScore }
      }));

      // Navigate to next lesson or dashboard
      navigateToNextLesson();
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      alert('Erro ao marcar aula como concluída.');
    }
  };

  const navigateToNextLesson = () => {
    if (!course || !activeLesson) return;

    // Find all lessons in order
    const allLessons = course.modules
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(m => m.lessons.sort((a, b) => a.order_index - b.order_index));

    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);

    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      // Go to next lesson
      const nextLesson = allLessons[currentIndex + 1];
      navigate(`/course/${course.id}/lesson/${nextLesson.id}`);
    } else {
      // Last lesson, go back to dashboard
      navigate('/dashboard');
    }
  };

  const calculateModuleProgress = (module: Module): number => {
    if (module.lessons.length === 0) return 0;

    const completedCount = module.lessons.filter(
      lesson => lessonProgress[lesson.id]?.completed
    ).length;

    return Math.round((completedCount / module.lessons.length) * 100);
  };

  if (loading) return (
    <div className="classroom-loading">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Preparando sua sala de aula...</p>
      </div>
      <style>{`
        .classroom-loading {
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

        .classroom-loading p {
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
    </div>
  );

  if (!course) return <div className="p-10 text-center">Curso não encontrado.</div>;

  const activeTest = activeLesson?.tests?.[0];

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
          {course.modules.map((module) => {
            const progress = calculateModuleProgress(module);
            return (
              <div key={module.id} className="module-item">
                <div className="module-header">
                  <h4 className="module-title">{module.title}</h4>
                  <span className="module-progress">{progress}%</span>
                </div>
                <div className="lessons-list">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to={`/course/${course.id}/lesson/${lesson.id}`}
                      className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''} ${lessonProgress[lesson.id]?.completed ? 'completed' : ''}`}
                      onClick={() => {
                        setSelectedAnswers({});
                        setCurrentQuestionAnswered(false);
                        setIsQuizCompleted(false);
                        setCurrentQuestionIndex(0);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="lesson-checkbox"
                        checked={lessonProgress[lesson.id]?.completed || false}
                        readOnly
                        onClick={(e) => e.preventDefault()}
                      />
                      <span className="lesson-icon">
                        {lesson.content_type === 'video' ? '🎥' : lesson.content_type === 'quiz' ? '✏️' : '📖'}
                      </span>
                      <span className="lesson-title">{lesson.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lesson-content">
        {activeLesson ? (
          <div className="lesson-view">
            <header className="lesson-header">
              <h1>{activeLesson.title}</h1>
            </header>

            {/* Video Player */}
            <div className="media-container">
              {activeLesson.video_url && (
                <div className="video-wrapper">
                  <iframe
                    src={getEmbedUrl(activeLesson.video_url)}
                    title={activeLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Rich Text Content */}
            <div className="text-content">
              {activeLesson.text_content && (
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: activeLesson.text_content }}
                />
              )}
            </div>

            {/* Completion Button for Regular Lessons */}
            {!activeTest && activeLesson.content_type !== 'quiz' && !lessonProgress[activeLesson.id]?.completed && (
              <footer className="lesson-footer">
                <button className="btn-complete-lesson" onClick={() => markLessonComplete()}>
                  Concluir Aula
                </button>
              </footer>
            )}

            {/* Quiz Content */}
            {activeTest && !isQuizCompleted && (
              <div className="quiz-layout">
                <div className="quiz-main">
                  {(() => {
                    const sortedQuestions = activeTest.questions.sort((a, b) => a.order_index - b.order_index);
                    const currentQuestion = sortedQuestions[currentQuestionIndex];
                    const totalQuestions = sortedQuestions.length;
                    const selectedAltId = selectedAnswers[currentQuestion?.id];

                    if (!currentQuestion) return null;

                    return (
                      <>
                        <div className="quiz-header">
                          <h2 className="quiz-question-number">
                            Questão {currentQuestionIndex + 1} de {totalQuestions}
                          </h2>
                          <p className="quiz-question-title">{currentQuestion.title}</p>
                        </div>

                        <div className="quiz-alternatives">
                          {currentQuestion.alternatives.sort((a, b) => a.order_index - b.order_index).map((alt, altIndex) => {
                            const isSelected = selectedAltId === alt.id;
                            const isCorrect = alt.is_correct;
                            let className = "quiz-alternative-card";

                            if (currentQuestionAnswered && isSelected) {
                              // Show feedback only on selected answer
                              className += isCorrect ? " correct" : " incorrect";
                            } else if (isSelected && !currentQuestionAnswered) {
                              className += " selected";
                            }

                            return (
                              <div
                                key={alt.id}
                                className={className}
                                onClick={() => handleAnswerSelect(currentQuestion.id, alt.id)}
                              >
                                <div className="alternative-letter">{getAlternativeLetter(altIndex)}</div>
                                <div className="alternative-text">{alt.text}</div>
                                {isSelected && currentQuestionAnswered && (
                                  <div className={`alternative-check ${isCorrect ? 'correct-mark' : 'incorrect-mark'}`}>
                                    {isCorrect ? '✓' : '✗'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="quiz-navigation">
                          {!currentQuestionAnswered && selectedAltId && (
                            <button
                              className="btn-confirm-answer"
                              onClick={handleConfirmAnswer}
                            >
                              Confirmar
                            </button>
                          )}

                          {currentQuestionAnswered && (
                            <>
                              {currentQuestionIndex < totalQuestions - 1 ? (
                                <button
                                  className="btn-next-question"
                                  onClick={handleNextQuestion}
                                >
                                  Próxima →
                                </button>
                              ) : (
                                <button
                                  className="btn-complete-quiz"
                                  onClick={handleCompleteQuiz}
                                >
                                  Concluir
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Progress Indicators */}
                <div className="quiz-progress">
                  <h3 className="progress-title">Progresso</h3>
                  <div className="progress-list">
                    {activeTest.questions.sort((a, b) => a.order_index - b.order_index).map((question, index) => {
                      const isAnswered = !!selectedAnswers[question.id];
                      const isCurrent = index === currentQuestionIndex;

                      return (
                        <div
                          key={question.id}
                          className={`progress-item ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                        >
                          <span className="progress-number">{index + 1}</span>
                          {isAnswered && <span className="progress-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Results */}
            {activeTest && isQuizCompleted && (
              <div className="quiz-results">
                {(() => {
                  const score = calculateScore();
                  return (
                    <>
                      <div className="results-header">
                        <h2>Questionário Concluído!</h2>
                      </div>

                      <div className="results-score">
                        <div className="score-circle">
                          <span className="score-percentage">{score.percentage}%</span>
                        </div>
                        <p className="score-text">
                          Você acertou {score.correct} de {score.total} questões
                        </p>
                      </div>

                      <div className={`results-status ${score.passed ? 'passed' : 'failed'}`}>
                        {score.passed ? (
                          <>
                            <div className="status-icon">✓</div>
                            <h3>Aprovado!</h3>
                            <p>Parabéns! Você atingiu a nota mínima de {activeTest.passing_percentage}%</p>
                          </>
                        ) : (
                          <>
                            <div className="status-icon">✗</div>
                            <h3>Não Aprovado</h3>
                            <p>Você precisa de pelo menos {activeTest.passing_percentage}% para ser aprovado</p>
                          </>
                        )}
                      </div>

                      <div className="results-actions">
                        {score.passed ? (
                          <button className="btn-complete-quiz" onClick={() => markLessonComplete(score.percentage)}>
                            Concluir
                          </button>
                        ) : (
                          <button className="btn-retry-quiz" onClick={resetQuiz}>
                            Tentar Novamente
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
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
          margin-bottom: 24px;
        }

        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 12px;
          margin-bottom: 12px;
        }

        .module-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .module-progress {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }

        .lessons-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          text-decoration: none;
          color: #475569;
          transition: all 0.2s;
          cursor: pointer;
        }

        .lesson-item:hover {
          background: #f1f5f9;
        }

        .lesson-item.active {
          background: #eff6ff;
          color: #3b82f6;
        }

        .lesson-item.completed .lesson-title {
          color: #94a3b8;
        }

        .lesson-checkbox {
          width: 18px;
          height: 18px;
          cursor: default;
          pointer-events: none;
          accent-color: #3b82f6;
        }

        .lesson-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .lesson-title {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
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

        .video-wrapper > div,
        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .text-content {
          color: #334155;
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .rich-text-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }

        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }

        .rich-text-content p {
          margin-bottom: 1.5rem;
        }

        .text-content h2, .text-content h3 {
          color: #0f172a;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .lesson-footer {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .btn-complete-lesson {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-complete-lesson:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .lesson-footer {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .btn-complete {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-complete:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-complete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Quiz Layout */
        .quiz-layout {
          display: flex;
          gap: 32px;
          margin-top: 40px;
          align-items: flex-start;
        }

        .quiz-main {
          flex: 1;
          max-width: 700px;
        }

        .quiz-header {
          margin-bottom: 32px;
        }

        .quiz-question-number {
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .quiz-question-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.4;
          margin: 0;
        }

        .quiz-alternatives {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .quiz-alternative-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .quiz-alternative-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .quiz-alternative-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .quiz-alternative-card.correct {
          border-color: #22c55e;
          background: #f0fdf4;
        }

        .quiz-alternative-card.incorrect {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .alternative-letter {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .selected .alternative-letter {
          background: #3b82f6;
          color: white;
        }

        .correct .alternative-letter {
          background: #22c55e;
          color: white;
        }

        .incorrect .alternative-letter {
          background: #ef4444;
          color: white;
        }

        .alternative-text {
          flex: 1;
          font-size: 1rem;
          color: #334155;
          line-height: 1.6;
        }

        .alternative-check {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .alternative-check.correct-mark {
          background: #22c55e;
        }

        .alternative-check.incorrect-mark {
          background: #ef4444;
        }

        /* Quiz Navigation */
        .quiz-navigation {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-quiz-nav,
        .btn-confirm-answer,
        .btn-next-question,
        .btn-complete-quiz,
        .btn-submit-quiz,
        .btn-retry-quiz {
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }

        .btn-confirm-answer,
        .btn-next-question,
        .btn-complete-quiz {
          background: #3b82f6;
          color: white;
        }

        .btn-confirm-answer:hover,
        .btn-next-question:hover,
        .btn-complete-quiz:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-quiz-nav {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-quiz-nav:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-quiz-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-submit-quiz {
          background: #3b82f6;
          color: white;
        }

        .btn-submit-quiz:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-submit-quiz:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-retry-quiz {
          background: #3b82f6;
          color: white;
        }

        .btn-retry-quiz:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        /* Progress Sidebar */
        .quiz-progress {
          width: 200px;
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          position: sticky;
          top: 20px;
        }

        .progress-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }

        .progress-list {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .progress-item {
          width: 32px;
          height: 32px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .progress-item:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .progress-item.answered {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .progress-item.current {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }

        .progress-check {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Quiz Results */
        .quiz-results {
          max-width: 600px;
          margin: 40px auto;
          padding: 48px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          text-align: center;
        }

        .results-header h2 {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 40px;
        }

        .results-score {
          margin-bottom: 48px;
        }

        .score-circle {
          width: 180px;
          height: 180px;
          margin: 0 auto 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 8px solid #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-percentage {
          font-size: 3.5rem;
          font-weight: 800;
          color: #3b82f6;
        }

        .score-text {
          font-size: 1.1rem;
          color: #64748b;
          margin: 0;
        }

        .results-status {
          padding: 32px;
          border-radius: 12px;
          margin-bottom: 32px;
        }

        .results-status.passed {
          background: #f0fdf4;
          border: 2px solid #22c55e;
        }

        .results-status.failed {
          background: #fef2f2;
          border: 2px solid #ef4444;
        }

        .status-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
        }

        .passed .status-icon {
          background: #22c55e;
          color: white;
        }

        .failed .status-icon {
          background: #ef4444;
          color: white;
        }

        .results-status h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .passed h3 {
          color: #15803d;
        }

        .failed h3 {
          color: #991b1b;
        }

        .results-status p {
          font-size: 1rem;
          margin: 0;
        }

        .passed p {
          color: #166534;
        }

        .failed p {
          color: #991b1b;
        }

        .results-actions {
          display: flex;
          justify-content: center;
        }

        .loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .classroom-loading p {
          color: #0f172a;
          font-size: 1.25rem;
          font-weight: 500;
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
