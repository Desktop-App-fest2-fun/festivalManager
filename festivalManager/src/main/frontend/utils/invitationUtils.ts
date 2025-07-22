/**
 * Extracts invitation IDs from the string returned by the InvitationEndpoint.createInvitations API
 * 
 * @param invitationResponse String response from the API in format:
 *        "Invitation IDs: invitation#INV0001,invitation#INV0002,..., Quantity: X, Duration: Y ms"
 * @returns Array of invitation IDs ["invitation#INV0001", "invitation#INV0002", ...]
 */
export const extractInvitationIds = (invitationResponse: string): string[] => {
  if (!invitationResponse) return [];
  
  // Extract the portion between "Invitation IDs:" and ", Quantity:"
  const match = invitationResponse.match(/Invitation IDs: (.*?), Quantity:/);
  if (!match || !match[1]) return [];
  
  // Split the comma-separated list of IDs
  return match[1].split(',').map(id => id.trim());
};