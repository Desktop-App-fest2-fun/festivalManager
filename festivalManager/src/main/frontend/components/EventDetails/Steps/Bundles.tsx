import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import { StepperBundle, AssignedQuota, AvailableQuota } from '../reducers/bundleReducer';
import { useBundlesReducer } from '../reducers/useBundlesReducer';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

export const Bundles = () => {
  const { selectedEventId } = useEvents();
  // Use the custom hook for bundle state management
  const { bundleState, availableDates, createBundle, updateBundle, deleteBundle } = useBundlesReducer();
  // Local component state for Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  /* Dialog form state */
  const [currentBundle, setCurrentBundle] = useState<StepperBundle | null>(null);
  const [formAvailableQuotas, setFormAvailableQuotas] = useState<AvailableQuota[]>([]);

  // Calculate remaining quotas
  const totalRemainingQuotas = bundleState.availableQuotas.reduce(
    (acc, quota) => acc + (quota.quotaQuantity - quota.assignedQuotas),
    0
  );

  const handleOpenDialog = (bundle?: StepperBundle) => {
    const initialFormQuotas = [...bundleState.availableQuotas];
    setFormAvailableQuotas(initialFormQuotas);

    if (bundle) {
      // Edit existing bundle - create a copy to avoid direct mutation
      setCurrentBundle({ ...bundle });
      setIsEditMode(true);
    } else {
      // Create new bundle
      const newBundle: StepperBundle = {
        id: '',
        sponsorName: '',
        email: '',
        assignedQuotas: bundleState.availableQuotas.map((quota) => ({
          invitationType: quota.invitationType,
          color: quota.color,
          assignedQuotaQty: 0,
        })),
        totalInvitations: 0,
        assignedDates: [],
      };

      setCurrentBundle(newBundle);
      setIsEditMode(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentBundle(null);
    setFormAvailableQuotas([]);
  };

  const handleOnChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (currentBundle) {
      setCurrentBundle({
        ...currentBundle,
        [name]: value,
      });
    }
  };

  const handleOnChangeAssignedQuota = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    quota: AssignedQuota,
    index: number
  ) => {
    if (!currentBundle) return;

    const oldValue = currentBundle.assignedQuotas[index].assignedQuotaQty || 0;
    const newValue = parseInt(e.target.value) || 0;
    // Update the form's available quotas
    setFormAvailableQuotas((prevQuotas) =>
      prevQuotas.map((availableQuota, i) => {
        if (i === index) {
          return {
            ...availableQuota,
            assignedQuotas: availableQuota.assignedQuotas + (newValue - oldValue),
          };
        }
        return availableQuota;
      })
    );

    // Create a new array with the updated quota
    const updatedQuotas = [...currentBundle.assignedQuotas];
    updatedQuotas[index] = {
      ...quota,
      assignedQuotaQty: newValue,
    };

    // Calculate new total invitations
    const newTotalInvitations = updatedQuotas.reduce((sum, q) => sum + (q.assignedQuotaQty || 0), 0);

    setCurrentBundle({
      ...currentBundle,
      assignedQuotas: updatedQuotas,
      totalInvitations: newTotalInvitations,
    });
  };

  const handleAddDate = (date: string) => {
    if (!currentBundle) return;

    const updatedDates = [...currentBundle.assignedDates, date];
    updatedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    setCurrentBundle({
      ...currentBundle,
      assignedDates: updatedDates,
    });
  };

  const handleRemoveDate = (date: string) => {
    if (!currentBundle) return;

    const updatedDates = currentBundle.assignedDates.filter((d) => d !== date);
    setCurrentBundle({
      ...currentBundle,
      assignedDates: updatedDates,
    });
  };

  const handleSaveBundle = async () => {
    if (!currentBundle) return;

    if (isEditMode) {
      updateBundle(currentBundle);
    } else {
      createBundle(currentBundle);
    }
    setIsDialogOpen(false);
    setCurrentBundle(null);
    setFormAvailableQuotas([]);
  };

  const handleDeleteBundle = (id: string) => {
    deleteBundle(id);
  };

  const handleShareBundle = (bundle: StepperBundle) => {
    // Implement sharing functionality
    console.log('Share bundle with:', bundle.email);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}>
        <Typography variant="h6">Sponsor Bundles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Create Bundle
        </Button>
      </Box>
      <Typography variant="subtitle1" gutterBottom>
        Total Invitations Remaining: {totalRemainingQuotas}
      </Typography>

      <Grid container spacing={3}>
        {bundleState.bundles.map((bundle) => (
          <Grid item xs={12} md={6} key={bundle.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {bundle.sponsorName}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {bundle.email}
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bundle.assignedQuotas.map((quota) => (
                        <TableRow key={quota.invitationType}>
                          <TableCell>
                            <Chip
                              label={quota.invitationType}
                              sx={{
                                bgcolor: quota.color,
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{quota.assignedQuotaQty}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {bundle.totalInvitations}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Display assigned dates */}
                {bundle.assignedDates.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Assigned Dates:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {bundle.assignedDates.map((date) => (
                        <Chip
                          key={date}
                          label={new Date(date).toLocaleDateString()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleOpenDialog(bundle)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleShareBundle(bundle)} size="small">
                  <ShareIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteBundle(bundle.id)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Bundle Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Bundle' : 'Create New Bundle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="sponsorName"
                label="Sponsor Name"
                value={currentBundle?.sponsorName || ''}
                onChange={handleOnChangeTextField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="email"
                label="Sponsor Email"
                type="email"
                value={currentBundle?.email || ''}
                onChange={handleOnChangeTextField}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Quota Allocation
              </Typography>
              <Stack spacing={2}>
                {currentBundle?.assignedQuotas.map((quota, index) => (
                  <Box key={quota.invitationType} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip
                      label={quota.invitationType}
                      sx={{
                        bgcolor: quota.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    <TextField
                      type="number"
                      label="Quantity"
                      value={quota.assignedQuotaQty}
                      onChange={(e) => handleOnChangeAssignedQuota(e, quota, index)}
                      size="small"
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                    <Typography variant="body2">
                      Invitations remaining:{' '}
                      {formAvailableQuotas[index]?.quotaQuantity - formAvailableQuotas[index]?.assignedQuotas || 0}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* Date Selection Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Date Selection
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Selected dates: {currentBundle?.assignedDates.length || 0}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {currentBundle?.assignedDates.map((date) => (
                    <Chip
                      key={date}
                      label={new Date(date).toLocaleDateString()}
                      onDelete={() => handleRemoveDate(date)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Available dates:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableDates
                    .filter((date) => !currentBundle?.assignedDates.includes(date))
                    .map((date) => (
                      <Chip
                        key={date}
                        label={new Date(date).toLocaleDateString()}
                        onClick={() => handleAddDate(date)}
                        color="default"
                        variant="outlined"
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveBundle} variant="contained">
            Save Bundle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bundles;
