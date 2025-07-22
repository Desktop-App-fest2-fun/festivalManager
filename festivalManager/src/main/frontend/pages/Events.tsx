import { Box, Container, Typography, Paper, Button, Tabs, Tab, Chip, TextField, Grid, CircularProgress, Alert, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PaletteIcon from '@mui/icons-material/Palette';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { Core, EventStatus } from '../model/EventItemModel/Core';
import useEventCores from 'Frontend/middleware/hooks/useEventCores';

export interface NewEventFormData {
  eventCode: string;
  eventName: string;
}

const Events = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EventStatus>('ACTIVE');
  const { eventCores, createNewEventCore, loading, creatingEvent, error } = useEventCores();
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [eventFormData, setEventFormData] = useState<NewEventFormData>({
    eventCode: '',
    eventName: '',
  });

  const handleToggleEventForm = () => {
    setShowEventForm(!showEventForm);
    if (!showEventForm) {
      // Reset form when opening
      setEventFormData({
        eventCode: '',
        eventName: '',
      });
      // Clear any form errors
      setFormErrors({
        eventCode: false,
        eventName: false
      });
    }
  };

  const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEventFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field being edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const [formErrors, setFormErrors] = useState({
    eventCode: false,
    eventName: false
  });

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = {
      eventCode: !eventFormData.eventCode.trim(),
      eventName: !eventFormData.eventName.trim()
    };
    
    setFormErrors(errors);
    
    // Only proceed if there are no errors
    if (!errors.eventCode && !errors.eventName) {
      // Create the event but don't hide the form yet
      await handleCreateEvent();
      // Form will be hidden only after successful event creation
    }
  };

  const handleEventClick = (eventId: string) => {
  // Use base64 encoding for complex IDs
  const base64Id = btoa(eventId);
  navigate(`/event/${base64Id}`);
};

const [creationSuccess, setCreationSuccess] = useState<boolean>(false);
const [successMessage, setSuccessMessage] = useState<string>('');

const handleCreateEvent = async () => {
  const newEventId = await createNewEventCore(eventFormData);
  if (newEventId) {
    // Show success message
    setCreationSuccess(true);
    setSuccessMessage(`Event "${eventFormData.eventName}" created successfully!`);
    
    // Reset form data on successful creation
    setEventFormData({
      eventCode: '',
      eventName: '',
    });
    
    // Brief delay before hiding form and navigating
    setTimeout(() => {
      setShowEventForm(false);
      setCreationSuccess(false);
      
      // Use base64 encoding for complex IDs
      const base64Id = btoa(newEventId);
      navigate(`/event/${base64Id}`);
    }, 1500); // 1.5 second delay
  }
};

  const filteredEventCores = eventCores.filter((eventCore) => eventCore.data.coreStatus.status === activeTab);

  if (error) {
    return (
      <Box>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Loading events...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              Your Events
            </Typography>
            <Button
              variant="contained"
              startIcon={creatingEvent ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              onClick={handleToggleEventForm}
              disabled={creatingEvent}
              sx={{
                borderRadius: '50px',
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
                },
              }}>
              {showEventForm ? 'Cancel' : 'Manage Event'}
            </Button>
          </Box>

          {/* Event Form - Create */}
          {showEventForm && (
            <Box sx={{ mt: 4, mb: 4 }}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Create New Event
                  </Typography>
                  <Button
                    onClick={handleToggleEventForm}
                    disabled={creatingEvent}
                    sx={{
                      borderRadius: '50%',
                      minWidth: 0,
                      width: 40,
                      height: 40,
                      bgcolor: 'grey.100',
                      '&:hover': {
                        bgcolor: 'grey.200',
                      },
                    }}>
                    <CloseIcon />
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Event Code"
                      variant="outlined"
                      name="eventCode"
                      value={eventFormData.eventCode}
                      onChange={handleEventFormChange}
                      disabled={creatingEvent}
                      error={formErrors.eventCode}
                      helperText={formErrors.eventCode ? "Event code is required" : ""}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      variant="outlined"
                      name="eventName"
                      value={eventFormData.eventName}
                      onChange={handleEventFormChange}
                      disabled={creatingEvent}
                      error={formErrors.eventName}
                      helperText={formErrors.eventName ? "Event name is required" : ""}
                      required
                    />
                  </Grid>
                  
                  {/* Success message */}
                  <Grid item xs={12}>
                    <Fade in={creationSuccess} timeout={500}>
                      <Box sx={{ width: '100%', mb: 2 }}>
                        {creationSuccess && (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            {successMessage}
                          </Alert>
                        )}
                      </Box>
                    </Fade>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleEventFormSubmit}
                        disabled={creatingEvent}
                        sx={{
                          borderRadius: '50px',
                          px: 3,
                          background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
                          },
                        }}>
                        {creatingEvent ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} color="inherit" />
                            <span>Creating Event...</span>
                          </Box>
                        ) : (
                          'Create Event'
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minWidth: 120,
                  fontSize: '1rem',
                },
                '& .Mui-selected': {
                  color: '#2563eb !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2563eb',
                },
              }}>
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrowIcon sx={{ fontSize: 20 }} />
                    <span>Active</span>
                    <Chip
                      label={eventCores.filter((e) => e.data.coreStatus.status === 'ACTIVE').length}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: activeTab === 'ACTIVE' ? '#2563eb' : 'grey.200',
                        color: activeTab === 'ACTIVE' ? 'white' : 'text.secondary',
                      }}
                    />
                  </Box>
                }
                value="ACTIVE"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20 }} />
                    <span>Upcoming</span>
                    <Chip
                      label={eventCores.filter((e) => e.data.coreStatus.status === 'UPCOMING').length}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: activeTab === 'UPCOMING' ? '#2563eb' : 'grey.200',
                        color: activeTab === 'UPCOMING' ? 'white' : 'text.secondary',
                      }}
                    />
                  </Box>
                }
                value="UPCOMING"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon sx={{ fontSize: 20 }} />
                    <span>Draft</span>
                    <Chip
                      label={eventCores.filter((e) => e.data.coreStatus.status === 'DRAFT').length}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: activeTab === 'DRAFT' ? '#2563eb' : 'grey.200',
                        color: activeTab === 'DRAFT' ? 'white' : 'text.secondary',
                      }}
                    />
                  </Box>
                }
                value="DRAFT"
              />
            </Tabs>
          </Box>

          {/* Event Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 3,
              minHeight: 400,
            }}>
            {loading && (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}>
                <Typography variant="h6" color="text.secondary">
                  Loading events...
                </Typography>
              </Box>
            )}

            {error && (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}>
                <Typography variant="h6" color="error">
                  {error}
                </Typography>
              </Box>
            )}

            {!loading && !error && filteredEventCores.length === 0 && (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}>
                <Typography variant="h6" color="text.secondary">
                  No {activeTab.toLowerCase()} events found
                </Typography>
              </Box>
            )}

            {!loading &&
              !error &&
              filteredEventCores.map((eventCore) => (
                <EventCard
                  key={eventCore.eventId || ''}
                  id={eventCore.eventId || ''}
                  title={eventCore.data.coreData.generalData.eventName || ''}
                  date={eventCore.data.coreData.startDate || ''}
                  guests={0} // Placeholder for guests count
                  status={eventCore.data.coreStatus.status || 'DRAFT'}
                  image="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop"
                  type={eventCore.data.coreData.generalData.type || ''}
                  location={`${eventCore.data.coreData.venueData.city || 'CITY'}, ${
                    eventCore.data.coreData.venueData.country || 'COUNTRY'
                  }`}
                  onClick={handleEventClick}
                />
              ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  guests: number;
  status: EventStatus;
  image: string;
  type: string;
  location: string;
  onClick: (id: string) => void;
}

const EventCard = ({ id, title, date, guests, status, image, type, location, onClick }: EventCardProps) => {
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#2563eb';
      case 'UPCOMING':
        return '#059669';
      case 'DRAFT':
        return '#9333ea';
      case 'IN_PROGRESS':
        return '#d97706';
      case 'ARCHIVED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <PlayArrowIcon sx={{ fontSize: 16 }} />;
      case 'UPCOMING':
        return <AccessTimeIcon sx={{ fontSize: 16 }} />;
      case 'DRAFT':
        return <EditIcon sx={{ fontSize: 16 }} />;
      default:
        return <EditIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={() => onClick(id)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}>
      <Box
        sx={{
          position: 'relative',
          paddingTop: '56.25%', // 16:9 aspect ratio
          backgroundColor: 'grey.100',
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 2,
          }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
            {location}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {type === 'music' && <MusicNoteIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          {type === 'art' && <PaletteIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          {type === 'conference' && <GroupsIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Event
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {date}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getStatusIcon(status)}
            <Typography
              variant="body2"
              sx={{
                color: getStatusColor(status),
                fontWeight: 500,
              }}>
              {status}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {guests} guests
        </Typography>
      </Box>
    </Paper>
  );
};

export default Events;
