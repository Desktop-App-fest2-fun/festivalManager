import EventItem from 'Frontend/generated/fun/fest2/event/EventItem';

export interface Core extends EventItem {
  eventId: string;
  operation: 'core';
  data: {
    coreData: CoreData;
    coreQuotes: {
      invitationsLimits: number; // maximum number of invitations for this event
      quotes: QuotaData; // e.g. { VIP: { invitationType: VIP, quotaQuantity: 100, color: "#FF0000", description: "VIP Access" } }
    };
    coreStatus: {
      status: EventStatus;
    };
    // Dates in ISO 8601 format
    coreEventDates: EventDates; // e.g. { day#01: "2025-06-01T12:00:00", day#02: "2025-06-02T12:00:00" }
  };
}

export type EventStatus = 'UPCOMING' | 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'ARCHIVED';

export interface CoreData {
  generalData: GeneralData;
  venueData: VenueData;
  modifiedBy: string;
  createdBy: string;
  endDate: string;
  startDate: string;
}

export interface GeneralData {
  eventName: string;
  eventCode: string;
  description: string;
  type: string;
  edition: string;
  yearEdition: string;
  websiteUrl: string;
  logoUrl: string;
  previewImageUrl: string;
  phone: string;
  tags: TagsType // e.g. { music : "music", "festival": "festival", "concert": "concert" }
}

export type TagsType = { [tag: string]: string };
export interface VenueData {
  venueName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

interface Zone {
  zoneName: string;
  subZones?: Zone[];
}

export type EventDates = { [dayNumber: string] : string };

export type QuotaData = { [quotaType: string]: Quota };

export interface Quota {
  invitationType: string; // e.g. "VIP", "Backstage"
  quotaQuantity: number; // allocated quota to this type of invitation
  color: string; // color in hexadecimal
  description: string;
}

export const emptyEventData: Core = {
  eventId: '',
  operation: 'core',
  data: {
    coreData: {
      generalData: {
        eventName: 'NEW EVENT',
        eventCode: '',
        description: '',
        type: 'CONCERT',
        edition: '',
        yearEdition: "2025",
        websiteUrl: '',
        logoUrl: '',
        previewImageUrl: '',
        phone: '',
        tags: {}
      },
      venueData: {
        venueName: '',
        address: '',
        city: '',
        country: 'Spain',
        postalCode: '',
      },
      modifiedBy: 'editor',
      createdBy: 'admin',
      startDate: '',
      endDate: '',
    },
    coreQuotes: {
      invitationsLimits: 0,
      quotes: {},
    },
    coreStatus: {
      status: 'DRAFT',
    },
    coreEventDates: {},
  },
};
