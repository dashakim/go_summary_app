import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { googleAuthService } from './services/googleAuthService';

const StyledCard = styled(Card)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}`,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const EmailCount = styled(Chip)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontWeight: 600,
  backdropFilter: 'blur(10px)',
  '& .MuiChip-icon': {
    color: '#ffffff',
  },
}));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const GmailSummary = () => {
  const theme = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthClick = async () => {
    try {
      setLoading(true);
      setError(null);

      await googleAuthService.requestAccessToken();
      setIsAuthenticated(true);
      await fetchEmails();
    } catch (err) {
      console.error('Auth error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedEmails = await googleAuthService.fetchEmails();
      setEmails(fetchedEmails);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch emails. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage:
          theme.palette.mode === 'light'
            ? 'radial-gradient(at 50% 0%, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.05) 50%, transparent 100%)'
            : 'none',
      }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
            <EmailIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Gmail Summary Assistant
          </Typography>
          {isAuthenticated && <EmailCount icon={<EmailIcon />} label={`${emails.length} unread`} size="medium" />}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!isAuthenticated ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: theme.gradient.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3,
              }}
            >
              <EmailIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              Connect to Gmail
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Sign in with your Google account to get started
            </Typography>
            <Button
              variant="contained"
              onClick={handleAuthClick}
              disabled={loading}
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
            >
              {loading ? 'Connecting...' : 'Connect Gmail'}
            </Button>
          </Paper>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <Typography variant="h5">Unread Emails</Typography>
              <Button
                variant="contained"
                onClick={fetchEmails}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {emails.map((email) => (
                <StyledCard key={email.id}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {email.payload.headers.find((h) => h.name === 'Subject')?.value || 'No Subject'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Chip
                        icon={<PersonOutlineIcon />}
                        label={email.payload.headers.find((h) => h.name === 'From')?.value || 'Unknown'}
                        variant="filled"
                        size="medium"
                      />
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={formatDate(email.payload.headers.find((h) => h.name === 'Date')?.value)}
                        variant="filled"
                        size="medium"
                      />
                    </Box>
                    {email.snippet && (
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        {email.snippet}
                      </Typography>
                    )}
                  </CardContent>
                </StyledCard>
              ))}
              {emails.length === 0 && !loading && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <Typography color="text.secondary">No unread emails found</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default GmailSummary;
