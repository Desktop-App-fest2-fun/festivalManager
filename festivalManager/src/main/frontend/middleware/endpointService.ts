import { EventItemEndpoint, InvitationEndpoint } from 'Frontend/generated/endpoints';
import { Core } from 'Frontend/model/EventItemModel/Core';
import {
  getAllCoreItems,
  setCoreItem,
  getCoreItem,
  getAllEventBundleItems,
  setEventBundleItem,
  setInvitationItem,
  getAllInvitationItems,
} from './storageService';
import { Bundle, Contact } from 'Frontend/model/EventItemModel/Bundle';
import { Invitation, InvitationStatus, InvitationTemplate } from 'Frontend/model/EventItemModel/Invitation';
import { extractInvitationIds } from 'Frontend/utils/invitationUtils';

const CORE_OPERATION = 'core';

// Custom error class for endpoint errors
class EndpointError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'EndpointError';
    this.cause = cause;
  }
}

export const eventCoreService = {
  getCurrentEvents: async (): Promise<Core[]> => {
    try {
      const cachedData = getAllCoreItems() as Core[];
      if (cachedData.length > 0) {
        return cachedData;
      }
      const eventIds = ['EVENT_999', 'EVENT_998', 'EVENT#25_93a1#offsonnarmusicfestival']; // Example event IDs, replace with actual logic to fetch current events
      //const currentEvents = await EventItemEndpoint.getCurrentEvents() as Core[];
      /* We use event999 item in development mode to test the core item */
      let eventCoreArray: Core[] = [];

      for (const eventId of eventIds) {
        const eventCoreItem = await EventItemEndpoint.getEventItemByIdAndOperation(eventId, CORE_OPERATION);
        if (!eventCoreItem) {
          throw new EndpointError(`Event item with ID ${eventId} not found`);
        }
        const typedEventCore = eventCoreItem as Core;
        eventCoreArray.push(typedEventCore);
      }

      /* Set the current events in local storage */
      eventCoreArray.forEach((eventCoreItem) => {
        setCoreItem(eventCoreItem);
      });
      return eventCoreArray;
    } catch (error) {
      console.error('Error fetching current events:', error);
      // Return empty array as fallback
      return [];
    }
  },
  createNewEvent: async (eventCore: Core): Promise<Core> => {
    try {
      const eventData = Object.fromEntries(Object.entries(eventCore));

      const newEventCore = await EventItemEndpoint.createEventItem(eventData);

      if (!newEventCore) {
        throw new EndpointError('Failed to create new event');
      }

      const typedEventCore = newEventCore as Core;
      setCoreItem(typedEventCore);
      return typedEventCore;
    } catch (error) {
      console.error('Error creating new event:', error);
      throw new EndpointError('Failed to create new event', error);
    }
  },
  getEventCore: async (eventId: string): Promise<Core> => {
    try {
      const cachedData = getCoreItem(eventId, CORE_OPERATION);
      if (cachedData) {
        return cachedData as Core;
      }

      const eventItem = await EventItemEndpoint.getEventItemByIdAndOperation(eventId, CORE_OPERATION);
      if (!eventItem) {
        throw new EndpointError('Event item not found');
      }
      const eventCore = eventItem as Core;
      setCoreItem(eventCore);
      return eventCore;
    } catch (error) {
      console.error('Error fetching event item by ID:', error);
      throw new EndpointError('Failed to fetch event item', error);
    }
  },
  updateEventCore: async (coreItem: Core): Promise<Core> => {
    try {
      const eventData = Object.fromEntries(Object.entries(coreItem));
      const updatedEventCore = await EventItemEndpoint.saveEventItem(eventData);

      if (!updatedEventCore) {
        throw new EndpointError('Failed to update event item');
      }

      const typedEventCore = updatedEventCore as Core;
      setCoreItem(typedEventCore);
      return typedEventCore;
    } catch (error) {
      console.error('Error updating event item:', error);
      throw new EndpointError('Failed to update event item', error);
    }
  },
};

// Service for individual event bundles
export const eventBundleService = {
  getAllEventBundles: async (eventId: string): Promise<Bundle[]> => {
    try {
      const cachedData = getAllEventBundleItems(eventId) as Bundle[];
      if (cachedData.length > 0) {
        return cachedData;
      }
      const eventBundles = await getFilteredEventItemsByOperation(eventId, 'bundle#');
      if (!eventBundles) {
        throw new EndpointError('Event bundles not found');
      }
      const eventBundleArray = eventBundles as Bundle[];
      /* Set the event bundles in local storage */
      eventBundleArray.forEach((eventBundleItem) => {
        setEventBundleItem(eventBundleItem);
      });
      return eventBundleArray;
    } catch (error) {
      console.error('Error fetching all event bundles:', error);
      throw new EndpointError('Failed to fetch all event bundles', error);
    }
  },
  updateEventBundle: async (bundleItem: Bundle): Promise<Bundle> => {
    try {
      const eventData = Object.fromEntries(Object.entries(bundleItem));
      const updatedEventBundle = await EventItemEndpoint.saveBundleItem(eventData);

      if (!updatedEventBundle) {
        throw new EndpointError('Failed to update event bundle');
      }

      const typedEventBundle = updatedEventBundle as Bundle;
      setEventBundleItem(typedEventBundle);
      return typedEventBundle;
    } catch (error) {
      console.error('Error updating event bundle:', error);
      throw new EndpointError('Failed to update event bundle', error);
    }
  },
  createNewEventBundle: async (bundleItem: Bundle): Promise<Bundle> => {
    try {
      const eventData = Object.fromEntries(Object.entries(bundleItem));
      /* Create bundle has to be implemented in the backend */
      const newEventBundle = await EventItemEndpoint.saveBundleItem(eventData);

      if (!newEventBundle) {
        throw new EndpointError('Failed to create new event bundle');
      }

      const typedEventBundle = newEventBundle as Bundle;
      setEventBundleItem(typedEventBundle);
      return typedEventBundle;
    } catch (error) {
      console.error('Error creating new event bundle:', error);
      throw new EndpointError('Failed to create new event bundle', error);
    }
  },
  // Update contacts in an existing bundle in local storage
  saveBundleContacts: (bundle: Bundle) => {
    try {
      if (!bundle || !bundle.eventId || !bundle.operation) {
        throw new EndpointError('Invalid bundle data');
      }
      setEventBundleItem(bundle);
    } catch (error) {
      console.error('Error updating bundle contacts:', error);
      throw new EndpointError('Failed to update bundle contacts', error);
    }
  },
};

export const eventInvitationService = {
  getAllInvitations: async (eventId: string): Promise<Invitation[]> => {
    try {
      const cachedData = getAllInvitationItems(eventId) as Invitation[];
      if (cachedData.length > 0) {
        return cachedData;
      }
      const eventInvitations = await getFilteredEventItemsByOperation(eventId, 'invitation');
      if (!eventInvitations) {
        throw new EndpointError('Event invitations not found');
      }
      const eventInvitationArray = eventInvitations as Invitation[];
      /* Set the event invitations in local storage */
      eventInvitationArray.forEach((eventInvitationItem) => {
        setInvitationItem(eventInvitationItem);
      });
      return eventInvitationArray;
    } catch (error) {
      console.error('Error fetching all event invitations:', error);
      throw new EndpointError('Failed to fetch all event invitations', error);
    }
  },
  saveInvitations: async (eventId: string, invitations: string[]): Promise<Invitation[]> => {
    try {
      if (!invitations || invitations.length === 0) {
        throw new EndpointError('No invitations to save');
      }
      const storedInvitations = getAllInvitationItems(eventId) as Invitation[];
      // If no invitations are stored, we can skip saving
      if (!storedInvitations || storedInvitations.length === 0) {
        console.info('No invitations found in local storage, skipping save');
        return [] as Invitation[];
      }
      // Fetch and save each new invitation to local storage
      let newInvitations: Invitation[] = [];
      for (const invitationId of invitations) {
        const invitationItem = await EventItemEndpoint.getEventItemByIdAndOperation(eventId, invitationId);
        if (!invitationItem) {
          throw new EndpointError(`Invitation item with ID ${invitationId} not found`);
        }
        const typedInvitation = invitationItem as Invitation;
        setInvitationItem(typedInvitation);
        newInvitations.push(typedInvitation);
      }
      if (newInvitations.length === 0) {
        throw new EndpointError('No new invitations were saved');
      }
      return newInvitations;
    } catch (error) {
      console.error('Error saving invitations:', error);
      throw new EndpointError('Failed to save invitations', error);
    }
  },
  createInvitations: async (
    eventId: string,
    contacts: Contact[],
    invitationTemplate: InvitationTemplate
  ): Promise<Invitation[]> => {
    try {
      if (!eventId || !contacts || contacts.length === 0) {
        throw new EndpointError('Invalid event ID or contacts');
      }
      if (!invitationTemplate || !invitationTemplate.templateId) {
        throw new EndpointError('Invalid invitation template');
      }
      const response = await InvitationEndpoint.createInvitations(
        eventId,
        contacts,
        invitationTemplate as Record<string, any>,
        {}
      );
      if (!response || response.length === 0) {
        throw new EndpointError('Failed to create invitations');
      }
      // Store the created invitations in local storage
      console.info('Invitations created successfully:', response);
      const invitationIds = extractInvitationIds(response);
      console.info('Created invitations: ', invitationIds);
      const savedInvitations = await eventInvitationService.saveInvitations(eventId, invitationIds);

      return savedInvitations;
    } catch (error) {
      console.error('Error creating invitations:', error);
      throw new EndpointError('Failed to create invitations', error);
    }
  },
  updateInvitations: async (
    eventId: string,
    invitations: string[],
    status: InvitationStatus,
    templateId: string = 'WHITE'
  ): Promise<void> => {
    try {
      if (!eventId || !invitations || invitations.length === 0) {
        throw new EndpointError('Invalid event ID or invitations');
      }
      await InvitationEndpoint.updateInvitation(eventId, invitations, templateId, {}, status);
    } catch (error) {
      console.error('Error updating invitation:', error);
      throw new EndpointError('Failed to update invitation', error);
    }
  },
  saveUpdatedInvitations: (eventId: string, invitations: Invitation[]): void => {
    try {
      if (!eventId || !invitations || invitations.length === 0) {
        throw new EndpointError('Invalid event ID or invitations');
      }
      invitations.forEach((invitation) => {
        setInvitationItem(invitation);
      });
    } catch (error) {
      console.error('Error saving invitations:', error);
      throw new EndpointError('Failed to save invitations', error);
    }
  },
  reloadInvitations: async (eventId: string, invitationsOperations: string[]): Promise<Invitation[]> => {
    try {
      if (!eventId || !invitationsOperations || invitationsOperations.length === 0) {
        throw new EndpointError('Invalid event ID or invitation operations');
      }
      let updatedInvitations: Invitation[] = [];
      for (const operation of invitationsOperations) {
        const invitationItem = await EventItemEndpoint.getEventItemByIdAndOperation(eventId, operation);
        if (!invitationItem) {
          throw new EndpointError(`Invitation item with operation ${operation} not found`);
        }
        const typedInvitation = invitationItem as Invitation;
        updatedInvitations.push(typedInvitation);
      }

      if (!updatedInvitations || updatedInvitations.length === 0) {
        throw new EndpointError('No invitations were reloaded');
      }

      eventInvitationService.saveUpdatedInvitations(eventId, updatedInvitations);
      return updatedInvitations;
    } catch (error) {
      console.error('Error reloading invitations:', error);
      throw new EndpointError('Failed to reload invitations', error);
    }
  },
  sendInvitations: async (eventId: string, invitations: string[]): Promise<void> => {
    try {
      if (!eventId || !invitations || invitations.length === 0) {
        throw new EndpointError('Invalid event ID or invitations');
      }
      await InvitationEndpoint.sendInvitations(eventId, invitations);
      // After sending invitations, we can reload them to ensure the latest status is reflected
      // const updatedInvitations = await eventInvitationService.reloadInvitations(eventId, invitations);
      // if (!updatedInvitations || updatedInvitations.length === 0) {
      //   throw new EndpointError('No invitations were sent or reloaded');
      // }
      // return updatedInvitations;
    } catch (error) {
      console.error('Error sending invitations:', error);
      throw new EndpointError('Failed to send invitations', error);
    }
  },
};

// Helper function to filter event items by operation
async function getFilteredEventItemsByOperation(eventId: string, operation: string) {
  try {
    const eventItems = await EventItemEndpoint.getEventItemListById(eventId);
    if (!eventItems) {
      throw new EndpointError('Event items not found');
    }
    const filteredItems = eventItems.filter((item) => item?.operation?.startsWith(operation));
    if (filteredItems.length === 0) {
      console.info(`No event items found with operation "${operation}" for event ${eventId}`);
      return [];
    }
    console.info(`Filtered event items by operation "${operation}":`, filteredItems);
    return filteredItems;
  } catch (error) {
    console.error('Error fetching filtered event items:', error);
    throw new EndpointError('Failed to fetch filtered event items', error);
  }
}
