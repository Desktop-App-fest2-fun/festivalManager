import EventItem from 'Frontend/generated/fun/fest2/event/EventItem';
import { EventDates } from './Core';

export interface Invitation extends EventItem {
  eventId: string;
  operation: string; // "e.g. invitation#INV001"
  data: {
    invitationTemplate: InvitationTemplate;
    eventDetails: EventDetails;
    invitationContact: InvitationContact;
    invitationQrData: InvitationQrData;
    invitationDates: EventDates;
    invitationData: InvitationData;
    invitationHtmlEmail: InvitationHtmlEmail;
    invitationStatus: InvitationStatusData;
    invitationCode: string;
  };
}

export type InvitationStatus = 'CREATED' | 'SENT' | 'APPROVED' | 'REVOKED';

export interface InvitationTemplate {
  templateId: string;
  cuostomFields: Record<string, any>;
}

export interface EventDetails {
  venue: string;
  country: string;
  endDate: string;
  city: string;
  websiteUrl: string;
  name: string;
  description: string;
  eventDates: EventDates;
  startDate: string;
  logoUrl: string;
}
export interface InvitationContact {
  invitationType: string;
  name: string;
  email: string;
}

export interface InvitationQrData {
  qrContent: string;
  qrImageUrlS3: string;
  qrURI: string;
  qrId: string;
}

export interface InvitationData {
  uploadBy: string;
  invitationType: string;
  uploadTimestamp: string;
  uploadType: string;
  bundle: string;
}

export interface InvitationHtmlEmail {
  emailHtmlUrlS3: string;
  emailHtmlURI: string;
  emailHtmlUrlS3Id: string;
}

export interface InvitationStatusData {
  currentStatus: InvitationStatus;
  lastModificationTimestamp: string;
  CREATED?: {
    createdSource: string;
    createdTimestamp: string;
    createdBy: string;
    statusCreated: boolean;
  };
  APPROVED?: {
    approvedSource: string;
    approvedTimestamp: string;
    approvedBy: string;
    approvedCreated: boolean;
  };
  REVOKED?: {
    revokedSource: string;
    revokedTimestamp: string;
    revokedBy: string;
    revokedCreated: boolean;
  };
  SENT?:{
    sentTiestamp: string;
    sentBy: string;
    sentStatus: boolean;
  }
}
