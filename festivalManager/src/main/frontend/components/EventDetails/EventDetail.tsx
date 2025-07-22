import { useEffect, useState } from 'react';
import { Box, Drawer, Stepper, Step, StepLabel, Typography, IconButton, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Import step components
import GeneralInfo from './Steps/GeneralInfo';
import VenueDetails from './Steps/VenueDetails/VenueDetails';
import Calendar from './Steps/Calendar';
import InvitationTypes from './Steps/InvitationTypes';
import Bundles from './Steps/Bundles';
import Contacts from './Steps/Contacts';
import Template from './Steps/Template';
import Analytics from './Steps/Analytics';
import Artists from './Steps/Artists';
import Invitations from './Steps/Invitations';
import AccessControlAnalytics from './Steps/AccessControlAnalytics';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';
import ZonesManagement from './Steps/ZonesManagement';

const steps = [
  'General Information',
  'Venue Information',
  'Date & Time',
  'Artists/Performers',
  'Invitation Types',
  'Sponsor Bundles',
  'Guest Management',
  'Email Template',
  'Invitations',
  'Zones Management',
  'Analytics',
  'Access Analytics',
];

const drawerWidth = 340;

export const EventDetail = () => {
  const { id } = useParams();
  const { setSelectedEventId } = useEvents();
  const isNewEvent = !id;
  const [activeStep, setActiveStep] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    if (id) {
    // Decode the ID back to its original format
    const decodedId = atob(id);
    setSelectedEventId(decodedId);
  } else {
    setSelectedEventId('');
  }
  }, [id]);

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)`,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}>
        {/* Toggle Drawer Button */}
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: 'fixed',
            right: drawerOpen ? drawerWidth : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'background.paper',
            borderRadius: '50% 0 0 50%',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}>
          {drawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>

        {/* Content based on active step will be rendered here */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            m: 2,
            bgcolor: 'background.paper',
            minHeight: 'calc(100vh - 32px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            {isNewEvent ? 'Create New Event' : 'Manage Event'} - {steps[activeStep]}
          </Typography>

          {/* Render step content */}
          {activeStep === 0 && <GeneralInfo />}
          {activeStep === 1 && <VenueDetails />}
          {activeStep === 2 && <Calendar />}
          {activeStep === 3 && <Artists />}
          {activeStep === 4 && <InvitationTypes />}
          {activeStep === 5 && <Bundles />}
          {activeStep === 6 && <Contacts />}
          {activeStep === 7 && <Template />}
          {activeStep === 8 && <Invitations />}
          {activeStep === 9 && <ZonesManagement />}
          {activeStep === 10 && <Analytics />}
          {activeStep === 11 && <AccessControlAnalytics />}
        </Paper>
      </Box>

      {/* Stepper Drawer */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'background.paper',
          },
        }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Event Setup Progress
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label} onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Drawer>
    </Box>
  );
};

export default EventDetail;
