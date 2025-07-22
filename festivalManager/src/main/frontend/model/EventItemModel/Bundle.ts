import EventItem from 'Frontend/generated/fun/fest2/event/EventItem';
import { EventDates } from './Core';

/* Bundle operation (individual), do not confuse with Bundles */
export interface Bundle extends EventItem {
  eventId: string;
  operation: string; // "e.g. bundle#01#cocacola"
  contacts: Contact[];
  data: {
    bundleData: BundleData; // e.g. { "VIP": 100, "BACKSTAGE": 50 }
    // bundleDates: BundleDates;
    bundleDates: EventDates; // e.g. { "day#01": "2025-06-01T12:00:00", "day#02": "2025-06-02T12:00:00" }
    bundleQuotes: BundleQuota; // e.g. { "BACKSTAGE": 100 }
    bundleStatus: {
      status: BundleStatus;
    };
    bundleContact: {
      sponsorName: string;
      email: string;
    }
  };
  invitations: Invitation[];
  //gsiPK: 'BUNDLES';
}

export type BundleStatus = 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'ARCHIVED';

export type BundleQuota = { [invitationType: string]: number };

export interface Contact extends Record<string, unknown> {
  invitationType: string; // e.g. "VIP", "Backstage"
  uploadTimestamp: string;
  invitationDates: EventDates; // e.g. { "day#01": "2025-06-01T12:00:00", "day#02": "2025-06-02T12:00:00" }
  name: string;
  uploadType: string; // e.g. "BY-CSV"
  phone: string;
  email: string;
  bundle: string; // e.g. "bundle#00#fasttrack"
}

export interface Invitation extends Record<string, string> {
  invitationSortKey: string; // e.g. "invitation#INV0004"
}
export interface BundleData {
  stateCountsByType: {
    [invitationType: string]: {
      CREATED: number;
      NONE: number;
    };
  };
  accepted: number;
  sent: number;
  totalInvitations: number;
}

// export interface BundleDates {
//   invitationDatesQty: number;
//   eventDatesQty: number;
//   [dateKey: string]: string | number; // e.g. "day#01": "2025-05-29T12:00:00"
// }

export const defaultBundle: Bundle = {
  eventId: '',
  operation: 'bundle#00#fasttrack',
  contacts: [],
  data: {
    bundleData: {
      stateCountsByType: {},
      accepted: 0,
      sent: 0,
      totalInvitations: 0,
    },
    // bundleDates: {
    //   invitationDatesQty: 0,
    //   eventDatesQty: 0,
    // },
    bundleDates: {},
    bundleQuotes: {},
    bundleStatus: {
      status: 'DRAFT',
    },
    bundleContact: {
      sponsorName: '',
      email: '',
    },
  },
  invitations: [],
  //gsiPK: 'BUNDLES',
};
