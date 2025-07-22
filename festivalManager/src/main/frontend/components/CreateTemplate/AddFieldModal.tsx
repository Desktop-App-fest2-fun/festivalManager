import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';

interface AddFieldModalProps {
  open: boolean;
  onAdd: (name: string, placeholder: string, position: string) => void; // Changed from onSubmit to onAdd
  onClose: () => void;
  defaultFields: string[] | undefined;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({
  open,
  onAdd,
  onClose,
  defaultFields = [],
}) => {
  const [fieldName, setFieldName] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [position, setPosition] = useState(defaultFields[0] || '');

  const handleSubmit = () => {
    if (fieldName && placeholder && position) {
      onAdd(fieldName, placeholder, position); // Use onAdd
      handleClose();
    }
  };

  const handleClose = () => {
    setFieldName('');
    setPlaceholder('');
    setPosition(defaultFields[0] || '');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Custom Field</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Field Name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="e.g., customMessage"
          />
          <TextField
            fullWidth
            label="Placeholder Text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="e.g., Enter your message here"
          />
          <FormControl fullWidth>
            <InputLabel>Position</InputLabel>
            <Select
              value={position}
              label="Position"
              onChange={(e) => setPosition(e.target.value)}
              disabled={defaultFields.length === 0}
            >
              {defaultFields.length > 0 ? (
                defaultFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    After {field}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No fields available
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!fieldName || !placeholder || !position}
        >
          Add Field
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFieldModal;