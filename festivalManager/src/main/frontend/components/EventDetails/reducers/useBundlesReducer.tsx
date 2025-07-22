import { useReducer, useEffect, useCallback, useState } from 'react';
import { bundleReducer, BundlesReducerState, BUNDLE_ACTIONS, AvailableQuota, StepperBundle } from './bundleReducer';
import { useEvents } from 'Frontend/middleware/hooks/useEvents';
import { Quota } from 'Frontend/model/EventItemModel/Core';

// Initial state for the reducer
const initialBundleState: BundlesReducerState = {
  bundles: [],
  availableQuotas: [],
  lastAction: null, // Track last action
};

export const useBundlesReducer = () => {
  const [bundleState, dispatch] = useReducer(bundleReducer, initialBundleState);
  const { selectedEventHook, bundlesHook } = useEvents();
  const { getSelectedEventCore } = selectedEventHook;
  const { getEventBundles, updateEventBundle, createEventBundle } = bundlesHook;
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Initialize bundles state
  const initializeBundles = useCallback((availableQuotas: AvailableQuota[], bundles?: StepperBundle[]) => {
    dispatch({
      type: BUNDLE_ACTIONS.INITIALIZE_STATE,
      payload: { availableQuotas, bundles },
    });
  }, []);

  // Create a new bundle with the provided bundle object
  const createBundle = useCallback((bundle: StepperBundle) => {
    dispatch({
      type: BUNDLE_ACTIONS.CREATE_BUNDLE,
      payload: bundle,
    });
  }, []);

  // Update an existing bundle with the provided bundle object
  const updateBundle = useCallback((bundle: StepperBundle) => {
    dispatch({
      type: BUNDLE_ACTIONS.UPDATE_BUNDLE,
      payload: bundle,
    });
  }, []);

  // Delete a bundle by ID
  const deleteBundle = useCallback((id: string) => {
    dispatch({
      type: BUNDLE_ACTIONS.DELETE_BUNDLE,
      payload: id,
    });
  }, []);

  // Initialize the state when the component mounts
  useEffect(() => {
    const fetchAndInitializeBundles = async () => {
      // Get available quotas
      const eventCore = await getSelectedEventCore();
      let quotas: Quota[] = [];
      if (eventCore) {
        quotas = Object.values(eventCore.data.coreQuotes.quotes || {});
        const eventDates = Object.values(eventCore.data.coreEventDates || {});
        setAvailableDates(eventDates);
      }

      //const bundlesData = await eventBundlesStorageApi.getEventBundles(eventId);
      const bundlesData = await getEventBundles();
      let bundles: StepperBundle[] = [];
      let sumOfAssignedQuotas = new Array<number>(quotas.length).fill(0);

      if (bundlesData) {
        bundlesData.forEach((bundle) => {
          const bundleQuotas = Object.values(bundle.data.bundleQuotes || {});
          const totalInvitations = bundleQuotas.reduce((acc, quota) => acc + (quota || 0), 0);
          const sponsorName = bundle.operation.split('#')[2];
          const id = bundle.operation;
          const email = 'No email provided'; // Placeholder for email
          const assignedQuotas = bundleQuotas.map((quota, index) => {
            sumOfAssignedQuotas[index] += quota || 0;
            return {
              invitationType: Object.keys(bundle.data.bundleQuotes || {})[index],
              assignedQuotaQty: quota,
              color: quotas[index]?.color || '#000000', // Default color if not found
            };
          });
          const assignedDates = Object.values(bundle.data.bundleDates || {});
          bundles.push({
            id: id,
            sponsorName: sponsorName,
            email: email,
            assignedQuotas: assignedQuotas,
            totalInvitations: totalInvitations,
            assignedDates: assignedDates,
          });
        });
        // Initialize state
        const stepperQuotas = quotas.map((quota, index) => ({
          ...quota,
          assignedQuotas: sumOfAssignedQuotas[index],
        }));

        dispatch({
          type: BUNDLE_ACTIONS.INITIALIZE_STATE,
          payload: { availableQuotas: stepperQuotas, bundles },
        });
      }
    };

    fetchAndInitializeBundles();
  }, [getSelectedEventCore, initializeBundles]);

  useEffect(() => {
    const sendUpdates = async () => {
      if (!bundleState || bundleState.lastAction?.type === BUNDLE_ACTIONS.INITIALIZE_STATE) return;

      switch (bundleState.lastAction?.type) {
        case BUNDLE_ACTIONS.CREATE_BUNDLE:
          console.info('Bundle created:', bundleState.lastAction);
          await createEventBundle(bundleState.lastAction.payload);
          break;
        case BUNDLE_ACTIONS.UPDATE_BUNDLE:
          console.info('Bundle updated:', bundleState.lastAction);
          await updateEventBundle(bundleState.lastAction.payload);
          break;
        case BUNDLE_ACTIONS.DELETE_BUNDLE:
          console.info('Bundle deleted:', bundleState.lastAction);
          break;
        default:
          break;
      }
    };

    sendUpdates();
  }, [bundleState]);

  return {
    bundleState,
    availableDates,
    createBundle,
    updateBundle,
    deleteBundle,
    initializeBundles,
  };
};

export default useBundlesReducer;
