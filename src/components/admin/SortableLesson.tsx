import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lesson {
    id: string;
    module_id: string;
    title: string;
    content_type: 'video' | 'text' | 'quiz';
    order_index: number;
}

interface SortableLessonProps {
    lesson: Lesson;
    onSelect: () => void;
    onDelete: () => void;
}

export const SortableLesson: React.FC<SortableLessonProps> = ({
    lesson,
    onSelect,
    onDelete,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lesson.id,
        data: {
            type: 'lesson',
            lesson,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="lesson-item"
            onClick={onSelect}
        >
            <span className="drag-handle-lesson" {...attributes} {...listeners}>⋮⋮</span>
            <span className="lesson-icon">
                {lesson.content_type === 'quiz' ? '📝' : '📄'}
            </span>
            <span className="lesson-title">{lesson.title}</span>
            <button
                type="button"
                className="btn-delete-lesson"
                style={{ position: 'relative', zIndex: 10 }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                ×
            </button>
        </div>
    );
};
