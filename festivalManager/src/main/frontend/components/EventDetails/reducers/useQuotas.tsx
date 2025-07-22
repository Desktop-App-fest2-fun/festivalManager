import { useReducer, useEffect, useRef, useCallback } from 'react';
import { quotaReducer, QuotaState, QUOTA_ACTIONS } from './quotaReducer';
import { Quota } from 'Frontend/model/EventItemModel/Core';
import useDebounce from 'Frontend/middleware/hooks/useDebounce';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';

const defaultQuotas: Quota[] = [
  {
    invitationType: 'GENERAL',
    quotaQuantity: 0,
    color: '#2196f3',
    description: 'Standard admission',
  },
  {
    invitationType: 'VIP',
    quotaQuantity: 0,
    color: '#f50057',
    description: 'VIP access and benefits',
  },
  {
    invitationType: 'COMPROMIS',
    quotaQuantity: 0,
    color: '#9c27b0',
    description: 'Reserved for partners',
  },
  {
    invitationType: 'BACKSTAGE',
    quotaQuantity: 0,
    color: '#ff9800',
    description: 'Backstage access',
  },
];

const initialQuotaState: QuotaState = {
  quotas: defaultQuotas,
  totalInvitations: 0,
  remainingInvitations: 0,
  lastAction: null,
};

export const useQuotas = () => {
  const [quotaState, dispatch] = useReducer(quotaReducer, initialQuotaState);
  const { selectedEventHook } = useEvents();
  const { getSelectedEventCore, updateCoreQuotes } = selectedEventHook;
  const prevQuotaStateRef = useRef<string>('');

  // Function to add a new quota
  const addNewQuota = useCallback((newQuota: Quota) => {
    dispatch({
      type: QUOTA_ACTIONS.NEW_QUOTA,
      payload: newQuota,
    });
  }, []);

  // Function to change the total number of invitations
  const changeTotalInvitations = useCallback((total: number) => {
    dispatch({
      type: QUOTA_ACTIONS.TOTAL_CHANGE,
      payload: total,
    });
  }, []);

  // Function to delete a quota by invitation type 
  const deleteQuota = useCallback((invitationType: string) => {
    dispatch({
      type: QUOTA_ACTIONS.DELETE_QUOTA,
      payload: invitationType,
    });
  }, []);

  // Function to change the quantity of a specific quota
  const changeQuotaQuantity = useCallback((invitationType: string, quantity: number) => {
    dispatch({
      type: QUOTA_ACTIONS.CHANGE_QUOTA_QTY,
      payload: {
        invitationType,
        quantity,
      },
    });
  }, []);

  // Function to initialize the quotas state
  const initializeQuotas = useCallback((quotaData: QuotaState) => {
    dispatch({
      type: QUOTA_ACTIONS.INITIALIZE,
      payload: quotaData,
    });
  }, []);

  // Initialize the state when the component mounts
  useEffect(() => {
    const fetchAndInitializeQuotas = async () => {
      const eventCore = await getSelectedEventCore();
      if (eventCore) {
        const totalInvitations = eventCore.data.coreQuotes.invitationsLimits || 0;

        // Convert coreQuotes object to array of Quota objects
        const quotas = Object.values(eventCore.data.coreQuotes.quotes || {});

        // Calculate remaining invitations
        const unallocatedQuota = totalInvitations - quotas.reduce((sum, quota) => sum + quota.quotaQuantity, 0);

        initializeQuotas({
          quotas: quotas.length > 0 ? quotas : defaultQuotas,
          totalInvitations: totalInvitations,
          remainingInvitations: unallocatedQuota,
          lastAction: null,
        });
      }
    };

    fetchAndInitializeQuotas();
  }, [getSelectedEventCore, initializeQuotas]);

  // Debounce function to handle API updates
  const bouncedUpdate = useDebounce((quotaState: QuotaState) => {
    updateCoreQuotes(quotaState);
  }, 1000);

  // Prepare serialized state for comparison
  const getSerializedState = useCallback((state: QuotaState) => {
    return JSON.stringify({
      totalInvitations: state.totalInvitations,
      quotas: state.quotas.map((q) => ({
        invitationType: q.invitationType,
        quotaQuantity: q.quotaQuantity,
      })),
    });
  }, []);

  // Update the server when the state changes
  useEffect(() => {
    if (!quotaState || quotaState.lastAction?.type === QUOTA_ACTIONS.INITIALIZE) return;

    // Only update if the state has meaningfully changed
    const quotaStateString = getSerializedState(quotaState);

    if (quotaStateString !== prevQuotaStateRef.current) {
      prevQuotaStateRef.current = quotaStateString;
      bouncedUpdate(quotaState);
    }
  }, [quotaState, bouncedUpdate, getSerializedState]);

  const returnValue = {
    quotaState,
    addNewQuota,
    changeTotalInvitations,
    deleteQuota,
    changeQuotaQuantity,
    initializeQuotas,
  };

  return returnValue;
};

export default useQuotas;
