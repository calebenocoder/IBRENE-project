import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AIQuizGenerator } from './AIQuizGenerator';
import './TestEditor.css';

interface Question {
    id?: string;
    title: string;
    description?: string;
    order_index: number;
    alternatives: Alternative[];
}

interface Alternative {
    id?: string;
    text: string;
    is_correct: boolean;
    order_index: number;
}

interface Lesson {
    id: string;
    module_id: string;
    title: string;
    content_type: 'video' | 'text' | 'quiz';
    order_index: number;
}

interface TestEditorProps {
    moduleId: string;
    lesson: Lesson | null;
    onSave: () => void;
    onCancel: () => void;
    courseId: string;
}

export const TestEditor: React.FC<TestEditorProps> = ({
    moduleId,
    lesson,
    onSave,
    onCancel,
    courseId
}) => {
    const [title, setTitle] = useState(lesson?.title || '');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [passingPercentage, setPassingPercentage] = useState(70);
    const [showAiModal, setShowAiModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [testId, setTestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lesson) {
            setLoading(true);
            fetchTestData().finally(() => setLoading(false));
        } else {
            // Start with one empty question
            addQuestion();
        }
    }, [lesson]);

    const fetchTestData = async () => {
        if (!lesson) return;

        try {
            // Fetch test
            const { data: testData } = await supabase
                .from('tests')
                .select('*')
                .eq('lesson_id', lesson.id)
                .single();

            if (testData) {
                setTestId(testData.id);
                setPassingPercentage(testData.passing_percentage || 70);

                // Fetch questions with the correct test_id
                const { data: questionsData } = await supabase
                    .from('questions')
                    .select(`
    *,
    alternatives(*)
        `)
                    .eq('test_id', testData.id)
                    .order('order_index');

                if (questionsData && questionsData.length > 0) {
                    const formattedQuestions = questionsData.map((q: any) => ({
                        id: q.id,
                        title: q.title,
                        description: q.description,
                        order_index: q.order_index,
                        alternatives: (q.alternatives || []).sort((a: any, b: any) => a.order_index - b.order_index)
                    }));
                    setQuestions(formattedQuestions);
                } else {
                    // Start with one empty question if no questions exist
                    addQuestion();
                }
            }
        } catch (error) {
            console.error('Error fetching test data:', error);
            // Start with one empty question on error
            addQuestion();
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            title: '',
            description: '',
            order_index: questions.length,
            alternatives: [
                { text: '', is_correct: true, order_index: 0 },
                { text: '', is_correct: false, order_index: 1 }
            ]
        }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    const addAlternative = (questionIndex: number) => {
        const updated = [...questions];
        updated[questionIndex].alternatives.push({
            text: '',
            is_correct: false,
            order_index: updated[questionIndex].alternatives.length
        });
        setQuestions(updated);
    };

    const removeAlternative = (questionIndex: number, altIndex: number) => {
        const updated = [...questions];
        updated[questionIndex].alternatives = updated[questionIndex].alternatives.filter((_, i) => i !== altIndex);
        setQuestions(updated);
    };

    const updateAlternative = (questionIndex: number, altIndex: number, field: keyof Alternative, value: any) => {
        const updated = [...questions];
        (updated[questionIndex].alternatives[altIndex] as any)[field] = value;

        // If marking as correct, unmark all others
        if (field === 'is_correct' && value === true) {
            updated[questionIndex].alternatives.forEach((alt, i) => {
                if (i !== altIndex) alt.is_correct = false;
            });
        }

        setQuestions(updated);
    };

    const validateTest = (): boolean => {
        if (!title.trim()) {
            setError('O título do questionário é obrigatório');
            return false;
        }

        if (questions.length === 0) {
            setError('Adicione pelo menos uma questão');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.title.trim()) {
                setError(`Questão ${i + 1}: Título é obrigatório`);
                return false;
            }

            if (q.alternatives.length < 2) {
                setError(`Questão ${i + 1}: Adicione pelo menos 2 alternativas`);
                return false;
            }

            const correctCount = q.alternatives.filter(a => a.is_correct).length;
            if (correctCount !== 1) {
                setError(`Questão ${i + 1}: Selecione exatamente 1 alternativa correta`);
                return false;
            }

            for (let j = 0; j < q.alternatives.length; j++) {
                if (!q.alternatives[j].text.trim()) {
                    setError(`Questão ${i + 1}, Alternativa ${j + 1}: Texto é obrigatório`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateTest()) return;

        setSaving(true);
        setError('');

        try {
            let currentLessonId = lesson?.id;

            // Create or update lesson
            if (!currentLessonId) {
                const { count } = await supabase
                    .from('lessons')
                    .select('*', { count: 'exact', head: true })
                    .eq('module_id', moduleId);

                const { data: lessonData, error: lessonError } = await supabase
                    .from('lessons')
                    .insert([{
                        module_id: moduleId,
                        title,
                        content_type: 'quiz',
                        order_index: count || 0
                    }])
                    .select()
                    .single();

                if (lessonError) throw lessonError;
                currentLessonId = lessonData.id;
            } else {
                await supabase
                    .from('lessons')
                    .update({ title })
                    .eq('id', currentLessonId);
            }

            // Create or update test
            let currentTestId = testId;
            if (!currentTestId) {
                const { data: testData, error: testError } = await supabase
                    .from('tests')
                    .insert([{
                        lesson_id: currentLessonId,
                        title,
                        passing_percentage: passingPercentage
                    }])
                    .select()
                    .single();

                if (testError) throw testError;
                currentTestId = testData.id;
            } else {
                await supabase
                    .from('tests')
                    .update({
                        title,
                        passing_percentage: passingPercentage
                    })
                    .eq('id', currentTestId);

                // Delete existing questions (cascade will delete alternatives)
                await supabase
                    .from('questions')
                    .delete()
                    .eq('test_id', currentTestId);
            }

            // Insert questions and alternatives
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const { data: questionData, error: questionError } = await supabase
                    .from('questions')
                    .insert([{
                        test_id: currentTestId,
                        title: question.title,
                        description: question.description || null,
                        order_index: i // Auto-assign index based on loop
                    }])
                    .select()
                    .single();

                if (questionError) throw questionError;

                // Insert alternatives
                const alternativesData = question.alternatives.map((alt, j) => ({
                    question_id: questionData.id,
                    text: alt.text,
                    is_correct: alt.is_correct,
                    order_index: j // Auto-assign index based on map
                }));

                const { error: altError } = await supabase
                    .from('alternatives')
                    .insert(alternativesData);

                if (altError) throw altError;
            }

            onSave();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar questionário');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="test-editor">
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Carregando questionário...</p>
                </div>
            ) : (
                <>
                    <div className="editor-header">
                        <h2>{lesson ? 'Editar Questionário' : 'Novo Questionário'}</h2>
                    </div>

                    <form className="editor-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="form-group">
                            <label htmlFor="test-title">Título do Questionário *</label>
                            <input
                                id="test-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Avaliação - Módulo 1"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passing-percentage">Percentual Mínimo para Aprovação (%) *</label>
                            <input
                                id="passing-percentage"
                                type="number"
                                min="0"
                                max="100"
                                value={passingPercentage}
                                onChange={(e) => setPassingPercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                placeholder="70"
                            />
                            <small style={{ color: '#64748b', fontSize: '0.85rem' }}>Defina a nota mínima necessária para o aluno ser aprovado (0-100%)</small>
                        </div>

                        <div className="questions-section">
                            <div className="section-header">
                                <h3>Questões</h3>
                                <button type="button" className="btn-add-question" onClick={addQuestion}>
                                    + Adicionar Questão
                                </button>
                            </div>

                            {questions.map((question, qIndex) => (
                                <div key={qIndex} className="question-card">
                                    <div className="question-header">
                                        <span className="question-number">Questão {qIndex + 1}</span>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-remove"
                                                onClick={() => removeQuestion(qIndex)}
                                            >
                                                🗑️ Remover
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Pergunta *</label>
                                        <input
                                            type="text"
                                            value={question.title}
                                            onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                                            placeholder="Digite a pergunta..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Descrição (opcional)</label>
                                        <textarea
                                            value={question.description || ''}
                                            onChange={(e) => updateQuestion(qIndex, 'description', e.target.value)}
                                            placeholder="Contexto adicional para a questão..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="alternatives-section">
                                        <label>Alternativas</label>
                                        {question.alternatives.map((alt, aIndex) => (
                                            <div key={aIndex} className="alternative-row">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={alt.is_correct}
                                                    onChange={() => updateAlternative(qIndex, aIndex, 'is_correct', true)}
                                                    title="Marcar como correta"
                                                />
                                                <input
                                                    type="text"
                                                    value={alt.text}
                                                    onChange={(e) => updateAlternative(qIndex, aIndex, 'text', e.target.value)}
                                                    placeholder={`Alternativa ${String.fromCharCode(65 + aIndex)}`}
                                                    className="alternative-input"
                                                />
                                                {question.alternatives.length > 2 && (
                                                    <button
                                                        type="button"
                                                        className="btn-remove-alt"
                                                        onClick={() => removeAlternative(qIndex, aIndex)}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {question.alternatives.length < 6 && (
                                            <button
                                                type="button"
                                                className="btn-add-alternative"
                                                onClick={() => addAlternative(qIndex)}
                                            >
                                                + Adicionar Alternativa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="editor-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAiModal(true)}>
                                ✨ Criar com I.A.
                            </button>
                            <button type="button" className="btn btn-cancel" onClick={onCancel}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-save" disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar Questionário'}
                            </button>
                        </div>
                    </form>

                    {showAiModal && (
                        <AIQuizGenerator
                            courseId={courseId}
                            onClose={() => setShowAiModal(false)}
                            onQuizGenerated={(newQuestions) => {
                                setQuestions(newQuestions);
                                if (!title) {
                                    setTitle('Questionário Gerado por IA');
                                }
                                setShowAiModal(false);
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};
