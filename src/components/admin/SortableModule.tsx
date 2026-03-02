import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Module {
    id: string;
    title: string;
    order_index: number;
}

interface SortableModuleProps {
    module: Module;
    isExpanded: boolean;
    isSelected: boolean;
    isEditing: boolean;
    editingTitle: string;
    showAddMenu: boolean;
    onToggleExpand: () => void;
    onSelect: () => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onEditTitleChange: (value: string) => void;
    onToggleAddMenu: () => void;
    onAddLesson: () => void;
    onAddQuiz: () => void;
    children?: React.ReactNode;
}

export const SortableModule: React.FC<SortableModuleProps> = ({
    module,
    isExpanded,
    isSelected,
    isEditing,
    editingTitle,
    showAddMenu,
    onToggleExpand,
    onSelect,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onEditTitleChange,
    onToggleAddMenu,
    onAddLesson,
    onAddQuiz,
    children,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: module.id,
        data: {
            type: 'module',
            module,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="module-item">
            {isEditing ? (
                <div className="module-edit-inline">
                    <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => onEditTitleChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') onCancelEdit();
                        }}
                        className="module-title-input"
                        autoFocus
                    />
                    <button className="btn-save-module" onClick={onSaveEdit}>✓</button>
                    <button className="btn-cancel-module" onClick={onCancelEdit}>×</button>
                </div>
            ) : (
                <div className={`module-header ${isSelected ? 'selected' : ''}`}>
                    <div className="expand-area" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
                        <span className="drag-handle" {...attributes} {...listeners}>⋮⋮</span>
                        <span className="expand-icon">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    </div>
                    <span className="module-title" onClick={onSelect}>{module.title}</span>
                    <div className="module-actions">
                        <button
                            className="btn-add-lesson"
                            onClick={(e) => { e.stopPropagation(); onToggleAddMenu(); }}
                            title="Adicionar aula ou questionário"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <button
                            className="btn-edit-module"
                            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                            title="Editar módulo"
                        >
                            ✎
                        </button>
                        <button
                            type="button"
                            className="btn-delete-module"
                            style={{ position: 'relative', zIndex: 10 }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            )}

            {showAddMenu && (
                <div className="add-lesson-menu">
                    <button className="menu-item" onClick={onAddLesson}>
                        📄 Nova Aula
                    </button>
                    <button className="menu-item" onClick={onAddQuiz}>
                        📝 Novo Questionário
                    </button>
                </div>
            )}

            {isExpanded && children}
        </div>
    );
};
