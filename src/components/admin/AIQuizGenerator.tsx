import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Note: Gemini initialization and API_KEY usage removed from frontend for security. 
// The logic now resides in Supabase Edge Functions.

interface AIQuizGeneratorProps {
    courseId: string;
    onQuizGenerated: (questions: any[]) => void;
    onClose: () => void;
}

interface SourceOption {
    id: string;
    title: string;
    type: 'module' | 'lesson';
    moduleId?: string; // For lessons, to know which module they belong to
}

export const AIQuizGenerator: React.FC<AIQuizGeneratorProps> = ({ courseId, onQuizGenerated, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [sources, setSources] = useState<SourceOption[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [difficulty, setDifficulty] = useState<'medium' | 'hard'>('medium');
    const [questionCount, setQuestionCount] = useState<number>(5);
    const [loadingSources, setLoadingSources] = useState(true);

    // Fetch modules and lessons to populate usage options
    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoadingSources(true);
                // Fetch modules and lessons
                const { data: modules, error } = await supabase
                    .from('modules')
                    .select(`
            id, 
            title,
            lessons (id, title, content_type)
          `)
                    .eq('course_id', courseId)
                    .order('order_index');

                if (error) throw error;

                const options: SourceOption[] = [];

                modules?.forEach((module: any) => {
                    // Add Module option
                    options.push({
                        id: module.id,
                        title: `Módulo: ${module.title}`,
                        type: 'module'
                    });

                    // Add Lesson options (only text/video content, ignore quizzes)
                    module.lessons?.forEach((lesson: any) => {
                        if (lesson.content_type !== 'quiz') {
                            options.push({
                                id: lesson.id,
                                title: `  └─ Aula: ${lesson.title}`,
                                type: 'lesson',
                                moduleId: module.id
                            });
                        }
                    });
                });

                setSources(options);
            } catch (err) {
                console.error('Error fetching sources:', err);
            } finally {
                setLoadingSources(false);
            }
        };

        fetchContent();
    }, [courseId]);

    const fetchContentText = async (sourceId: string): Promise<string> => {
        const source = sources.find(s => s.id === sourceId);
        if (!source) return '';

        let contentText = '';

        if (source.type === 'lesson') {
            const { data } = await supabase
                .from('lessons')
                .select('title, text_content')
                .eq('id', source.id)
                .single();

            if (data) {
                contentText = `TÍTULO DA AULA: ${data.title}\n\nCONTEÚDO:\n${data.text_content || ''}`;
            }
        } else {
            // Fetch all lessons in module
            const { data } = await supabase
                .from('lessons')
                .select('title, text_content')
                .eq('module_id', source.id);

            if (data) {
                contentText = `MÓDULO: ${source.title}\n\n` + data.map(l =>
                    `--- AULA: ${l.title} ---\n${l.text_content || ''}`
                ).join('\n\n');
            }
        }

        return contentText;
    };

    const handleGenerate = async () => {
        if (!selectedSource) return;

        setLoading(true);
        setStatus('Lendo conteúdo...');

        try {
            setStatus('Gerando questões com IA segura...');

            // 2. Call Supabase Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('generate-quiz', {
                body: {
                    content: content,
                    questionCount: questionCount,
                    difficulty: difficulty
                }
            });

            if (functionError) throw functionError;
            if (!data) throw new Error('Nenhum dado retornado pela IA.');

            const questionsData = data;

            // 5. Transform to App Structure (with UUIDs)
            const formattedQuestions = questionsData.map((q: any, qIndex: number) => ({
                id: uuidv4(),
                title: q.title,
                order_index: qIndex,
                alternatives: q.alternatives.map((alt: any, aIndex: number) => ({
                    id: uuidv4(),
                    text: alt.text,
                    is_correct: alt.is_correct,
                    order_index: aIndex
                }))
            }));

            onQuizGenerated(formattedQuestions);
            onClose();

        } catch (err: any) {
            console.error('AI Generation Error:', err);
            alert(`Erro ao gerar questionário: ${err.message}`);
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="ai-modal-overlay">
            <div className="ai-modal">
                <div className="ai-header">
                    <h3>✨ Criar Questionário com I.A.</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="ai-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>{status}</p>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Fonte do Conteúdo</label>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    disabled={loadingSources}
                                >
                                    <option value="">Selecione uma fonte...</option>
                                    {sources.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Dificuldade</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="medium"
                                            checked={difficulty === 'medium'}
                                            onChange={() => setDifficulty('medium')}
                                        />
                                        Média
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="hard"
                                            checked={difficulty === 'hard'}
                                            onChange={() => setDifficulty('hard')}
                                        />
                                        Difícil
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label>Quantidade de Questões</label>
                                    <div className="radio-group">
                                        {[5, 10, 15].map(count => (
                                            <label key={count}>
                                                <input
                                                    type="radio"
                                                    name="questionCount"
                                                    value={count}
                                                    checked={questionCount === count}
                                                    onChange={() => setQuestionCount(count)}
                                                />
                                                {count}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="ai-info">
                                <p>⚡ Usando <strong>Supabase Edge Functions</strong> para garantir que a geração de IA seja rápida e segura. {questionCount} questões serão geradas.</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="ai-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary btn-generate"
                        onClick={handleGenerate}
                        disabled={loading || !selectedSource}
                    >
                        {loading ? 'Gerando...' : '✨ Gerar Questionário'}
                    </button>
                </div>
            </div>

            <style>{`
        .ai-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .ai-modal {
          background: white;
          width: 90%;
          max-width: 500px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .ai-header {
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-header h3 {
          margin: 0;
          color: #1e293b;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ai-body {
          padding: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #475569;
        }
        select {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 1rem;
        }
        .radio-group {
          display: flex;
          gap: 20px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 400;
          cursor: pointer;
        }
        .ai-info {
          background: #eff6ff;
          padding: 12px;
          border-radius: 6px;
          color: #1e40af;
          font-size: 0.9rem;
        }
        .ai-footer {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-generate {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
        }
        .btn-generate:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          transform: translateY(-1px);
        }
        .loading-state {
          text-align: center;
          padding: 40px 0;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
