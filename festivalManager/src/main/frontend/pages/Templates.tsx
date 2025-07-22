import { useState } from 'react';
import { Box, Container, Typography, Paper, Button, Grid, Dialog, DialogContent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmailTemplateCreator from '../components/CreateTemplate/EmailTemplateCreator';

// Import template images
import corporateImg from '../assets/templates/corporate.svg';
import birthdayImg from '../assets/templates/birthday.svg';
import weddingImg from '../assets/templates/wedding.svg';
import conferenceImg from '../assets/templates/conference.svg';
import workshopImg from '../assets/templates/workshop.svg';
import graduationImg from '../assets/templates/graduation.svg';

const Templates = () => {
  const [createOpen, setCreateOpen] = useState(false);

  // Debug re-renders (optional, remove in production)
  console.log('Templates rendered, createOpen:', createOpen);

  return (
    <Box>
      <Container maxWidth="md">
        <Box sx={{ py: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Invitation Templates
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                setCreateOpen(true);
              }}
              sx={{
                borderRadius: '50px',
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
                },
              }}
            >
              Create Template
            </Button>
          </Box>

          <Grid container spacing={3}>
            {templates.map((template, index) => (
              <Grid item xs={12} key={index}>
                <TemplateCard {...template} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Create Template Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
             <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create New Template
            </Typography>
            <Button
              onClick={() => setCreateOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: '50px',
                borderColor: '#2563eb',
                color: '#2563eb',
                '&:hover': {
                  borderColor: '#1d4ed8',
                  color: '#1d4ed8',
                  background: 'rgba(37, 99, 235, 0.1)',
                },
              }}
              size="small"
            >
              Back to Templates
            </Button>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <EmailTemplateCreator onClose={() => setCreateOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

interface TemplateCardProps {
  title: string;
  category: string;
  preview: string;
  image?: string;
}

const TemplateCard = ({ title, category, preview, image }: TemplateCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg width="200" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${title}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${title})"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">
        ${title.split(' ')[0]}
      </text>
    </svg>`
  )}`;

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        height: '140px',
        backgroundColor: '#ffffff',
        maxWidth: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          width: { xs: '120px', sm: '180px' },
          minWidth: { xs: '120px', sm: '180px' },
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageError ? fallbackImage : (image || fallbackImage)}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={handleImageError}
        />
      </Box>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.75, fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {preview}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 }}
        >
          {category}
        </Typography>
      </Box>
    </Paper>
  );
};

const templates = [
  {
    title: 'Corporate Event',
    category: 'Business',
    preview: 'Professional design for corporate events with modern layout and branding options',
    image: corporateImg,
  },
  {
    title: 'Birthday Party',
    category: 'Personal',
    preview: 'Colorful and fun birthday invitation with customizable themes and RSVP tracking',
    image: birthdayImg,
  },
  {
    title: 'Wedding',
    category: 'Personal',
    preview: 'Elegant wedding invitation design with guest management and digital RSVP',
    image: weddingImg,
  },
  {
    title: 'Conference',
    category: 'Business',
    preview: 'Clean and modern conference template with agenda and speaker highlights',
    image: conferenceImg,
  },
  {
    title: 'Workshop',
    category: 'Business',
    preview: 'Interactive workshop invitation with session details and materials access',
    image: workshopImg,
  },
  {
    title: 'Graduation',
    category: 'Personal',
    preview: 'Celebratory graduation template with photo gallery and achievement showcase',
    image: graduationImg,
  },
];

export default Templates;