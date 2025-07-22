import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Checkbox,
  CircularProgress,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { useEffect, useState } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import { InvitationStatus } from 'Frontend/model/EventItemModel/Invitation';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

interface InvitationData {
  name: string;
  email: string;
  bundle: string;
  codeInvitation: string;
  statusCode: InvitationStatus;
  templateId: string;
  qrId: string;
  qrUrl: string;
  emailHtmlUrl: string;
  operation: string;
}

const InvitationAnalytics: React.FC = () => {
  const { invitationsHook } = useEvents();
  const { getEventInvitations, updateInvitationStatus, sendEventInvitations } = invitationsHook;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set()); // Store operations as unique identifiers for invitations
  const [invitationData, setInvitationData] = useState<InvitationData[]>([]);
  const [statusChangeValue, setStatusChangeValue] = useState<InvitationStatus>('CREATED');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');


  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      try {
        const invitations = await getEventInvitations();
        if (!invitations || invitations.length === 0) {
          console.info('No invitations found for this event.');
          setInvitationData([]);
          return;
        }
        console.info('Fetched invitations:', invitations);

        // Map the API data to the format needed for the component
        const mappedInvitations: InvitationData[] = invitations.map((invitation) => ({
          name: invitation.data.invitationContact.name,
          email: invitation.data.invitationContact.email,
          bundle: invitation.data.invitationData.bundle || 'bundle#00#unknown',
          codeInvitation: invitation.data.invitationCode,
          statusCode: invitation.data.invitationStatus.currentStatus,
          templateId: invitation.data.invitationTemplate.templateId,
          qrId: invitation.data.invitationQrData.qrId,
          qrUrl: invitation.data.invitationQrData.qrImageUrlS3,
          emailHtmlUrl: invitation.data.invitationHtmlEmail.emailHtmlUrlS3,
          operation: invitation.operation,
        }));

        setInvitationData(mappedInvitations);
      } catch (error) {
        setInvitationData([]);
        console.error('Error fetching invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  // Extract unique bundles from the data for filtering
  const bundles = Array.from(new Set(invitationData.map((inv) => inv.bundle)))
    .filter((bundle) => bundle) // Filter out empty bundles
    .sort();

  const handleToggleBundle = (bundle: string) => {
    setSelectedBundles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bundle)) {
        newSet.delete(bundle);
      } else {
        newSet.add(bundle);
      }
      setPage(0); // Reset to first page on filter change
      return newSet;
    });
  };

  const handleSelectInvitation = (operation: string) => {
    setSelectedInvitations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(operation)) {
        newSet.delete(operation);
      } else {
        newSet.add(operation);
      }
      return newSet;
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const visibleInvitations = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    setSelectedInvitations((prev) => {
      const newSet = new Set(prev);
      visibleInvitations.forEach((inv) => {
        if (event.target.checked) {
          newSet.add(inv.operation);
        } else {
          newSet.delete(inv.operation);
        }
      });
      return newSet;
    });
  };

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSendInvitations = async () => {
    if (selectedInvitations.size === 0) return;

    setSending(true);
    try {
      await sendEventInvitations(Array.from(selectedInvitations));

      setSnackbarMessage(`Successfully sent ${selectedInvitations.size} invitation(s)`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Update the local state to reflect the change immediately
      const updatedInvitationData: InvitationData[] = invitationData.map((invitation) => {
        if (selectedInvitations.has(invitation.operation)) {
          return { ...invitation, statusCode: 'SENT' };
        }
        return invitation;
      });
      setInvitationData(updatedInvitationData);
      setSelectedInvitations(new Set()); // Clear selections after sending
    } catch (error) {
      console.error('Error sending invitations:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (event: SelectChangeEvent<InvitationStatus>) => {
    const newStatus = event.target.value as InvitationStatus;
    // temporary solution to not update when status selected is CREATED AND SENT
    if (newStatus === 'SENT' || newStatus === 'CREATED') {
      console.warn('Status change to SENT or CREATED is not allowed.');
      return;
    }
    setStatusChangeValue(newStatus);

    // Only proceed if we have selections
    if (selectedInvitations.size === 0) return;

    // Update the status on the server
    setStatusUpdating(true);
    try {
      await updateInvitationStatus(Array.from(selectedInvitations), newStatus);
      // Update the local state to reflect the change immediately
      const updatedInvitationData = invitationData.map((invitation) => {
        if (selectedInvitations.has(invitation.operation)) {
          return { ...invitation, statusCode: newStatus };
        }
        return invitation;
      });

      setInvitationData(updatedInvitationData);
      // Show success message
      setSnackbarMessage(`Successfully updated ${selectedInvitations.size} invitation(s) to ${newStatus}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating invitation status:', error);
      // Show error message
      setSnackbarMessage('Failed to update invitation status. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const filteredData =
    selectedBundles.size === 0 ? invitationData : invitationData.filter((inv) => selectedBundles.has(inv.bundle));

  const isAllSelected =
    filteredData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .every((inv) => selectedInvitations.has(inv.operation)) &&
    filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length > 0;

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invitation Analytics
        </Typography>

        {loading ? (
          <>
            {/* Loading skeleton for bundle filters */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rectangular" width={100} height={36} />
              ))}
            </Box>

            {/* Loading skeleton for table */}
            <TableContainer>
              <Table aria-label="invitation analytics table loading">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" width={50}></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Bundle</TableCell>
                    <TableCell>Invitation Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell>QR ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={24} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={60} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={80} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={120} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Loading skeleton for pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Skeleton variant="rectangular" width={300} height={40} />
            </Box>
          </>
        ) : (
          <>
            {/* Bundle Filter Buttons */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {bundles.map((bundle) => (
                <Button
                  key={bundle}
                  variant={selectedBundles.has(bundle) ? 'contained' : 'outlined'}
                  onClick={() => handleToggleBundle(bundle)}
                  sx={{ textTransform: 'none' }}
                  aria-pressed={selectedBundles.has(bundle)}>
                  {bundle.split('#')[2] || bundle}
                </Button>
              ))}
            </Box>
            <TableContainer>
              <Table aria-label="invitation analytics table">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        indeterminate={
                          selectedInvitations.size > 0 &&
                          !isAllSelected &&
                          filteredData
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .some((inv) => selectedInvitations.has(inv.operation))
                        }
                        disabled={filteredData.length === 0}
                        aria-label="select all visible invitations"
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Bundle</TableCell>
                    <TableCell>Invitation Code</TableCell>
                    <TableCell>
                      {selectedInvitations.size > 0 ? (
                        <FormControl size="small" fullWidth variant="outlined" sx={{ minWidth: 120 }}>
                          <Select
                            value={statusChangeValue}
                            onChange={handleStatusChange}
                            disabled={statusUpdating}
                            displayEmpty
                            renderValue={(value) => value || 'Status'}
                            inputProps={{ 'aria-label': 'invitation status' }}>
                            <MenuItem value="SENT">SENT</MenuItem>
                            <MenuItem value="CREATED">CREATED</MenuItem>
                            <MenuItem value="APPROVED">APPROVE</MenuItem>
                            <MenuItem value="REVOKED">REVOKE</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        'Status'
                      )}
                    </TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell>QR ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        No invitations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invitation) => (
                      <TableRow key={invitation.codeInvitation}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedInvitations.has(invitation.operation)}
                            onChange={() => handleSelectInvitation(invitation.operation)}
                            aria-label={`select invitation ${invitation.operation}`}
                          />
                        </TableCell>
                        <TableCell>{invitation.name}</TableCell>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{invitation.bundle}</TableCell>
                        <TableCell>{invitation.codeInvitation}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor:
                                invitation.statusCode === 'SENT'
                                  ? 'primary.light'
                                  : invitation.statusCode === 'APPROVED'
                                  ? 'success.light'
                                  : invitation.statusCode === 'REVOKED'
                                  ? 'error.light'
                                  : 'grey.300',
                              color:
                                invitation.statusCode === 'SENT'
                                  ? 'primary.contrastText'
                                  : invitation.statusCode === 'APPROVED'
                                  ? 'success.contrastText'
                                  : invitation.statusCode === 'REVOKED'
                                  ? 'error.contrastText'
                                  : 'text.primary',
                            }}>
                            {invitation.statusCode}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <a href={invitation.emailHtmlUrl} target="_blank" rel="noopener noreferrer">
                            {invitation.templateId}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a href={invitation.qrUrl} target="_blank" rel="noopener noreferrer">
                            {invitation.qrId}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Send Invitations Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
          onClick={handleSendInvitations}
          disabled={sending || selectedInvitations.size === 0 || loading}
          sx={{ px: 4, py: 1.5 }}>
          {sending
            ? 'Sending...'
            : `Send ${selectedInvitations.size} Checked Invitation${selectedInvitations.size !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {/* Status update notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvitationAnalytics;
