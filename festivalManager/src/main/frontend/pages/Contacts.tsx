import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Button,
  Container
} from '@mui/material';
import contactsData from '../data/contacts.json'; // Adjust path as needed
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tag: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  type: 'PERSONAL' | 'BUSINESS' | 'FAMILY' | 'FRIEND' | 'OTHER';
  company: string | null;
  jobTitle: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  socialUrls: string[];
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  // Assert the type of contactsData to match Contact[]
  const contacts = contactsData as Contact[];

  // Generate avatar initials from name
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const handleCreateContact = () => {
    navigate('/contacts/');
  };

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
              }}
            >
              Your Events
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateContact}
              sx={{
                borderRadius: '50px',
                background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
                },
              }}
            >
              Create New Event
            </Button>
          </Box>
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
              <TableCell>
              <Avatar
                sx={{
                  background: getAvatarGradient(contact.id).gradient,
                  '&:hover': {
                    background: getAvatarGradient(contact.id).hover,
                  },
                }}
              >
                {getInitials(contact.name)}
              </Avatar>
              </TableCell>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell>{contact.type}</TableCell>
            </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
   
      </Container>
    </Box>
  );
};

export default Contacts;


// Define gradient styles as a reusable object
const avatarGradients = [
  {
    gradient: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)', // Blue theme from templates
    hover: 'linear-gradient(45deg, #1d4ed8 30%, #4338ca 90%)',
  },
  {
    gradient: 'linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)', // Purple theme from templates
    hover: 'linear-gradient(45deg, #4338ca 30%, #6d28d9 90%)',
  },
  {
    gradient: 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)', // Blue to purple mix
    hover: 'linear-gradient(45deg, #1d4ed8 30%, #6d28d9 90%)',
  },
  {
    gradient: 'linear-gradient(45deg, #4f46e5 30%, #2563eb 90%)', // Reverse blue-purple
    hover: 'linear-gradient(45deg, #4338ca 30%, #1d4ed8 90%)',
  },
  {
    gradient: 'linear-gradient(45deg, #7c3aed 30%, #2563eb 90%)', // Purple to blue
    hover: 'linear-gradient(45deg, #6d28d9 30%, #1d4ed8 90%)',
  },
];

// Function to get gradient based on contact ID or name (for consistent assignment)
const getAvatarGradient = (id: string) => {
  const index = Math.abs(id.toString().charCodeAt(0)) % 5; // Simple hash to pick gradient
  return avatarGradients[index];
};