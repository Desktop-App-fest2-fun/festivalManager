import { useState, useEffect, useCallback } from 'react';
import { Core, emptyEventData } from '../../model/EventItemModel/Core';
import { eventCoreService } from '../endpointService';
import { NewEventFormData } from 'Frontend/pages/Events';

/**
 * Interface for the return values of the useEventCores hook
 */
export interface EventCoresHookResult {
  eventCores: Core[];
  createNewEventCore: (newEventData: NewEventFormData) => Promise<string>;
  fetchEventCores: () => Promise<Core[]>;
  loading: boolean;
  creatingEvent: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch event cores with loading state and error handling
 * @returns {EventCoresHookResult} -
 */
const useEventCores = (): EventCoresHookResult => {
  const [eventCores, setEventCores] = useState<Core[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingEvent, setCreatingEvent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEventCores = useCallback(async () => {
    let eventCoreItems: Core[] = [];
    try {
      setLoading(true);
      setError(null);
      eventCoreItems = await eventCoreService.getCurrentEvents();
      setEventCores(eventCoreItems);
    } catch (error) {
      setError('Error fetching event cores. Please try again later.');
      console.error('Error fetching event cores:', error);
    } finally {
      setLoading(false);
      return eventCoreItems;
    }
  }, []);

  const createNewEventCore = useCallback(async (newEventData: NewEventFormData): Promise<string> => {
    try {
      setCreatingEvent(true);
      setError(null);

      const newEventCoreData: Core = {
        ...emptyEventData,
        data: {
          ...emptyEventData.data,
          coreData: {
            ...emptyEventData.data.coreData,
            generalData: {
              ...emptyEventData.data.coreData.generalData,
              eventName: newEventData.eventName,
              eventCode: newEventData.eventCode,
            },
          },
        },
      };
      const newEventCore = await eventCoreService.createNewEvent(newEventCoreData);
      if (newEventCore) {
        console.log('New event core created successfully:', newEventCore);
        setEventCores((prevCores) => [...prevCores, newEventCore]);
        return newEventCore.eventId || '';
      } else {
        setError('Failed to create new event core.');
        return '';
      }
    } catch (error) {
      setError('Error creating new event core. Please try again later.');
      console.error('Error creating new event core:', error);
      return '';
    } finally {
      setCreatingEvent(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchEventCores();
  }, [fetchEventCores]);

  // Load event cores on initial mount
  useEffect(() => {
    fetchEventCores();
  }, [fetchEventCores]);

  const result: EventCoresHookResult = {
    eventCores,
    createNewEventCore,
    fetchEventCores,
    loading,
    creatingEvent,
    error,
    refetch,
  };

  return result;
};

export default useEventCores;
