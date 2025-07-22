/* Bundles operation (all bundles) , do not confuse with Bundle */
import { BundleData, BundleStatus } from "./Bundle";
import { defaultBundle } from "./Bundle";
export interface Bundles {
  eventId: string;
  operation: "bundles";
  data: {
    bundlesData: {
      /* key = Bundle operation, e.g. bundle#01#cocacola */
      [key: string]: {
        bundleData: BundleData;
        quotas: Record<string, any>
        statusCode: BundleStatus;
      };
    };
    bundlesMetadata: BundleMetadata;
  };
}

interface BundleMetadata {
  totalInvitations: number;
  sentInvitations: number;
  acceptedInvitations: number;
  totalBundles: number;
  totalAssignedQuotas: number; // summation of all assigned quotas per bundle
}

export const defaultBundles: Bundles = {
  eventId: "",
  operation: "bundles",
  data: {
    bundlesData: {
      /* key = Bundle operation, e.g. bundle#01#cocacola */
      "bundle#00#fasttrack": {
        bundleData: defaultBundle.data.bundleData,
        quotas: defaultBundle.data.bundleQuotes,
        statusCode: defaultBundle.data.bundleStatus.status,
      },
    },
    bundlesMetadata: {
      totalInvitations: 0,
      sentInvitations: 0,
      acceptedInvitations: 0,
      totalBundles: 1,
      totalAssignedQuotas: 0,
    },
  },
};
