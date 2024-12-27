import { styled } from '@mui/material/styles';
import { Box, Card, Chip } from '@mui/material';

export const StyledCard = styled(Card)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

export const EmailCount = styled(Chip)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontWeight: 600,
  backdropFilter: 'blur(10px)',
  '& .MuiChip-icon': {
    color: '#ffffff',
  },
}));

export const ActionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
  '& .MuiChip-icon': {
    color: theme.palette.warning.contrastText,
  },
}));

export const SummarySection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
}));
