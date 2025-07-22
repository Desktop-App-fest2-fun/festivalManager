import { Bundle, BundleQuota, Contact, defaultBundle } from 'Frontend/model/EventItemModel/Bundle';
import { useCallback, useState } from 'react';
import { eventBundleService } from '../endpointService';
import { StepperBundle } from 'Frontend/components/EventDetails/reducers/bundleReducer';
import { EventDates } from 'Frontend/model/EventItemModel/Core';

export interface BundleHookResult {
  bundles: Bundle[];
  loading: boolean;
  error: string | null;
  getEventBundles: () => Promise<Bundle[]>;
  updateEventBundle: (bundleUpdateData: StepperBundle) => Promise<void>;
  createEventBundle: (newBundleData: StepperBundle) => Promise<void>;
  getEventBundleOperations: () => string[];
  getEventBundleContacts: () => Contact[];
  getBundleAvailableDates: (operation: string) => EventDates;
  updateBundleContacts: (contacts: Contact[]) => void;
}

const useEventBundles = (selectedEventId: string) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getEventBundles = useCallback(async () => {
    if (!selectedEventId) {
      throw new Error('No selected event ID');
    }
    setLoading(true);
    setError(null);

    // Return cached bundles if available and ID matches
    if (bundles.length > 0 && bundles[0].eventId === selectedEventId) {
      setLoading(false);
      return bundles;
    }

    try {
      const fetchedBundles = await eventBundleService.getAllEventBundles(selectedEventId);
      setBundles(fetchedBundles);
      return fetchedBundles;
    } catch (error) {
      setError('Error fetching bundles. Please try again later.');
      console.error('Error fetching bundles:', error);
      setBundles([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, bundles]);

  const updateEventBundle = useCallback(
    async (bundleUpdateData: StepperBundle) => {
      setLoading(true);
      setError(null);
      const currentBundle = bundles.find((bundle) => bundle.operation === bundleUpdateData.id);
      if (!currentBundle) {
        throw new Error('Bundle not found');
      }
      const updatedQuotas: BundleQuota = bundleUpdateData.assignedQuotas.reduce(
        (quota, item) => ({
          ...quota,
          [item.invitationType]: item.assignedQuotaQty,
        }),
        {}
      );

      const updatedDates: EventDates = bundleUpdateData.assignedDates.reduce(
        (dates, item, index) => ({
          ...dates,
          [`day#${String(index + 1).padStart(2, '0')}`]: item,
        }),
        {}
      );

      const updatedBundle: Bundle = {
        ...currentBundle,
        data: {
          ...currentBundle.data,
          bundleData: {
            ...currentBundle.data.bundleData,
            totalInvitations: bundleUpdateData.totalInvitations,
          },
          bundleQuotes: updatedQuotas,
          bundleDates: updatedDates,
          bundleContact: {
            sponsorName: bundleUpdateData.sponsorName,
            email: bundleUpdateData.email,
          },
        },
      };

      try {
        const savedBundle = await eventBundleService.updateEventBundle(updatedBundle);
        if (!savedBundle) {
          throw new Error('Failed to update bundle');
        }

        console.info('Bundle updated successfully:', savedBundle);
        setBundles((prevBundles) =>
          prevBundles.map((bundle) => (bundle.operation === updatedBundle.operation ? savedBundle : bundle))
        );
      } catch (error) {
        setError('Error updating bundle. Please try again later.');
        console.error('Error updating bundle:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [bundles]
  );

  const createEventBundle = useCallback(
    async (newBundleData: StepperBundle) => {
      setLoading(true);
      setError(null);

      const newQuotas: BundleQuota = newBundleData.assignedQuotas.reduce(
        (quota, item) => ({
          ...quota,
          [item.invitationType]: item.assignedQuotaQty,
        }),
        {}
      );

      const newDates: EventDates = newBundleData.assignedDates.reduce(
        (dates, item, index) => ({
          ...dates,
          [`day#${String(index + 1).padStart(2, '0')}`]: item,
        }),
        {}
      );

      const newBundle: Bundle = {
        ...defaultBundle,
        eventId: selectedEventId,
        operation: newBundleData.id,
        data: {
          ...defaultBundle.data,
          bundleData: {
            ...defaultBundle.data.bundleData,
            totalInvitations: newBundleData.totalInvitations,
          },
          bundleQuotes: newQuotas,
          bundleDates: newDates,
          bundleContact: {
            sponsorName: newBundleData.sponsorName,
            email: newBundleData.email,
          },
        },
      };

      try {
        const savedBundle = await eventBundleService.createNewEventBundle(newBundle);
        if (!savedBundle) {
          throw new Error('Failed to create new bundle');
        }

        console.info('New bundle created successfully:', savedBundle);
        setBundles((prevBundles) => [...prevBundles, savedBundle]);
      } catch (error) {
        setError('Error creating new bundle. Please try again later.');
        console.error('Error creating new bundle:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId, bundles]
  );

  const updateBundleContacts = useCallback(
    (contacts: Contact[]) => {
      setLoading(true);
      setError(null);

      if (contacts.length === 0) {
        setError('No contacts provided to update bundle');
        setLoading(false);
        return;
      }

      const operation = contacts[0].bundle;

      const currentBundle = bundles.find((bundle) => bundle.operation === operation);
      if (!currentBundle) {
        setError('Bundle not found');
        setLoading(false);
        return;
      }

      const updatedBundle: Bundle = {
        ...currentBundle,
        contacts: [...currentBundle.contacts, ...contacts],
      };

      eventBundleService.saveBundleContacts(updatedBundle);

      setBundles((prevBundles) =>
        prevBundles.map((bundle) => (bundle.operation === updatedBundle.operation ? updatedBundle : bundle))
      );
      setLoading(false);
    },
    [bundles]
  );

  const getEventBundleOperations = useCallback(() => {
    return bundles.map((bundle) => bundle.operation);
  }, [bundles]);

  const getEventBundleContacts = useCallback(() => {
    return bundles.flatMap((bundle) => bundle.contacts || []);
  }, [bundles]);

  const getBundleAvailableDates = useCallback(
    (operation: string) => {
      const bundle = bundles.find((b) => b.operation === operation);
      if (!bundle) {
        return {};
      }
      return bundle.data.bundleDates || {};
    },
    [bundles]
  );

  const result: BundleHookResult = {
    bundles,
    loading,
    error,
    getEventBundles,
    updateEventBundle,
    createEventBundle,
    getEventBundleOperations,
    getEventBundleContacts,
    getBundleAvailableDates,
    updateBundleContacts,
  };

  return result;
};

export default useEventBundles;
