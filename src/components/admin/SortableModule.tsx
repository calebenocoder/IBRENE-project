import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Paper,
    Box,
    Stack,
    Typography,
    IconButton,
    TextField,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    ExpandMore as ExpandIcon,
    ChevronRight as ChevronIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as LessonIcon,
    Quiz as QuizIcon,
    Check as SaveIcon,
    Close as CancelIcon
} from '@mui/icons-material';

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
    onToggleExpand: () => void;
    onSelect: () => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onEditTitleChange: (value: string) => void;
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
    onToggleExpand,
    onSelect,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onEditTitleChange,
    onAddLesson,
    onAddQuiz,
    children,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

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
        position: 'relative' as const,
        zIndex: isDragging ? 1000 : 1,
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box ref={setNodeRef} style={style} sx={{ mb: 1 }}>
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 2,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'grey.50' : 'background.paper',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    '&:hover': {
                        borderColor: isSelected ? 'primary.main' : 'grey.400',
                        '& .module-actions': { opacity: 1 }
                    }
                }}
            >
                {isEditing ? (
                    <Stack direction="row" spacing={1} sx={{ p: 1.5, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            fullWidth
                            value={editingTitle}
                            onChange={(e) => onEditTitleChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveEdit();
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            autoFocus
                            placeholder="Nome do módulo"
                        />
                        <IconButton size="small" color="success" onClick={onSaveEdit}>
                            <SaveIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={onCancelEdit}>
                            <CancelIcon />
                        </IconButton>
                    </Stack>
                ) : (
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ p: 1.5, alignItems: 'center', cursor: 'pointer' }}
                        onClick={onSelect}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                            sx={{ color: 'grey.500', '&:hover': { color: 'primary.main' } }}
                        >
                            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', mr: 0.5 }}>
                                <DragIcon fontSize="small" />
                            </Box>
                            {isExpanded ? <ExpandIcon /> : <ChevronIcon />}
                        </Stack>

                        <Typography
                            variant="subtitle2"
                            sx={{ flex: 1, fontWeight: 700, color: 'text.primary' }}
                        >
                            {module.title}
                        </Typography>

                        <Stack direction="row" spacing={0.5} className="module-actions" sx={{ opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s' }}>
                            <Tooltip title="Adicionar Aula/Quiz">
                                <IconButton size="small" color="primary" onClick={handleMenuClick}>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar Módulo">
                                <IconButton size="small" color="inherit" sx={{ color: 'grey.500' }} onClick={(e) => { e.stopPropagation(); onStartEdit(); }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir Módulo">
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                )}

                <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => { handleMenuClose(); onAddLesson(); }}>
                        <ListItemIcon><LessonIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Nova Aula" />
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); onAddQuiz(); }}>
                        <ListItemIcon><QuizIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Novo Questionário" />
                    </MenuItem>
                </Menu>
            </Paper>

            {isExpanded && children}
        </Box>
    );
};
