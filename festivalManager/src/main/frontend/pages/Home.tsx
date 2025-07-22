import { Box, Container, Typography, Button, Grid } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Home = () => {

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #60a5fa 0%, #e879f9 100%)',
          py: 12,
          borderRadius: '0 0 30px 30px',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill=\'%23FFFFFF\' d=\'M41.9,-70.1C54.9,-62.8,66.2,-52.5,74.6,-39.4C83,-26.2,88.5,-10.1,87.2,5.7C85.8,21.4,77.6,36.8,66.5,48.5C55.4,60.2,41.4,68.3,26.3,73.6C11.2,78.9,-5,81.5,-20.2,77.9C-35.3,74.4,-49.4,64.7,-61.8,52.4C-74.2,40.1,-84.9,25.2,-87.5,8.6C-90.2,-8,-84.8,-26.3,-74.9,-40.7C-65,-55.1,-50.6,-65.6,-36,-71.8C-21.3,-78,-10.7,-79.9,2.1,-83.3C14.8,-86.7,29.,-77.5,41.9,-70.1Z\' transform=\'translate(100 100)\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right -100px top -100px',
            backgroundSize: '600px 600px',
            opacity: 0.1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill=\'%23FFFFFF\' d=\'M45.7,-77.8C58.9,-69.3,69.2,-55.7,76.6,-40.7C84,-25.7,88.5,-9.2,87.2,7.4C85.9,24.1,78.8,40.9,67.8,53.5C56.8,66,41.9,74.2,26.2,78.8C10.5,83.4,-6,84.3,-21.1,80.1C-36.2,75.9,-49.9,66.7,-61.4,54.6C-72.9,42.5,-82.2,27.6,-85.1,11.3C-88,-5,-84.5,-22.7,-76.6,-37.5C-68.8,-52.3,-56.5,-64.2,-42.5,-72.3C-28.4,-80.4,-12.7,-84.7,2.4,-88.5C17.5,-92.3,35,-86.4,45.7,-77.8Z\' transform=\'translate(100 100)\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'left -50px bottom -50px',
            backgroundSize: '400px 400px',
            opacity: 0.1,
          }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Smart Event Invitations
            </Typography>
            <Typography
              variant="h5"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                mb: 4, 
                maxWidth: '800px', 
                mx: 'auto',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              Send beautiful invitations and manage event access effortlessly with QR codes.
              Perfect for both personal celebrations and corporate events.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<EmailIcon />}
                sx={{
                  borderRadius: '50px',
                  px: 4,
                  background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
                  },
                }}
              >
                Start Sending Invitations
              </Button>
              <Button
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  borderRadius: '50px',
                  px: 4,
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  '&:hover': {
                    borderColor: '#1d4ed8',
                    backgroundColor: 'rgba(37, 99, 235, 0.04)',
                  },
                }}
              >
                Login
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* QR Code Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography
              variant="h3"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              Transform Your Events with QR Code Magic
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 0, maxWidth: '800px', mx: 'auto' }}>
              Seamlessly blend traditional invitations with digital convenience. Transform your event management with smart QR codes.
            </Typography>
          </Box>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ pr: { md: 6 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <QRFeature
                    icon={<QrCodeIcon />}
                    title="Smart Paper Invitations"
                    description="Add QR codes to your paper invitations for instant digital access via smartphone."
                  />
                  <QRFeature
                    icon={<CheckCircleOutlineIcon />}
                    title="Instant Check-in"
                    description="Streamline event entry with quick QR code scans. No more manual guest list checking."
                  />
                  <QRFeature
                    icon={<PhoneIphoneIcon />}
                    title="Mobile-Optimized Experience"
                    description="Guests can view event details, RSVP, and access tickets through their mobile devices."
                  />
                  <QRFeature
                    icon={<AnalyticsIcon />}
                    title="Real-time Analytics"
                    description="Track RSVPs and check-ins in real-time. Get instant insights about your event attendance."
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 300,
                  margin: '0 auto',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, #60a5fa 30%, #e879f9 90%)',
                    borderRadius: '40px',
                    filter: 'blur(40px)',
                    opacity: 0.3,
                    zIndex: 0,
                  }
                }}
              >
                {/* Phone Frame */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    bgcolor: '#1a1a1a',
                    borderRadius: '40px',
                    p: 2,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '150px',
                      height: '25px',
                      bgcolor: '#1a1a1a',
                      borderRadius: '0 0 20px 20px',
                      zIndex: 2,
                    }
                  }}
                >
                  {/* Phone Screen */}
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '32px',
                      overflow: 'hidden',
                      position: 'relative',
                      pt: '188%', // 9:16 aspect ratio plus some extra for the header
                    }}
                  >
                    {/* App Content */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {/* App Header */}
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pb: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          mb: 3,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Invite2Me
                        </Typography>
                      </Box>
                      
                      {/* QR Code */}
                      <Box
                        component="img"
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://invite2me.app/event/tech-conference-2025"
                        alt="QR Code"
                        sx={{
                          width: '80%',
                          height: 'auto',
                          mb: 2,
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                        }}
                      />
                      
                      {/* Event Details */}
                      <Typography variant="h6" align="center" sx={{ fontSize: '0.9rem', mb: 1 }}>
                        Tech Conference 2025
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Scan to Join
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: 700,
            mb: 6,
            background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            width: '100%',
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          Everything You Need for Perfect Events
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          <FeatureCard
            title="Email Invitations"
            description="Create and send personalized email invitations to your guests with just a few clicks."
          />
          <FeatureCard
            title="QR Code Access"
            description="Generate unique QR codes for each guest to ensure secure and efficient event access."
          />
          <FeatureCard
            title="Event Management"
            description="Track RSVPs, manage guest lists, and monitor event attendance in real-time."
          />
        </Box>
      </Container>
    </Box>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <Box
    sx={{
      p: 4,
      borderRadius: 4,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
    }}
  >
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

const QRFeature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box
      sx={{
        color: 'primary.main',
        display: 'flex',
        alignItems: 'flex-start',
        '& .MuiSvgIcon-root': {
          fontSize: 24,
        },
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>
  </Box>
);

export default Home;
