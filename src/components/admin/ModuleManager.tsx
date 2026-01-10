import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
    order_index: number;
}

interface ModuleManagerProps {
    courseId: string;
    modules: Module[];
    onModulesChange: () => void;
    onModuleSelect: (module: Module) => void;
    onLessonSelect: (lesson: Lesson) => void;
    selectedModuleId?: string;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({
    courseId,
    modules,
    onModulesChange,
    onModuleSelect,
    onLessonSelect,
    selectedModuleId
}) => {
    const [showAddModule, setShowAddModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});

    useEffect(() => {
        // Fetch lessons for all modules
        modules.forEach(module => fetchLessons(module.id));
    }, [modules]);

    const fetchLessons = async (moduleId: string) => {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index');

        if (!error && data) {
            setModuleLessons(prev => ({ ...prev, [moduleId]: data }));
        }
    };

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;

        const { error } = await supabase
            .from('modules')
            .insert([{
                course_id: courseId,
                title: newModuleTitle,
                order_index: modules.length
            }]);

        if (!error) {
            setNewModuleTitle('');
            setShowAddModule(false);
            onModulesChange();
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas serão excluídas.')) {
            return;
        }

        const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', moduleId);

        if (!error) {
            onModulesChange();
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula?')) {
            return;
        }

        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);

        if (!error) {
            fetchLessons(moduleId);
        }
    };

    return (
        <div className="module-manager">
            <div className="manager-header">
                <h3>Módulos</h3>
                <button
                    className="btn-add-module"
                    onClick={() => setShowAddModule(!showAddModule)}
                >
                    +
                </button>
            </div>

            {showAddModule && (
                <div className="add-module-form">
                    <input
                        type="text"
                        placeholder="Nome do módulo"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
                        autoFocus
                    />
                    <div className="form-actions">
                        <button className="btn-save" onClick={handleAddModule}>Salvar</button>
                        <button className="btn-cancel" onClick={() => setShowAddModule(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            <div className="modules-list">
                {modules.map((module) => (
                    <div key={module.id} className="module-item">
                        <div
                            className={`module-header ${selectedModuleId === module.id ? 'selected' : ''}`}
                            onClick={() => {
                                onModuleSelect(module);
                                toggleModule(module.id);
                            }}
                        >
                            <span className="expand-icon">
                                {expandedModules.has(module.id) ? '▼' : '▶'}
                            </span>
                            <span className="module-title">{module.title}</span>
                            <button
                                className="btn-delete-module"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteModule(module.id);
                                }}
                            >
                                🗑️
                            </button>
                        </div>

                        {expandedModules.has(module.id) && (
                            <div className="lessons-list">
                                {moduleLessons[module.id]?.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="lesson-item"
                                        onClick={() => onLessonSelect(lesson)}
                                    >
                                        <span className="lesson-icon">
                                            {lesson.content_type === 'quiz' ? '📝' : '📄'}
                                        </span>
                                        <span className="lesson-title">{lesson.title}</span>
                                        <button
                                            className="btn-delete-lesson"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteLesson(lesson.id, module.id);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {(!moduleLessons[module.id] || moduleLessons[module.id].length === 0) && (
                                    <div className="empty-lessons">Nenhuma aula ainda</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
        .module-manager {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .manager-header h3 {
          font-size: 1.1rem;
          color: #1a1a1a;
          font-weight: 700;
        }

        .btn-add-module {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-add-module:hover {
          background: #0056b3;
          transform: scale(1.1);
        }

        .add-module-form {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .add-module-form input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
        }

        .btn-save, .btn-cancel {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-save {
          background: #007bff;
          color: white;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #475569;
        }

        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .module-item {
          border-radius: 8px;
          overflow: hidden;
        }

        .module-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .module-header:hover {
          background: #f8fafc;
        }

        .module-header.selected {
          background: #eff6ff;
          color: #007bff;
        }

        .expand-icon {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .module-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .btn-delete-module {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 1rem;
        }

        .module-header:hover .btn-delete-module {
          opacity: 1;
        }

        .lessons-list {
          padding-left: 24px;
          margin-top: 4px;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          margin-bottom: 2px;
        }

        .lesson-item:hover {
          background: #f1f5f9;
        }

        .lesson-icon {
          font-size: 0.9rem;
        }

        .lesson-title {
          flex: 1;
          font-size: 0.9rem;
          color: #475569;
        }

        .btn-delete-lesson {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          color: #ef4444;
          font-size: 1.2rem;
          line-height: 1;
        }

        .lesson-item:hover .btn-delete-lesson {
          opacity: 1;
        }

        .empty-lessons {
          padding: 8px 12px;
          font-size: 0.85rem;
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
        </div>
    );
};
