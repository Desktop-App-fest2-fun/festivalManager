import EventItem from 'Frontend/generated/fun/fest2/event/EventItem';
import { getItem, setItem, removeItem } from 'Frontend/utils/localStorage';

// Custom error class for storage operations
class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

// Local storage key for storing event ids
const EVENT_IDS_KEY = 'eventIds';
// Local storage key suffix for storing event core items
const CORE_KEY_SUFFIX = '#core'; // e.g. eventId#core

export function getCoreItem(eventId: string, operation: string): EventItem | null {
  if (!eventId) {
    throw new StorageError('Event ID is required');
  }
  if (!operation || operation !== 'core') {
    throw new StorageError('Operation is required and must be "core"');
  }

  try {
    const key = `${eventId}${CORE_KEY_SUFFIX}`;
    const item = getItem(key);

    // Return null if item doesn't exist
    if (!item) {
      return null;
    }

    // Validate item is an EventItem
    if (!item.eventId) {
      throw new StorageError('Invalid event item format in storage');
    }

    return item as EventItem;
  } catch (error) {
    throw new StorageError(`Failed to retrieve core item for event ${eventId}`, error);
  }
}

export function setCoreItem(eventItem: EventItem): void {
  if (!eventItem || !eventItem.eventId) {
    throw new StorageError('Invalid event item: missing eventId');
  }

  try {
    const key = `${eventItem.eventId}${CORE_KEY_SUFFIX}`;
    setItem(key, eventItem);

    // Update the list of event IDs
    try {
      const eventIds = (getItem(EVENT_IDS_KEY) as string[]) || [];
      if (!eventIds.includes(eventItem.eventId)) {
        eventIds.push(eventItem.eventId);
        setItem(EVENT_IDS_KEY, eventIds);
      }
    } catch (error) {
      throw new StorageError('Failed to update event IDs list', error);
    }
  } catch (error) {
    throw new StorageError(`Failed to store core item for event ${eventItem.eventId}`, error);
  }
}

export function getAllCoreItems(): EventItem[] {
  try {
    let coreItems: EventItem[] = [];
    const eventIds = getItem(EVENT_IDS_KEY) as string[];

    if (!eventIds || !Array.isArray(eventIds)) {
      return [];
    }

    eventIds.forEach((eventId) => {
      try {
        const coreItem = getCoreItem(eventId, 'core');
        if (coreItem) {
          coreItems.push(coreItem);
        }
      } catch (error) {
        console.error(`Error retrieving core item for event ${eventId}:`, error);
        // Continue with other items even if one fails
      }
    });

    return coreItems;
  } catch (error) {
    throw new StorageError('Failed to retrieve all core items', error);
  }
}

const EVENT_BUNDLE_KEY_SUFFIX = 'BundleKeys';
/* Example of how the bundle keys are stored in local storage:
  "EVENT_999#BundleKeys": [
    "bundle#01#cocacola",
    "bundle#02#damm"
    ]
  "EVENT_999#bundle#01#cocola": {
    ...
  }
  "EVENT_999#bundle#02damm": {
    ...
  }
*/
export const setEventBundleItem = (bundleItem: EventItem): void => {
  if (!bundleItem || !bundleItem.eventId) {
    throw new StorageError('Invalid bundle item: missing eventId');
  }

  if (!bundleItem.operation || !bundleItem.operation.startsWith('bundle#')) {
    throw new StorageError('Invalid bundle item: missing or invalid operation');
  }

  try {
    const key = `${bundleItem.eventId}#${bundleItem.operation}`;
    setItem(key, bundleItem);

    // Update the list of bundle keys for the event
    try {
      const bundleKeysKey = `${bundleItem.eventId}${EVENT_BUNDLE_KEY_SUFFIX}`;
      const bundleKeys = (getItem(bundleKeysKey) as string[]) || [];
      if (!bundleKeys.includes(bundleItem.operation)) {
        bundleKeys.push(bundleItem.operation);
        setItem(bundleKeysKey, bundleKeys);
      }
    } catch (error) {
      throw new StorageError('Failed to update event bundle keys list', error);
    }
  } catch (error) {
    throw new StorageError(`Failed to store bundle item for event ${bundleItem.eventId}`, error);
  }
};

export const getEventBundleItem = (eventId: string, operation: string): EventItem | null => {
  if (!eventId) {
    throw new StorageError('Event ID is required');
  }
  if (!operation || !operation.startsWith('bundle#')) {
    throw new StorageError('Operation is required and must start with "bundle#"');
  }

  try {
    const key = `${eventId}#${operation}`;
    const item = getItem(key);

    // Return null if item doesn't exist
    if (!item) {
      return null;
    }

    // Validate item is an EventItem
    if (!item.eventId) {
      throw new StorageError('Invalid event item format in storage');
    }

    return item as EventItem;
  } catch (error) {
    throw new StorageError(`Failed to retrieve bundle item for event ${eventId}`, error);
  }
};

export const getAllEventBundleItems = (eventId: string): EventItem[] => {
  try {
    let bundleItems: EventItem[] = [];
    const bundleKeysKey = `${eventId}${EVENT_BUNDLE_KEY_SUFFIX}`;
    const bundleKeys = getItem(bundleKeysKey) as string[];

    if (!bundleKeys || !Array.isArray(bundleKeys)) {
      return [];
    }

    bundleKeys.forEach((operation) => {
      try {
        const bundleItem = getEventBundleItem(eventId, operation);
        if (bundleItem) {
          bundleItems.push(bundleItem);
        }
      } catch (error) {
        console.error(`Error retrieving bundle item for event ${eventId}:`, error);
        // Continue with other items even if one fails
      }
    });

    return bundleItems;
  } catch (error) {
    throw new StorageError('Failed to retrieve all bundle items', error);
  }
};

export const removeAllEventBundleItems = (eventId: string): void => {
  try {
    const bundleKeysKey = `${eventId}${EVENT_BUNDLE_KEY_SUFFIX}`;
    const bundleKeys = getItem(bundleKeysKey) as string[];

    if (!bundleKeys || !Array.isArray(bundleKeys)) {
      return;
    }

    bundleKeys.forEach((operation) => {
      const key = `${eventId}#${operation}`;
      removeItem(key);
    });

    // Remove the bundle keys list
    removeItem(bundleKeysKey);
  } catch (error) {
    throw new StorageError('Failed to remove all bundle items', error);
  }
};

const EVENT_INVITATION_KEY_SUFFIX = 'InvitationKeys';
/* Example of how the invitations keys are stored in local storage:
  "EVENT_999#InvitationKeys": [
    "invitation#INV0001",
    "invitation#INV0002"
    ]
  "EVENT_999#invitation#INV0001": {
    ...
  }
  "EVENT_999#invitation#INV0002": {
    ...
  }
*/
export const setInvitationItem = (invitationItem: EventItem): void => {
  if (!invitationItem || !invitationItem.eventId) {
    throw new StorageError('Invalid invitation item: missing eventId');
  }

  if (!invitationItem.operation || !invitationItem.operation.startsWith('invitation')) {
    throw new StorageError('Invalid invitation item: missing or invalid operation');
  }

  try {
    const key = `${invitationItem.eventId}#${invitationItem.operation}`;
    setItem(key, invitationItem);

    // Update the list of invitation keys for the event
    try {
      const invitationKeysKey = `${invitationItem.eventId}${EVENT_INVITATION_KEY_SUFFIX}`;
      const invitationKeys = (getItem(invitationKeysKey) as string[]) || [];
      if (!invitationKeys.includes(invitationItem.operation)) {
        invitationKeys.push(invitationItem.operation);
        setItem(invitationKeysKey, invitationKeys);
      }
    } catch (error) {
      throw new StorageError('Failed to update event invitation keys list', error);
    }
  } catch (error) {
    throw new StorageError(`Failed to store invitation item for event ${invitationItem.eventId}`, error);
  }
};

export const getInvitationItem = (eventId: string, operation: string): EventItem | null => {
  if (!eventId) {
    throw new StorageError('Event ID is required');
  }
  if (!operation || !operation.startsWith('invitation#')) {
    throw new StorageError('Operation is required and must start with "invitation#"');
  }

  try {
    const key = `${eventId}#${operation}`;
    const item = getItem(key);

    // Return null if item doesn't exist
    if (!item) {
      return null;
    }

    // Validate item is an EventItem
    if (!item.eventId) {
      throw new StorageError('Invalid event item format in storage');
    }

    return item as EventItem;
  } catch (error) {
    throw new StorageError(`Failed to retrieve invitation item for event ${eventId}`, error);
  }
};

export const getAllInvitationItems = (eventId: string): EventItem[] => {
  try {
    let invitationItems: EventItem[] = [];
    const invitationKeysKey = `${eventId}${EVENT_INVITATION_KEY_SUFFIX}`;
    const invitationKeys = getItem(invitationKeysKey) as string[];

    if (!invitationKeys || !Array.isArray(invitationKeys)) {
      return [];
    }

    invitationKeys.forEach((operation) => {
      try {
        const invitationItem = getInvitationItem(eventId, operation);
        if (invitationItem) {
          invitationItems.push(invitationItem);
        }
      } catch (error) {
        console.error(`Error retrieving invitation item for event ${eventId}:`, error);
        // Continue with other items even if one fails
      }
    });

    return invitationItems;
  } catch (error) {
    throw new StorageError('Failed to retrieve all invitation items', error);
  }
};

export const removeAllInvitationItems = (eventId: string): void => {
  try {
    const invitationKeysKey = `${eventId}${EVENT_INVITATION_KEY_SUFFIX}`;
    const invitationKeys = getItem(invitationKeysKey) as string[];

    if (!invitationKeys || !Array.isArray(invitationKeys)) {
      return;
    }

    invitationKeys.forEach((operation) => {
      const key = `${eventId}#${operation}`;
      removeItem(key);
    });

    // Remove the invitation keys list
    removeItem(invitationKeysKey);
  } catch (error) {
    throw new StorageError('Failed to remove all invitation items', error);
  }
};