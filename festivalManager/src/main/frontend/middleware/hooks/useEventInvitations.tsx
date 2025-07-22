import { Invitation, InvitationStatus, InvitationTemplate } from 'Frontend/model/EventItemModel/Invitation';
import { useCallback, useState } from 'react';
import { eventInvitationService } from '../endpointService';
import { Contact } from 'Frontend/model/EventItemModel/Bundle';

export interface InvitationHookResult {
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  getEventInvitations: () => Promise<Invitation[]>;
  createEventInvitations: (contacts: Contact[]) => Promise<void>;
  updateInvitationStatus: (invitationOperations: string[], status: InvitationStatus) => Promise<void>;
  sendEventInvitations: (invitations: string[]) => Promise<void>;
}

const useEventInvitations = (selectedEventId: string) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getEventInvitations = useCallback(async () => {
    if (!selectedEventId) {
      throw new Error('No selected event ID');
    }
    setLoading(true);
    setError(null);

    // Return cached invitations if available and ID matches
    if (invitations.length > 0 && invitations[0].eventId === selectedEventId) {
      setLoading(false);
      return invitations;
    }

    try {
      const fetchedInvitations = await eventInvitationService.getAllInvitations(selectedEventId);
      setInvitations(fetchedInvitations);
      return fetchedInvitations;
    } catch (error) {
      setError('Error fetching invitations. Please try again later.');
      console.error('Error fetching invitations:', error);
      setInvitations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, invitations]);

  const createEventInvitations = useCallback(
    async (contacts: Contact[]) => {
      if (!selectedEventId) {
        throw new Error('No selected event ID');
      }
      setLoading(true);
      setError(null);

      try {
        /* Hardcoded invitation template for now */
        const invitationTemplate: InvitationTemplate = {
          cuostomFields: {},
          templateId: 'WHITE',
        };

        const createdInvitations = await eventInvitationService.createInvitations(
          selectedEventId,
          contacts,
          invitationTemplate
        );

        if (createdInvitations && createdInvitations.length > 0) {
          console.info('Adding created invitations to state');
          setInvitations((prevInvitations) => [...prevInvitations, ...createdInvitations]);
        }
      } catch (error) {
        setError('Error creating invitations. Please try again later.');
        console.error('Error creating invitations:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId]
  );

  const updateInvitationStatus = useCallback(
    async (invitationOperations: string[], status: InvitationStatus) => {
      try {
        setLoading(true);
        setError(null);
        if (!invitationOperations || invitationOperations.length === 0) {
          throw new Error('No invitation operations provided');
        }

        await eventInvitationService.updateInvitations(selectedEventId, invitationOperations, status);

        let changedInvitations: Invitation[] = [];
        setInvitations((prevInvitations) => {
          const updatedInvitations = prevInvitations.map((invitation) => {
            if (invitationOperations.includes(invitation.operation)) {
              const updatedInvitation = {
                ...invitation,
                data: {
                  ...invitation.data,
                  invitationStatus: {
                    ...invitation.data.invitationStatus,
                    currentStatus: status,
                  },
                },
              };
              changedInvitations.push(updatedInvitation);
              return updatedInvitation;
            }
            return invitation;
          });
          return updatedInvitations;
        });
        eventInvitationService.saveUpdatedInvitations(selectedEventId, changedInvitations);
      } catch (error) {
        console.error('Error updating invitation status:', error);
        setError('Error updating invitation status. Please try again later.');
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId]
  );

  const sendEventInvitations = useCallback(
    async (invitationOperations: string[]) => {
      try {
        setLoading(true);
        setError(null);

        // const sentInvitations = await eventInvitationService.sendInvitations(selectedEventId, invitationOperations);
        // if (sentInvitations && sentInvitations.length > 0) {
        //   console.info('Successfully sent invitations:', sentInvitations);
        //   setInvitations((prevInvitations) => {
        //     return prevInvitations.map((invitation) => {
        //       const sentInvitation = sentInvitations.find((sent) => sent.operation === invitation.operation);
        //       return sentInvitation || invitation;
        //     });
        //   });
        // } else {
        //   console.warn('No invitations were sent.');
        // }
        await eventInvitationService.sendInvitations(selectedEventId, invitationOperations);
        console.info('Successfully sent invitations:', invitationOperations);
        // Update the status of the sent invitations
        let sentInvitations: Invitation[] = [];
        setInvitations((prevInvitations) => {
          return prevInvitations.map((invitation) => {
            if (invitationOperations.includes(invitation.operation)) {
              const sentInvitation: Invitation = {
                ...invitation,
                data: {
                  ...invitation.data,
                  invitationStatus: {
                    ...invitation.data.invitationStatus,
                    currentStatus: 'SENT',
                  },
                },
              };
              sentInvitations.push(sentInvitation);
              return sentInvitation;
            }
            return invitation;
          });
        });
        eventInvitationService.saveUpdatedInvitations(selectedEventId, sentInvitations);
      } catch (error) {
        console.error('Error sending invitations:', error);
        setError('Error sending invitations. Please try again later.');
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId]
  );

  const result: InvitationHookResult = {
    invitations,
    loading,
    error,
    getEventInvitations,
    createEventInvitations,
    updateInvitationStatus,
    sendEventInvitations,
  };

  return result;
};

export default useEventInvitations;
