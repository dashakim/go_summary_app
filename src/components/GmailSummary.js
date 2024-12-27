import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
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
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { googleAuthService } from './services/googleAuthService';
import { openAiService } from './services/openAiService';
import { ActionChip, EmailCount, StyledCard, SummarySection } from './StyledComponents';
import { formatDate } from './utils';

const GmailSummary = () => {
  const theme = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthed = await googleAuthService.checkAuthStatus();
        if (isAuthed) {
          setIsAuthenticated(true);
          await fetchEmails();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    googleAuthService.logout();
    setIsAuthenticated(false);
    setEmails([]);
  };

  const handleAuthClick = async () => {
    try {
      setLoading(true);
      setError(null);
      await googleAuthService.requestAccessToken();
      setIsAuthenticated(true);
      await fetchEmails();
    } catch (err) {
      console.error('Auth error:', err);
      if (err?.error === 'popup_closed_by_user') {
        setError('Sign-in cancelled. Please try again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmails = async (emailsToAnalyze) => {
    setAnalyzing(true);
    try {
      const batchSize = 3;
      const newSummaries = {};

      for (let i = 0; i < emailsToAnalyze.length; i += batchSize) {
        const batch = emailsToAnalyze.slice(i, i + batchSize);
        const batchPromises = batch.map(async (email) => {
          if (!summaries[email.id]) {
            try {
              const summary = await openAiService.summarizeEmail(email);
              newSummaries[email.id] = summary;
              setSummaries((prev) => ({ ...prev, [email.id]: summary }));
            } catch (error) {
              console.error(`Failed to analyze email ${email.id}:`, error);
            }
          }
        });

        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze some emails. Retrying...');
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchEmails = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      setEmails([]);

      const fetchedEmails = await googleAuthService.fetchEmails();
      setEmails(fetchedEmails);
      await analyzeEmails(fetchedEmails);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.message === 'Authentication expired') {
        setIsAuthenticated(false);
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to fetch emails. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const renderEmailCard = (email) => {
    const summary = summaries[email.id];
    const isAnalyzing = analyzing && !summary;

    const headers = email.payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
    const to = headers.find((h) => h.name === 'To')?.value || '';
    const date = headers.find((h) => h.name === 'Date')?.value;

    return (
      <StyledCard key={email.id}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word' }}>
            {subject}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonOutlineIcon />}
                label={from}
                variant="filled"
                size="medium"
                sx={{ maxWidth: '100%' }}
              />
              <Chip icon={<AccessTimeIcon />} label={formatDate(date)} variant="filled" size="medium" />
              {summary?.needsResponse && <ActionChip icon={<ReplyIcon />} label="Needs Response" size="medium" />}
            </Box>
            {to && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                To: {to}
              </Typography>
            )}
          </Box>

          <Divider />

          <Typography color="text.secondary" sx={{ mt: 2, mb: 2 }}>
            {email.snippet}
          </Typography>

          <Divider />

          {isAnalyzing ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'text.secondary',
                mt: 2,
              }}
            >
              <CircularProgress size={20} />
              <Typography>Analyzing email content...</Typography>
            </Box>
          ) : summary ? (
            <SummarySection>
              <Typography
                variant="subtitle1"
                color="primary"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AssignmentIcon fontSize="small" />
                AI Summary
              </Typography>
              <Typography color="text.primary">{summary.mainPoints}</Typography>

              {summary.actionItems.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Action Items:
                  </Typography>
                  {summary.actionItems.map((item, index) => (
                    <Typography
                      key={index}
                      color="text.secondary"
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        ml: 2,
                        '&:before': {
                          content: '"•"',
                          color: theme.palette.warning.main,
                        },
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              )}
            </SummarySection>
          ) : null}
        </CardContent>
      </StyledCard>
    );
  };
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
          {isAuthenticated && (
            <>
              <EmailCount icon={<EmailIcon />} label={`${emails.length} unread`} size="medium" sx={{ mr: 2 }} />
              <Button color="inherit" onClick={handleLogout} sx={{ textTransform: 'none' }}>
                Logout
              </Button>
            </>
          )}
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
              {emails.map(renderEmailCard)}
              {emails.length === 0 && !loading && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: `1px solid ${
                      theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'
                    }`,
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
