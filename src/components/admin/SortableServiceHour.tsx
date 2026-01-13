import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ServiceHour {
    id: string;
    day: string;
    time: string;
    label: string;
}

interface SortableServiceHourProps {
    hour: ServiceHour;
    onRemove: () => void;
    onChange: (field: keyof ServiceHour, value: string) => void;
}

export const SortableServiceHour: React.FC<SortableServiceHourProps> = ({
    hour,
    onRemove,
    onChange
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: hour.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="hour-item-sortable"
        >
            <div className="drag-handle" {...attributes} {...listeners}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
            </div>

            <input
                type="text"
                value={hour.day}
                onChange={(e) => onChange('day', e.target.value)}
                placeholder="Dia"
                className="form-input flex-1"
            />
            <input
                type="text"
                value={hour.time}
                onChange={(e) => onChange('time', e.target.value)}
                placeholder="Hora"
                className="form-input w-time"
            />
            <input
                type="text"
                value={hour.label}
                onChange={(e) => onChange('label', e.target.value)}
                placeholder="Descrição"
                className="form-input flex-2"
            />
            <button
                type="button"
                onClick={onRemove}
                className="btn-remove"
                title="Remover"
            >
                ✕
            </button>

            <style>{`
                .hour-item-sortable {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                    background-color: #f9fafb;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    border: 1px solid #f3f4f6;
                    margin-bottom: 0.5rem;
                }
                .hour-item-sortable:hover {
                    border-color: #d1d5db;
                    background-color: #f3f4f6;
                }
                .drag-handle {
                    cursor: grab;
                    color: #9ca3af;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .drag-handle:active {
                    cursor: grabbing;
                }
                .hour-item-sortable .flex-1 { flex: 1; }
                .hour-item-sortable .flex-2 { flex: 2; }
                .hour-item-sortable .w-time { width: 6rem; }
                .hour-item-sortable .btn-remove {
                    color: #ef4444;
                    padding: 0.5rem;
                    background: none;
                    border: none;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .hour-item-sortable .btn-remove:hover { color: #b91c1c; }
            `}</style>
        </div>
    );
};
