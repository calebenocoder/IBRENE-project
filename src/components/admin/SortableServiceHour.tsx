import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Paper,
    Stack,
    TextField,
    IconButton,
    Box,
    Tooltip
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

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
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                bgcolor: isDragging ? 'grey.50' : 'background.paper',
                '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' }
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'grey.400', display: 'flex' }}>
                    <DragIcon />
                </Box>

                <TextField
                    size="small"
                    placeholder="Dia"
                    value={hour.day}
                    onChange={(e) => onChange('day', e.target.value)}
                    sx={{ flex: 1 }}
                />

                <TextField
                    size="small"
                    placeholder="Hora"
                    value={hour.time}
                    onChange={(e) => onChange('time', e.target.value)}
                    sx={{ width: 100 }}
                />

                <TextField
                    size="small"
                    placeholder="Descrição"
                    value={hour.label}
                    onChange={(e) => onChange('label', e.target.value)}
                    sx={{ flex: 2 }}
                />

                <Tooltip title="Remover">
                    <IconButton size="small" color="error" onClick={onRemove}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};
