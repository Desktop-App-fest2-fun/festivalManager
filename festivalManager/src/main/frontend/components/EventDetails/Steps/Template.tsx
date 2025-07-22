import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import EditIcon from '@mui/icons-material/Edit';

interface EmailTemplate {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  tags: string[];
}

const sampleTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Modern Minimal',
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
    description: 'Clean and modern design with emphasis on typography and whitespace',
    tags: ['minimal', 'modern', 'professional'],
  },
  {
    id: '2',
    name: 'Event Spotlight',
    thumbnail: 'https://images.unsplash.com/photo-1561488111-5d800fd56b8a?w=800&auto=format&fit=crop',
    description: 'Bold design featuring large event imagery and clear call-to-actions',
    tags: ['bold', 'colorful', 'featured'],
  },
  {
    id: '3',
    name: 'Corporate Classic',
    thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop',
    description: 'Professional template suitable for corporate events and conferences',
    tags: ['corporate', 'professional', 'classic'],
  },
  {
    id: '4',
    name: 'Creative Arts',
    thumbnail: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&auto=format&fit=crop',
    description: 'Artistic template perfect for cultural and creative events',
    tags: ['creative', 'artistic', 'colorful'],
  },
];

export const Template = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizations, setCustomizations] = useState({
    subject: '',
    headerText: '',
    bodyText: '',
  });

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleCustomize = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomizeOpen(true);
  };

  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Choose Email Template
      </Typography>
      
      <Grid container spacing={3}>
        {sampleTemplates.map((template) => (
          <Grid item xs={12} key={template.id}>
            <Card 
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                height: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              {/* Left side - Image */}
              <Box sx={{ 
                position: 'relative',
                width: { xs: '100%', sm: '280px' },
                minHeight: { xs: '180px', sm: 'auto' },
                bgcolor: 'grey.50',
                alignSelf: 'stretch',
                display: 'flex'
              }}>
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    flexGrow: 1
                  }}
                  image={template.thumbnail}
                  alt={template.name}
                />
                {/* Overlay with category badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    borderRadius: '12px',
                    px: 1.5,
                    py: 0.5,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {template.tags[0]}
                  </Typography>
                </Box>
              </Box>

              {/* Right side - Content */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                p: 0
              }}>
                <CardContent sx={{ 
                  flex: '1 0 auto',
                  p: 3,
                  '&:last-child': { pb: 3 }
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    {template.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      lineHeight: 1.6
                    }}
                  >
                    {template.description}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    mb: 2
                  }}>
                    {template.tags.slice(1).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderRadius: '8px',
                          borderColor: 'primary.light',
                          color: 'primary.main',
                          bgcolor: 'primary.50',
                          textTransform: 'capitalize',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ 
                    display: 'flex',
                    gap: 2,
                    mt: 'auto'
                  }}>
                    <Button
                      startIcon={<PreviewIcon />}
                      onClick={() => handlePreview(template)}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        px: 2,
                        borderColor: 'grey.300',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleCustomize(template)}
                      size="small"
                      variant="contained"
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        px: 2,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: 'primary.dark'
                        }
                      }}
                    >
                      Customize
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <img
              src={selectedTemplate?.thumbnail}
              alt={selectedTemplate?.name}
              style={{ width: '100%', height: 'auto' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewOpen(false);
              if (selectedTemplate) handleCustomize(selectedTemplate);
            }}
          >
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customize Dialog */}
      <Dialog
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Customize Template: {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Subject"
                value={customizations.subject}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  subject: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Header Text"
                value={customizations.headerText}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  headerText: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Email Body"
                value={customizations.bodyText}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  bodyText: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomizeOpen(false)}>Cancel</Button>
          <Button variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Template;
