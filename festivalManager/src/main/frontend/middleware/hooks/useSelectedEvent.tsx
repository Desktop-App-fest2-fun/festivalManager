import { useState, useCallback } from 'react';
import { eventCoreService } from '../endpointService';
import { Core, EventDates, QuotaData, TagsType } from 'Frontend/model/EventItemModel/Core';
import { GeneralInfoForm } from 'Frontend/components/EventDetails/Steps/GeneralInfo';
import { VenueDetailsFormData } from 'Frontend/components/EventDetails/Steps/VenueDetails/VenueDetailsForm';
import { QuotaState } from 'Frontend/components/EventDetails/reducers/quotaReducer';

export interface SelectedEventHookResult {
  loading: boolean;
  error: string | null;
  eventCore: Core | null;
  getSelectedEventCore: () => Promise<Core>;
  updateGeneralData: (generalInfoForm: GeneralInfoForm) => Promise<void>;
  updateVenueData: (venueDetailsForm: VenueDetailsFormData) => Promise<void>;
  updateEventDates: (eventDates: EventDates) => Promise<void>;
  updateCoreQuotes: (invitationQuotaData: QuotaState) => Promise<void>;
}

const useSelectedEvent = (selectedEventId: string): SelectedEventHookResult => {
  const [currentEventCore, setCurrentEventCore] = useState<Core | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Common update function to handle event core updates
   * This receives an updated core object directly and handles the API call
   */
  const updateEventCore = useCallback(
    async (updatedEventCore: Core, errorMessage: string): Promise<void> => {
      if (!selectedEventId) {
        throw new Error('No selected event ID');
      }
      if (!currentEventCore) {
        throw new Error('No current event core');
      }

      try {
        setLoading(true);
        setError(null);

        // Save updated event core
        const savedCoreItem = await eventCoreService.updateEventCore(updatedEventCore);
        if (!savedCoreItem) {
          throw new Error('Failed to update event core');
        }

        console.info('Event core updated successfully:', savedCoreItem);
        setCurrentEventCore(savedCoreItem);
      } catch (error) {
        setError(errorMessage);
        console.error(errorMessage, error);
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId, currentEventCore]
  );

  const getSelectedEventCore = useCallback(async () => {
    if (!selectedEventId) {
      throw new Error('No selected event ID');
    }
    setLoading(true);
    setError(null);

    // Return cached event if available and ID matches
    if (currentEventCore?.eventId === selectedEventId) {
      setLoading(false);
      return currentEventCore;
    }

    try {
      const eventCore = await eventCoreService.getEventCore(selectedEventId);
      if (!eventCore) {
        throw new Error('Event core not found');
      }
      setCurrentEventCore(eventCore);
      return eventCore;
    } catch (error) {
      setError('Error fetching event core. Please try again later.');
      console.error('Error fetching event core:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, currentEventCore]);

  const updateGeneralData = useCallback(
    async (generalInfoForm: GeneralInfoForm) => {
      if (!currentEventCore) {
        throw new Error('No current event core');
      }

      const tags: TagsType = generalInfoForm.tags.reduce((acc, tag) => {
        acc[tag] = tag;
        return acc;
      }, {} as TagsType);

      const updatedEventCore: Core = {
        ...currentEventCore,
        data: {
          ...currentEventCore.data,
          coreData: {
            ...currentEventCore.data.coreData,
            generalData: {
              ...currentEventCore.data.coreData.generalData,
              eventCode: generalInfoForm.eventCode,
              eventName: generalInfoForm.eventName,
              tags: tags,
            },
          },
        },
      };

      await updateEventCore(updatedEventCore, 'Error updating event general data. Please try again later.');
    },
    [updateEventCore, currentEventCore]
  );

  const updateVenueData = useCallback(
    async (venueDetailsForm: VenueDetailsFormData) => {
      if (!currentEventCore) {
        throw new Error('No current event core');
      }

      const updatedEventCore: Core = {
        ...currentEventCore,
        data: {
          ...currentEventCore.data,
          coreData: {
            ...currentEventCore.data.coreData,
            venueData: {
              ...currentEventCore.data.coreData.venueData,
              venueName: venueDetailsForm.venue,
              city: venueDetailsForm.city,
              address: venueDetailsForm.address,
            },
          },
        },
      };

      await updateEventCore(updatedEventCore, 'Error updating event venue data. Please try again later.');
    },
    [updateEventCore, currentEventCore]
  );

  const updateEventDates = useCallback(
    async (eventDates: EventDates) => {
      if (!currentEventCore) {
        throw new Error('No current event core');
      }

      const dateEntries = Object.entries(eventDates);

      if (dateEntries.length === 0) {
        throw new Error('No event dates provided');
      }

      dateEntries.sort(); // Sort by key (day#01, day#02, etc.)
      const startDate = dateEntries[0][1]; // First date value
      const endDate = dateEntries[dateEntries.length - 1][1]; // Last date value

      const updatedEventCore: Core = {
        ...currentEventCore,
        data: {
          ...currentEventCore.data,
          coreData: {
            ...currentEventCore.data.coreData,
            startDate: startDate,
            endDate: endDate,
          },
          coreEventDates: eventDates,
        },
      };

      await updateEventCore(updatedEventCore, 'Error updating event dates. Please try again later.');
    },
    [updateEventCore, currentEventCore]
  );

  const updateCoreQuotes = useCallback(
    async (invitationQuotaData: QuotaState) => {
      if (!currentEventCore) {
        throw new Error('No current event core');
      }

      // Convert quotas array to object format with invitationType as keys
      const quotasObject: QuotaData = {};
      invitationQuotaData.quotas.forEach((quota) => {
        quotasObject[quota.invitationType] = quota;
      });

      const updatedEventCore: Core = {
        ...currentEventCore,
        data: {
          ...currentEventCore.data,
          coreQuotes: {
            invitationsLimits: invitationQuotaData.totalInvitations,
            quotes: quotasObject,
          },
        },
      };

      await updateEventCore(updatedEventCore, 'Error updating event quota data. Please try again later.');
    },
    [updateEventCore, currentEventCore]
  );

  const result: SelectedEventHookResult = {
    loading,
    error,
    eventCore: currentEventCore,
    getSelectedEventCore,
    updateGeneralData,
    updateVenueData,
    updateEventDates,
    updateCoreQuotes,
  };

  return result;
};

export default useSelectedEvent;
