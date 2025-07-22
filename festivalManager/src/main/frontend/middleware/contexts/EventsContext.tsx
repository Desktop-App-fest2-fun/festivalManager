import React, { createContext, ReactNode, useCallback, useState } from 'react';
import useSelectedEvent, { SelectedEventHookResult } from '../hooks/useSelectedEvent';
import useEventBundles, { BundleHookResult } from '../hooks/useEventBundles';
import useEventInvitations, { InvitationHookResult } from '../hooks/useEventInvitations';
import { Contact } from 'Frontend/model/EventItemModel/Bundle';

export type EventsContextType = {
  selectedEventId: string;
  setSelectedEventId: (eventId: string) => void;
  selectedEventHook: SelectedEventHookResult;
  bundlesHook: BundleHookResult;
  invitationsHook: InvitationHookResult;
  addContactsAndInvitations: (contacts: Contact[]) => Promise<void>;
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const selectedEventHook = useSelectedEvent(selectedEventId);
  const bundlesHook = useEventBundles(selectedEventId);
  const invitationsHook = useEventInvitations(selectedEventId);

  const addContactsAndInvitations = useCallback(
    async (contacts: Contact[]) => {
      if (!selectedEventId) {
        throw new Error('No selected event ID');
      }
      if (contacts.length === 0) {
        console.error('No contacts provided to add invitations');
        return;
      }
      try {
        await invitationsHook.createEventInvitations(contacts);
        await bundlesHook.updateBundleContacts(contacts);
      } catch (error) {
        console.error('Error adding contacts and invitations:', error);
        throw error;
      }
    },
    [selectedEventId, invitationsHook, bundlesHook]
  );

  const returnValue: EventsContextType = {
    selectedEventId,
    setSelectedEventId,
    selectedEventHook,
    bundlesHook,
    invitationsHook,
    addContactsAndInvitations,
  };

  return <EventsContext.Provider value={returnValue}>{children}</EventsContext.Provider>;
};

export default EventsContext;
