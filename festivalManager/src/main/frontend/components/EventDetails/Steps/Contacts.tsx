import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import ShareIcon from '@mui/icons-material/Share';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';
import { Contact } from 'Frontend/model/EventItemModel/Bundle';

interface ContactData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  quotaType: string;
  sponsorBundle?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface BundleSelect {
  value: string;
  label: string;
}

export const Contacts = () => {
  const { bundlesHook, addContactsAndInvitations } = useEvents();
  const { getEventBundles, getEventBundleContacts, getBundleAvailableDates } = bundlesHook;
  const [contacts, setContacts] = useState<ContactData[]>([]);

  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [bundlesSelect, setBundlesSelect] = useState<BundleSelect[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentContact, setCurrentContact] = useState<ContactData | null>(null);

  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotaTypes = ['GENERAL', 'VIP', 'COMPROMIS', 'BACKSTAGE'];

  const handleOpenDialog = (contact?: ContactData) => {
    if (contact) {
      setCurrentContact(contact);
    } else {
      setCurrentContact({
        id: Date.now().toString(),
        name: '',
        email: '',
        phone: '',
        quotaType: 'GENERAL',
      });
    }
    setOpenDialog(true);
  };

  const createInvitations = async (updaptedContacts: ContactData[]) => {
    if (!selectedBundle) {
      setSnackbar({
        open: true,
        message: 'Please select a bundle before uploading contacts',
        severity: 'error',
      });
      return;
    }
    const invitationsContacts: Contact[] = updaptedContacts.map((contact) => ({
      name: contact.name,
      email: contact.email,
      invitationType: contact.quotaType,
      invitationDates: getBundleAvailableDates(selectedBundle),
      bundle: selectedBundle,
      phone: contact.phone || '',
      uploadTimestamp: new Date().toISOString(),
      uploadType: 'BY-CSV',
    }));
    const result = await addContactsAndInvitations(invitationsContacts);
  };

  const createInvitation = async (contact: ContactData) => {
    if (!selectedBundle) {
      setSnackbar({
        open: true,
        message: 'Please select a bundle before uploading contacts',
        severity: 'error',
      });
      return;
    }
    const invitationContact: Contact = {
      name: contact.name,
      email: contact.email,
      invitationType: contact.quotaType,
      invitationDates: getBundleAvailableDates(selectedBundle),
      bundle: selectedBundle,
      phone: contact.phone || '',
      uploadTimestamp: new Date().toISOString(),
      uploadType: 'MANUAL',
    };
    const result = await addContactsAndInvitations([invitationContact]);
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const eventContacts = getEventBundleContacts();
        console.info('Contacts fetched successfully', eventContacts);

        // Map the API response to the Contact type used in the component
        const mappedContacts: ContactData[] = eventContacts.map((contact: any) => ({
          id: `${contact.email}-${Date.now()}${Math.random()}`,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || '',
          quotaType: contact.invitationType,
          sponsorBundle: contact.bundle,
        }));

        setContacts(mappedContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    const fetchBundles = async () => {
      try {
        const currentBundles = await getEventBundles();
        if (currentBundles) {
          const formattedBundles: BundleSelect[] = currentBundles.map((bundle) => ({
            value: bundle.operation,
            label: bundle.data.bundleContact.sponsorName || bundle.operation,
          }));
          setBundlesSelect(formattedBundles);

          // Set the first bundle as selected by default if there are bundles available
          if (formattedBundles.length > 0 && !selectedBundle) {
            setSelectedBundle(formattedBundles[0].value);
          }
        }
      } catch (error) {
        console.error('Error fetching bundles:', error);
      }
    };

    fetchBundles();
    fetchContacts();
  }, [getEventBundles, getEventBundleContacts]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentContact(null);
  };
  const handleSaveContact = async () => {
    if (currentContact) {
      if (contacts.find((c) => c.id === currentContact.id)) {
        const updatedContacts = contacts.map((c) => (c.id === currentContact.id ? currentContact : c));
        setContacts(updatedContacts);
        await createInvitation(currentContact);
      } else {
        const updatedContacts = [...contacts, currentContact];
        setContacts(updatedContacts);
        await createInvitation(currentContact);
      }
      setSnackbar({
        open: true,
        message: 'Contact saved successfully',
        severity: 'success',
      });
    }
    handleCloseDialog();
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    setSnackbar({
      open: true,
      message: 'Contact deleted successfully',
      severity: 'success',
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n');
          const headers = rows[0].split(';');

          const firstNameIndex = headers.findIndex((h) => h.toLowerCase().includes('firstname'));
          const lastNameIndex = headers.findIndex((h) => h.toLowerCase().includes('lastname'));
          const emailIndex = headers.findIndex((h) => h.toLowerCase().includes('email'));

          const newContacts: ContactData[] = rows
            .slice(1)
            .map((row) => {
              const columns = row.split(';');
              const firstName = columns[firstNameIndex]?.trim() || '';
              const lastName = columns[lastNameIndex]?.trim() || '';

              return {
                id: Date.now().toString() + Math.random(),
                name: `${firstName} ${lastName}`.trim(),
                email: columns[emailIndex]?.trim() || '',
                phone: '', // Always blank as requested
                quotaType: 'GENERAL', // Default value
              };
            })
            .filter((contact) => contact.name && contact.email);

          setContacts([...contacts, ...newContacts]);
          await createInvitations(newContacts);
          setSnackbar({
            open: true,
            message: `Successfully imported ${newContacts.length} contacts`,
            severity: 'success',
          });
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Error processing CSV file',
            severity: 'error',
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSendSponsorLink = () => {
    // Implement sponsor link sharing functionality
    setSnackbar({
      open: true,
      message: 'Sponsor link sent successfully',
      severity: 'success',
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {/* Bundle Selection */}
        <TextField
          select
          helperText="Select a Bundle"
          value={selectedBundle || ''}
          onChange={(e) => setSelectedBundle(e.target.value)}
          sx={{ width: 300 }}
          SelectProps={{
            native: true,
          }}>
          <option value="" disabled>
            Select a bundle
          </option>
          {bundlesSelect.map((bundle) => (
            <option key={bundle.value} value={bundle.value}>
              {bundle.label}
            </option>
          ))}
        </TextField>
      </Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Contact List" />
          <Tab label="Import Contacts" />
          <Tab label="Sponsor Access" />
        </Tabs>
        {/* Contacts Table */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Contacts</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Contact
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.quotaType}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(contact)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteContact(contact.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        {/* Import Contacts from CSV*/}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Import Contacts from CSV
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Upload a CSV file with columns for name, email, and phone (optional)
            </Typography>
            <input type="file" accept=".csv" hidden ref={fileInputRef} onChange={handleFileUpload} />
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              Upload CSV File
            </Button>
          </Box>
        </TabPanel>
        {/* Sponsor Link */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Sponsor Access Management
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Generate and share access links for sponsors to manage their guest lists
            </Typography>
            <Button variant="contained" startIcon={<ShareIcon />} onClick={handleSendSponsorLink}>
              Send Sponsor Access Link
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentContact?.name ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={currentContact?.name || ''}
                onChange={(e) =>
                  setCurrentContact((curr) =>
                    curr
                      ? {
                          ...curr,
                          name: e.target.value,
                        }
                      : null
                  )
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={currentContact?.email || ''}
                onChange={(e) =>
                  setCurrentContact((curr) =>
                    curr
                      ? {
                          ...curr,
                          email: e.target.value,
                        }
                      : null
                  )
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={currentContact?.phone || ''}
                onChange={(e) =>
                  setCurrentContact((curr) =>
                    curr
                      ? {
                          ...curr,
                          phone: e.target.value,
                        }
                      : null
                  )
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Quota Type"
                value={currentContact?.quotaType || 'GENERAL'}
                onChange={(e) =>
                  setCurrentContact((curr) =>
                    curr
                      ? {
                          ...curr,
                          quotaType: e.target.value,
                        }
                      : null
                  )
                }
                SelectProps={{
                  native: true,
                }}>
                {quotaTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveContact} variant="contained">
            Save Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Contacts;
