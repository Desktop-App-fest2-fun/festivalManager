import React, { ChangeEvent } from 'react';
import { Box, Typography, TextField, Select, MenuItem, Button, SelectChangeEvent } from '@mui/material';
import AddFieldModal from './AddFieldModal';
import { Language } from './templateReducer'; // Import Language type

interface ActionBarProps {
  templateName: string;
  createdAt: string;
  showAddFieldForm: boolean;
  defaultFields: string[];
  language: string; // Keep as string for Select's value prop
  onAddCustomField: (name: string, placeholder: string, position: string) => void;
  onToggleAddFieldForm: () => void;
  onSetTemplateName: (name: string) => void;
  onSave: () => void;
  onReset: () => void;
  onDownloadJson: () => void;
  onSetLanguage: (language: Language) => void; // Use Language type
}

const ActionBar: React.FC<ActionBarProps> = ({
  templateName,
  createdAt,
  showAddFieldForm,
  defaultFields,
  language,
  onAddCustomField,
  onToggleAddFieldForm,
  onSetTemplateName,
  onSave,
  onReset,
  onDownloadJson,
  onSetLanguage,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        gap: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Create Email Template
      </Typography>
      <TextField
        fullWidth
        value={templateName}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onSetTemplateName(e.target.value)}
        placeholder="Template Name"
        variant="outlined"
        size="small"
      />
      <Select
        fullWidth
        value={language}
        onChange={(e: SelectChangeEvent<string>) =>
          onSetLanguage(e.target.value as Language) // Cast to Language
        }
        variant="outlined"
        size="small"
      >
        <MenuItem value="english">English</MenuItem>
        <MenuItem value="spanish">Spanish</MenuItem>
        <MenuItem value="catalan">Catalan</MenuItem>
      </Select>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Created: {new Date(createdAt).toLocaleString()}
      </Typography>
      <Button fullWidth variant="outlined" onClick={onToggleAddFieldForm}>
        Add Custom Field
      </Button>
      <Button fullWidth variant="outlined" onClick={onDownloadJson}>
        Download JSON
      </Button>
      <Button fullWidth variant="contained" onClick={onSave}>
        Save
      </Button>
      <Button fullWidth variant="outlined" onClick={onReset}>
        Reset
      </Button>

      {showAddFieldForm && (
        <AddFieldModal
          open={showAddFieldForm}
          onAdd={onAddCustomField}
          onClose={onToggleAddFieldForm}
          defaultFields={defaultFields}
        />
      )}
    </Box>
  );
};

export default ActionBar;