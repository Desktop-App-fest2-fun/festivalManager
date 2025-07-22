import { useEffect, useState } from 'react';
import { Box, TextField, Grid, Typography, Button, Autocomplete, Chip } from '@mui/material';
import useDebounce from 'Frontend/middleware/hooks/useDebounce';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

export interface GeneralInfoForm {
  eventCode: string;
  eventName: string;
  tags: string[];
}

export const GeneralInfo = () => {
  const { selectedEventHook, selectedEventId } = useEvents();
  const { getSelectedEventCore, updateGeneralData } = selectedEventHook;

  const [generalInfoForm, setGeneralInfoForm] = useState<GeneralInfoForm>({
    eventCode: '',
    eventName: '',
    tags: [],
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventCore = async () => {
      const eventCore = await getSelectedEventCore();
      if (eventCore) {
        setGeneralInfoForm({
          eventCode: eventCore.data.coreData.generalData.eventCode,
          eventName: eventCore.data.coreData.generalData.eventName,
          tags: Object.keys(eventCore.data.coreData.generalData.tags || []),
        });
      } else {
        setGeneralInfoForm({
          eventCode: '',
          eventName: '',
          tags: [],
        });
      }
    };

    if (selectedEventId) {
      fetchEventCore();
    }
  }, [selectedEventId]);

  const debouncedUpdate = useDebounce((updatedData: GeneralInfoForm) => {
    updateGeneralData(updatedData);
  }, 1000);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = {
      ...generalInfoForm,
      [name]: value,
    };
    setGeneralInfoForm(updatedData);
    debouncedUpdate(updatedData);
  };

  const handleOnChangeTags = (newValue: string[], field: string) => {
    const updatedTags = {
      ...generalInfoForm,
      [field]: newValue,
    };
    setGeneralInfoForm(updatedTags);
    updateGeneralData(updatedTags);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off">
      <Grid container spacing={3}>
        {/* Event Basic Info */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            value={generalInfoForm.eventCode}
            fullWidth
            label="Event Code"
            variant="outlined"
            required
            onChange={handleOnChange}
            name="eventCode"
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            value={generalInfoForm.eventName}
            fullWidth
            label="Event Name"
            variant="outlined"
            required
            onChange={handleOnChange}
            name="eventName"
          />
        </Grid>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={[]}
            freeSolo
            value={generalInfoForm.tags}
            onChange={(_e, newValue) => handleOnChangeTags(newValue, 'tags')}
            renderTags={(value: string[], getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  sx={{
                    bgcolor: '#7799CC',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                  key={option}
                  label={option}
                />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Tags" variant="outlined" placeholder="Add tags" />}
          />
        </Grid>

        {/* Event Logo Upload */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
            Event Logo
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button variant="outlined" component="label" sx={{ mt: 1 }}>
              Upload Logo
              <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
            </Button>

            {/* Logo Preview */}
            {logoPreview && (
              <Box
                sx={{
                  mt: 1,
                  width: 100,
                  height: 100,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <img
                  src={logoPreview}
                  alt="Event Logo Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralInfo;
