import { TextField, Grid, Typography, Autocomplete, Chip } from '@mui/material';
import useDebounce from 'Frontend/middleware/hooks/useDebounce';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

export interface VenueDetailsFormData {
  venue: string;
  city: string;
  address: string;
}

interface VenueDetailsFormProps {
  venueData: VenueDetailsFormData;
  setVenueData: React.Dispatch<React.SetStateAction<VenueDetailsFormData>>;
}

export const VenueDetailsForm: React.FC<VenueDetailsFormProps> = ({ venueData, setVenueData }) => {
  const { selectedEventHook } = useEvents();
  const { updateVenueData } = selectedEventHook;

  const debouncedUpdate = useDebounce((updateData: VenueDetailsFormData) => {
    updateVenueData(updateData);
  }, 1000);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = {
      ...venueData,
      [name]: value,
    };
    debouncedUpdate(updatedData);
    setVenueData(updatedData);
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
          Venue Details
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          value={venueData.venue}
          fullWidth
          label="Venue Name"
          variant="outlined"
          required
          onChange={handleOnChange}
          name="venue"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          value={venueData.city}
          fullWidth
          label="City"
          variant="outlined"
          type="text"
          required
          onChange={handleOnChange}
          name="city"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          value={venueData.address}
          fullWidth
          label="Address"
          variant="outlined"
          required
          multiline
          rows={2}
          onChange={handleOnChange}
          name="address"
        />
      </Grid>
    </>
  );
};

export default VenueDetailsForm;
