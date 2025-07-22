import defaultTexts from './default-texts.json';

export type Language = 'english' | 'spanish' | 'catalan';

export interface CustomField {
  name: string;
  placeholder: string;
  position: string;
}

export interface State {
  templateName: string;
  createdAt: string;
  fields: { [key: string]: string };
  visibility: { [key: string]: boolean };
  customFields: CustomField[];
  showAddFieldForm: boolean;
  language: Language;
}

export type Action =
  | { type: 'SET_TEMPLATE_NAME'; name: string }
  | { type: 'UPDATE_FIELD'; field: string; value: string }
  | { type: 'TOGGLE_VISIBILITY'; field: string }
  | { type: 'ADD_CUSTOM_FIELD'; name: string; placeholder: string; position: string }
  | { type: 'TOGGLE_ADD_FIELD_FORM' }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'RESET_TEMPLATE' };

export const initialState: State = {
  templateName: 'Untitled Template',
  createdAt: new Date().toISOString(),
  fields: { ...defaultTexts.english },
  visibility: {
    logoUrl: true,
    header: true,
    contactName: true,
    contactEmail: true,
    contactPhone: true,
    qrInstruction: true,
    eventName: true,
    eventDate: true,
    eventLocation: true,
    eventDescription: true,
    footerText1: true,
    footerText2: true,
  },
  customFields: [],
  showAddFieldForm: false,
  language: 'english',
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.name };
    case 'UPDATE_FIELD':
      return { ...state, fields: { ...state.fields, [action.field]: action.value } };
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        visibility: { ...state.visibility, [action.field]: !state.visibility[action.field] },
      };
    case 'ADD_CUSTOM_FIELD':
      return {
        ...state,
        customFields: [
          ...state.customFields,
          { name: action.name, placeholder: action.placeholder, position: action.position },
        ],
        fields: { ...state.fields, [action.name]: action.placeholder },
        visibility: { ...state.visibility, [action.name]: true },
        showAddFieldForm: false,
      };
    case 'TOGGLE_ADD_FIELD_FORM':
      return { ...state, showAddFieldForm: !state.showAddFieldForm };
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.language,
        fields: { ...state.fields, ...defaultTexts[action.language] },
      };
    case 'RESET_TEMPLATE':
      return { ...initialState, createdAt: new Date().toISOString() };
    default:
      return state;
  }
};