import { Quota } from '../../../model/EventItemModel/Core';

// State interface
export interface QuotaState {
  quotas: Quota[];
  totalInvitations: number;
  remainingInvitations: number; // Invitations left to allocate
  lastAction: QuotaAction | null; // Track the last action
}

// Action types
export const QUOTA_ACTIONS = {
  NEW_QUOTA: 'NEW_QUOTA',
  TOTAL_CHANGE: 'TOTAL_CHANGE',
  DELETE_QUOTA: 'DELETE_QUOTA',
  CHANGE_QUOTA_QTY: 'CHANGE_QUOTA_QTY',
  INITIALIZE: 'INITIALIZE',
} as const;

// Action interfaces
export interface NewQuotaAction {
  type: typeof QUOTA_ACTIONS.NEW_QUOTA;
  payload: Quota;
}

export interface TotalChangeAction {
  type: typeof QUOTA_ACTIONS.TOTAL_CHANGE;
  payload: number;
}

export interface DeleteQuotaAction {
  type: typeof QUOTA_ACTIONS.DELETE_QUOTA;
  payload: string; // invitationType
}

export interface ChangeQuotaQtyAction {
  type: typeof QUOTA_ACTIONS.CHANGE_QUOTA_QTY;
  payload: {
    invitationType: string;
    quantity: number;
  };
}

export interface InitializeAction {
  type: typeof QUOTA_ACTIONS.INITIALIZE;
  payload: QuotaState;
}

export type QuotaAction =
  | NewQuotaAction
  | TotalChangeAction
  | DeleteQuotaAction
  | ChangeQuotaQtyAction
  | InitializeAction;

// Helper function to calculate remaining invitations
const calculateRemainingInvitations = (totalInvitations: number, quotas: Quota[]): number => {
  const allocatedInvitations = quotas.reduce((sum, quota) => sum + quota.quotaQuantity, 0);
  return totalInvitations - allocatedInvitations;
};

// Reducer function
export const quotaReducer = (state: QuotaState, action: QuotaAction): QuotaState => {
  switch (action.type) {
    case QUOTA_ACTIONS.INITIALIZE: {
      return {
        ...action.payload,
        lastAction: action,
      };
    }

    case QUOTA_ACTIONS.NEW_QUOTA: {
      const updatedQuotas = [...state.quotas, action.payload];
      return {
        ...state,
        quotas: updatedQuotas,
        remainingInvitations: calculateRemainingInvitations(state.totalInvitations, updatedQuotas),
        lastAction: action,
      };
    }

    case QUOTA_ACTIONS.TOTAL_CHANGE: {
      return {
        ...state,
        totalInvitations: action.payload,
        remainingInvitations: calculateRemainingInvitations(action.payload, state.quotas),
        lastAction: action,
      };
    }

    case QUOTA_ACTIONS.DELETE_QUOTA: {
      const updatedQuotas = state.quotas.filter((quota) => quota.invitationType !== action.payload);
      return {
        ...state,
        quotas: updatedQuotas,
        remainingInvitations: calculateRemainingInvitations(state.totalInvitations, updatedQuotas),
        lastAction: action,
      };
    }

    case QUOTA_ACTIONS.CHANGE_QUOTA_QTY: {
      const updatedQuotas = state.quotas.map((quota) =>
        quota.invitationType === action.payload.invitationType
          ? { ...quota, quotaQuantity: action.payload.quantity }
          : quota
      );
      return {
        ...state,
        quotas: updatedQuotas,
        remainingInvitations: calculateRemainingInvitations(state.totalInvitations, updatedQuotas),
        lastAction: action,
      };
    }

    default:
      return state;
  }
};
