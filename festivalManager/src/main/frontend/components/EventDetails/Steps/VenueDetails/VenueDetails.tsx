import { Box, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { VenueDetailsForm } from './VenueDetailsForm';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

interface VenueData {
  venue: string;
  city: string;
  address: string;
}

export const VenueDetails = () => {
  const { selectedEventHook } = useEvents();
  const { getSelectedEventCore } = selectedEventHook;

  const [venueDataForm, setVenueDataForm] = useState<VenueData>({
    venue: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    const fetchEventCore = async () => {
      const eventCore = await getSelectedEventCore();
      if (eventCore) {
        setVenueDataForm({
          venue: eventCore.data.coreData.venueData.venueName,
          city: eventCore.data.coreData.venueData.city,
          address: eventCore.data.coreData.venueData.address,
        });
      } else {
        setVenueDataForm({
          venue: '',
          city: '',
          address: '',
        });
      }
    };
    fetchEventCore();
  }, []);

  return (
    <Box component="form" noValidate autoComplete="off">
      <Grid container spacing={3}>
        <VenueDetailsForm venueData={venueDataForm} setVenueData={setVenueDataForm} />
      </Grid>
    </Box>
  );
};

export default VenueDetails;
