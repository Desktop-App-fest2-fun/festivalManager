import { Quota } from '../../../model/EventItemModel/Core';

// Bundle interface
export interface AssignedQuota {
  invitationType: string; // e.g. "VIP", "Backstage"
  assignedQuotaQty: number; // allocated quota to this type of invitation
  color: string; // color in hexadecimal
}
export interface StepperBundle {
  id: string;
  sponsorName: string;
  email: string;
  assignedQuotas: AssignedQuota[];
  totalInvitations: number;
  assignedDates: string[];
}

export interface AvailableQuota extends Quota {
  assignedQuotas: number; // allocated quota to this type of invitation
}

export interface BundlesReducerState {
  bundles: StepperBundle[];
  availableQuotas: AvailableQuota[];
  lastAction: BundleAction | null; // Track last action
}

// Action types
export const BUNDLE_ACTIONS = {
  INITIALIZE_STATE: 'INITIALIZE_STATE',
  CREATE_BUNDLE: 'CREATE_BUNDLE',
  UPDATE_BUNDLE: 'UPDATE_BUNDLE',
  DELETE_BUNDLE: 'DELETE_BUNDLE',
  UPDATE_AVAILABLE_QUOTAS: 'UPDATE_AVAILABLE_QUOTAS',
} as const;

// Action interfaces
export interface InitializeStateAction {
  type: typeof BUNDLE_ACTIONS.INITIALIZE_STATE;
  payload: {
    availableQuotas: AvailableQuota[];
    bundles?: StepperBundle[];
  };
}

export interface CreateBundleAction {
  type: typeof BUNDLE_ACTIONS.CREATE_BUNDLE;
  payload: StepperBundle;
}

export interface UpdateBundleAction {
  type: typeof BUNDLE_ACTIONS.UPDATE_BUNDLE;
  payload: StepperBundle;
}

export interface DeleteBundleAction {
  type: typeof BUNDLE_ACTIONS.DELETE_BUNDLE;
  payload: string; // bundle id
}

export type BundleAction = InitializeStateAction | CreateBundleAction | UpdateBundleAction | DeleteBundleAction;

// Helper function to update available quotas
const updateAvailableQuotas = (
  availableQuotas: AvailableQuota[],
  oldBundle: StepperBundle | null,
  newBundle: StepperBundle | null
): AvailableQuota[] => {
  const result = [...availableQuotas];

  // Remove old allocations
  if (oldBundle) {
    oldBundle.assignedQuotas.forEach((quota, index) => {
      if (index < result.length) {
        result[index] = {
          ...result[index],
          assignedQuotas: result[index].assignedQuotas - quota.assignedQuotaQty,
        };
      }
    });
  }

  // Add new allocations
  if (newBundle) {
    newBundle.assignedQuotas.forEach((quota, index) => {
      if (index < result.length) {
        result[index] = {
          ...result[index],
          assignedQuotas: result[index].assignedQuotas + quota.assignedQuotaQty,
        };
      }
    });
  }

  return result;
};

// Reducer function
export const bundleReducer = (state: BundlesReducerState, action: BundleAction): BundlesReducerState => {
  switch (action.type) {
    case BUNDLE_ACTIONS.INITIALIZE_STATE: {
      return {
        ...state,
        availableQuotas: action.payload.availableQuotas,
        bundles: action.payload.bundles || [],
        lastAction: action,
      };
    }

    case BUNDLE_ACTIONS.CREATE_BUNDLE: {
      const newBundle = action.payload;

      const numberString = String(state.bundles.length + 1).padStart(3, '0');
      newBundle.id = `bundle#${numberString}#${newBundle.sponsorName.split(' ').join('').toLocaleLowerCase().trim()}`;

      const updatedAvailableQuotas = updateAvailableQuotas(state.availableQuotas, null, newBundle);

      return {
        ...state,
        bundles: [...state.bundles, newBundle],
        availableQuotas: updatedAvailableQuotas,
        lastAction: action,
      };
    }

    case BUNDLE_ACTIONS.UPDATE_BUNDLE: {
      const bundleToUpdate = action.payload;

      // Make sure we're updating an existing bundle
      if (!state.bundles.some((b) => b.id === bundleToUpdate.id)) {
        return state;
      }

      // Find the old bundle to update quotas
      const oldBundle = state.bundles.find((b) => b.id === bundleToUpdate.id);

      // Update available quotas
      const updatedAvailableQuotas = updateAvailableQuotas(state.availableQuotas, oldBundle || null, bundleToUpdate);

      return {
        ...state,
        bundles: state.bundles.map((b) => (b.id === bundleToUpdate.id ? bundleToUpdate : b)),
        availableQuotas: updatedAvailableQuotas,
        lastAction: action,
      };
    }

    case BUNDLE_ACTIONS.DELETE_BUNDLE: {
      const bundleToDelete = state.bundles.find((b) => b.id === action.payload);
      if (!bundleToDelete) return state;

      // Update available quotas when deleting a bundle
      const updatedAvailableQuotas = updateAvailableQuotas(state.availableQuotas, bundleToDelete, null);

      return {
        ...state,
        bundles: state.bundles.filter((b) => b.id !== action.payload),
        availableQuotas: updatedAvailableQuotas,
        lastAction: action,
      };
    }

    default:
      return state;
  }
};
