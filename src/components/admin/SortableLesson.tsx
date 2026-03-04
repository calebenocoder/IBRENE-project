import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Box,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Description as FileIcon,
    Quiz as QuizIcon,
    Close as DeleteIcon
} from '@mui/icons-material';

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
    isSelected?: boolean;
}

export const SortableLesson: React.FC<SortableLessonProps> = ({
    lesson,
    onSelect,
    onDelete,
    isSelected
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
        position: 'relative' as const,
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                px: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: isSelected ? 'primary.50' : 'transparent',
                border: '1px solid',
                borderColor: isSelected ? 'primary.100' : 'transparent',
                '&:hover': {
                    bgcolor: isSelected ? 'primary.100' : 'grey.100',
                    '& .drag-handle-lesson, & .btn-delete-lesson': {
                        opacity: 1,
                    }
                }
            }}
        >
            <Box
                {...attributes}
                {...listeners}
                className="drag-handle-lesson"
                sx={{
                    display: 'flex',
                    color: 'grey.300',
                    cursor: 'grab',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:active': { cursor: 'grabbing' }
                }}
            >
                <DragIcon fontSize="small" />
            </Box>

            <Box sx={{ color: isSelected ? 'primary.main' : 'grey.500', display: 'flex' }}>
                {lesson.content_type === 'quiz' ? <QuizIcon fontSize="small" /> : <FileIcon fontSize="small" />}
            </Box>

            <Typography
                variant="body2"
                sx={{
                    flex: 1,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'primary.dark' : 'text.primary'
                }}
            >
                {lesson.title}
            </Typography>

            <Tooltip title="Excluir Aula">
                <IconButton
                    size="small"
                    className="btn-delete-lesson"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete();
                    }}
                    sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.50' }
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};
