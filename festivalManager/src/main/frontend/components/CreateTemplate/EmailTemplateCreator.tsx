import React, { useReducer } from 'react';
import { Box } from '@mui/material';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';
import ActionBar from './ActionBar';
import languages from './email-default-languages.json';
import { reducer, initialState, Language } from './templateReducer';

// Memoize child components to prevent unnecessary re-renders
const EditorPanelMemo = React.memo(EditorPanel);
const PreviewPanelMemo = React.memo(PreviewPanel);
const ActionBarMemo = React.memo(ActionBar);

interface EmailTemplateCreatorProps {
  onClose: () => void;
}

const EmailTemplateCreator: React.FC<EmailTemplateCreatorProps> = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const defaultFields = [
    'logoUrl',
    'header',
    'contactName',
    'contactEmail',
    'contactPhone',
    'qrInstruction',
    'eventName',
    'eventDate',
    'eventLocation',
    'eventDescription',
    'footerText1',
    'footerText2',
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '25%',
          overflowY: 'auto',
          height: '100%',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <EditorPanelMemo
          fields={state.fields}
          visibility={state.visibility}
          customFields={state.customFields}
          defaultFields={defaultFields}
          language={state.language}
          translations={languages.languages}
          onInputChange={(field: string, value: string) =>
            dispatch({ type: 'UPDATE_FIELD', field, value })
          }
          onToggleVisibility={(field: string) =>
            dispatch({ type: 'TOGGLE_VISIBILITY', field })
          }
        />
      </Box>

      <Box
        sx={{
          width: '50%',
          overflow: 'hidden',
          height: '100%',
          bgcolor: 'background.default',
        }}
      >
        <PreviewPanelMemo
          fields={state.fields}
          visibility={state.visibility}
          customFields={state.customFields}
          defaultFields={defaultFields}
          language={state.language}
          translations={languages.languages}
        />
      </Box>

      <Box
        sx={{
          width: '25%',
          height: '100%',
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ActionBarMemo
          templateName={state.templateName}
          createdAt={state.createdAt}
          showAddFieldForm={state.showAddFieldForm}
          defaultFields={defaultFields}
          language={state.language}
          onAddCustomField={(name, placeholder, position) =>
            dispatch({ type: 'ADD_CUSTOM_FIELD', name, placeholder, position })
          }
          onToggleAddFieldForm={() => dispatch({ type: 'TOGGLE_ADD_FIELD_FORM' })}
          onSetTemplateName={(name) => dispatch({ type: 'SET_TEMPLATE_NAME', name })}
          onSave={() => console.log('Save:', state)}
          onReset={() => dispatch({ type: 'RESET_TEMPLATE' })}
          onDownloadJson={() => {
            const json = JSON.stringify(state, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.templateName || 'template'}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onSetLanguage={(language: Language) => dispatch({ type: 'SET_LANGUAGE', language })} // Explicitly type as Language
        />
      </Box>
    </Box>
  );
};

export default EmailTemplateCreator;