// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   Button,
//   VerticalLayout,
//   HorizontalLayout,
//   Grid,
//   GridColumn,
//   Checkbox,
//   Notification,
// } from '@vaadin/react-components';
// import Dialogs from './Dialogs';
// import { EventItemEndpoint } from 'Frontend/generated/endpoints';
// import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
// import { Icon } from '@vaadin/react-components/Icon';

// export const config: ViewConfig = {
//   menu: { order: 23, icon: 'line-awesome/svg/user-check-solid.svg' },
//   title: 'Zones Management',
// };

// // --- Type definitions ---
// interface Checkpoint {
//   checkpointId: string;
//   name: string;
//   type: string;
//   role?: string;
//   shareLink?: string;
//   qrShareLink?: string;
//   deviceImei?: string;
// }
// interface Zone {
//   zoneId: string;
//   name: string;
//   parentZoneId: string | null;
//   parentZoneName?: string;
//   maxCapacity: number;
//   currentOccupancy?: number;
//   checkPoints?: { [key: string]: Checkpoint };
//   accessTypes: {
//     GENERAL: boolean;
//     BACKSTAGE: boolean;
//     STAGE: boolean;
//     VIP: boolean;
//   };
// }
// interface EventData {
//   eventId: string;
//   operation: string;
//   data: {
//     zones: { [key: string]: Zone };
//   };
// }

// const eventId = 'EVENT_050';
// const operation = 'zonesDefinition';

// // --- Access Type Badges ---
// const AccessTypeBadges = ({ accessTypes }: { accessTypes: Zone['accessTypes'] }) => (
//   <HorizontalLayout theme="spacing-xs">
//     {accessTypes.BACKSTAGE && <span>COMPROMIS</span>}
//     {accessTypes.GENERAL && <span>GENERAL</span>}
//     {accessTypes.VIP && <span>VIP</span>}
//   </HorizontalLayout>
// );

// // --- Checkpoint Table ---
// const CheckpointTable = ({
//   checkpoints,
//   onDelete,
//   onUpdate,
// }: {
//   checkpoints: Checkpoint[];
//   onDelete: (checkpoint: Checkpoint) => void;
//   onUpdate: (checkpoint: Checkpoint) => void;
// }) => (
//   <Grid items={checkpoints} allRowsVisible style={{ width: '100%' }}>
//     <GridColumn header="" renderer={() => <Checkbox />} />
//     <GridColumn header="CheckPoint" path="name" />
//     <GridColumn header="Type" path="type" />
//     <GridColumn header="Device IMEI" path="deviceImei" />
//     <GridColumn header="Role" path="role" />
//     <GridColumn header="ShareLink" path="shareLink" />
//     <GridColumn header="QR ShareLink" path="qrShareLink" />
//     <GridColumn
//       header="Actions"
//       renderer={({ item }) => (
//         <HorizontalLayout theme="spacing-xs">
//           <Button
//             theme="tertiary-inline"
//             aria-label="Edit"
//             onClick={() => onUpdate(item)}
//           >
//             <Icon icon="vaadin:edit" />
//           </Button>
//           <Button
//             theme="error tertiary-inline"
//             aria-label="Delete"
//             onClick={() => onDelete(item)}
//           >
//             <Icon icon="vaadin:trash" />
//           </Button>
//         </HorizontalLayout>
//       )}
//     />
//   </Grid>
// );

// // --- Main Section for Each Zone/Subzone ---
// const ZoneSection = ({
//   zone,
//   isSubzone,
//   parentZoneName,
//   onAddCheckpoint,
//   onAddSubzone,
//   onAddZone,
// }: {
//   zone: Zone;
//   isSubzone?: boolean;
//   parentZoneName?: string;
//   onAddCheckpoint: (zone: Zone) => void;
//   onAddSubzone?: (zone: Zone) => void;
//   onAddZone?: () => void;
// }) => {
//   const checkpoints: Checkpoint[] = useMemo(() => {
//     if (!zone.checkPoints) return [];
//     return Object.entries(zone.checkPoints).map(([checkpointId, cp]) => ({
//       checkpointId,
//       ...cp,
//     }));
//   }, [zone.checkPoints]);

//   // Title logic
//   let tableTitle: React.ReactNode = zone.name;
//   if (isSubzone && parentZoneName) {
//     tableTitle = (
//       <>
//         <span style={{ color: '#888', fontWeight: 600 }}>{parentZoneName}</span>
//         <span style={{ fontWeight: 600 }}> / {zone.name}</span>
//       </>
//     );
//   }

//   // Button logic
//   const showAddSubzoneBtn = !isSubzone && (zone.name === 'BACKSTAGE' || zone.name === 'VIP');
//   const showAddZoneBtn = !isSubzone && onAddZone && zone.name === 'Venue';
//   const showAddGateBtn = !isSubzone && onAddZone && zone.name === 'Main-GATE';

//   return (
//     <VerticalLayout style={{ marginBottom: 24, width: '100%', maxWidth: '1200px' }}>
//       <HorizontalLayout
//         style={{
//           alignItems: 'center',
//           padding: '0.5em 1em',
//           borderRadius: 4,
//           justifyContent: 'space-between',
//           width: '100%',
//         }}
//       >
//         <HorizontalLayout style={{ alignItems: 'center', gap: '1em' }}>
//           <span style={{ fontSize: 18 }}>{tableTitle}</span>
//           {showAddGateBtn && (
//             <Button theme="secondary" onClick={onAddZone}>Add Gate</Button>
//           )}
//           {showAddZoneBtn && (
//             <Button theme="primary" onClick={onAddZone}>Add Zone</Button>
//           )}
//           {showAddSubzoneBtn && onAddSubzone && (
//             <Button theme="secondary" onClick={() => onAddSubzone(zone)}>
//               Add Subzone
//             </Button>
//           )}
//         </HorizontalLayout>
//         <HorizontalLayout style={{ alignItems: 'center', gap: '1em' }}>
//           <AccessTypeBadges accessTypes={zone.accessTypes} />
//           <span style={{ fontSize: 14, marginLeft: 16 }}>
//             Capacity: {zone.maxCapacity}
//           </span>
//         </HorizontalLayout>
//       </HorizontalLayout>
//       <div style={{ width: '100%' }}>
//         <CheckpointTable
//           checkpoints={checkpoints}
//           onDelete={checkpoint => handleDeleteCheckpoint(zone, checkpoint)}
//           onUpdate={checkpoint => handleUpdateCheckpoint(zone, checkpoint)}
//         />

//         <Button
//           theme="secondary"
//           style={{ margin: '1em 0 0 0' }}
//           onClick={() => onAddCheckpoint(zone)}
//         >
//           Add Checkpoint
//         </Button>
//       </div>
//     </VerticalLayout>
//   );
// };

// // --- Main Component ---
// const ZonesManagement: React.FC = () => {
//   const [eventData, setEventData] = useState<EventData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState<string | null>(null);

//   // Dialogs state blocks
//   // --- Gate Dialog
//   const [gateDialogOpen, setGateDialogOpen] = useState(false);
//   // --- Zone Dialog
//   const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
//   // --- Checkpoint Dialog
//   const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false);
//   // --- Subzone Dialog
//   const [subzoneDialogOpen, setSubzoneDialogOpen] = useState(false);
//   // --- Selected Zone
//   const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

//   const handleUpdateCheckpoint = async (zone: Zone, updatedCheckpoint: Checkpoint) => {
//     if (!eventData) return;

//     // Clone zones to avoid mutating state directly
//     const zonesCopy = { ...eventData.data.zones };
//     const zoneCopy = { ...zonesCopy[zone.zoneId] };

//     // Update the checkpoint
//     if (zoneCopy.checkPoints && updatedCheckpoint.checkpointId in zoneCopy.checkPoints) {
//       zoneCopy.checkPoints[updatedCheckpoint.checkpointId] = { ...updatedCheckpoint };
//     }

//     zonesCopy[zone.zoneId] = zoneCopy;

//     // Prepare new eventData
//     const newEventData = {
//       ...eventData,
//       data: {
//         ...eventData.data,
//         zones: zonesCopy,
//       },
//     };

//     // Save to backend
//     try {
//       await EventItemEndpoint.saveEventItem({
//         eventId,
//         operation,
//         data: newEventData.data,
//       });
//       setEventData(newEventData);
//       setNotification('Checkpoint updated successfully!');
//     } catch (e) {
//       setNotification('Failed to update checkpoint.');
//     }
//   };


//   // Fetch data on mount
//   useEffect(() => {
//     setLoading(true);
//     EventItemEndpoint.getEventItemByIdAndOperation(eventId, operation)
//       .then((res: any) => {
//         if (res && res.data) {
//           setEventData(res);
//         } else {
//           setNotification('No zones data found for this event.');
//         }
//       })
//       .catch(() => setNotification('Failed to fetch zones data.'))
//       .finally(() => setLoading(false));
//   }, []);

//   // Zones classification
//   const zonesArray = useMemo(() => eventData ? Object.values(eventData.data.zones) : [], [eventData]);
//   const gates = useMemo(() => zonesArray.filter(z => z.name.toLowerCase().includes('gate')), [zonesArray]);
//   const zones = useMemo(() => zonesArray.filter(z => !z.name.toLowerCase().includes('gate') && !z.parentZoneId), [zonesArray]);
//   const subzones = useMemo(() => zonesArray.filter(z => !!z.parentZoneId), [zonesArray]);

//   // Group subzones by parentZoneId for rendering
//   const subzonesByParent = useMemo(() => {
//     const map: { [parentZoneId: string]: Zone[] } = {};
//     subzones.forEach(sz => {
//       if (!map[sz.parentZoneId!]) map[sz.parentZoneId!] = [];
//       map[sz.parentZoneId!].push(sz);
//     });
//     return map;
//   }, [subzones]);

//   // Handlers for dialogs
//   const handleAddCheckpoint = (zone: Zone) => {
//     setSelectedZone(zone);
//     setCheckpointDialogOpen(true);
//   };
//   const handleAddSubzone = (zone: Zone) => {
//     setSelectedZone(zone);
//     setSubzoneDialogOpen(true);
//   };
//   const handleAddZone = () => {
//     setZoneDialogOpen(true);
//   };
//   const handleAddGate = () => {
//     setGateDialogOpen(true);
//   };

//   // Save handler
//   const handleSave = async (newData: EventData) => {
//     try {
//       await EventItemEndpoint.saveEventItem({
//         eventId,
//         operation,
//         data: newData.data,
//       });
//       setEventData(newData);
//       setNotification('Zones updated successfully!');
//     } catch (e) {
//       setNotification('Failed to save zones.');
//     }
//   };

//   if (loading) return <div>Loading...</div>;

//   return (
//     <VerticalLayout
//       theme="spacing padding"
//       style={{
//         width: '100%',
//         maxWidth: '1200px',
//         margin: '0 auto',
//       }}
//     >
//       {notification && (
//         <Notification
//           duration={3000}
//           position="top-end"
//           opened
//           onOpenedChanged={e => !e.detail.value && setNotification(null)}
//         >
//           {notification}
//         </Notification>
//       )}
//       {/* GATE */}
//       {gates.map(gate => (
//         <ZoneSection
//           key={gate.zoneId}
//           zone={gate}
//           onAddCheckpoint={handleAddCheckpoint}
//           onAddZone={handleAddGate}
//         />
//       ))}
//       {/* ZONES */}
//       {zones.map(zone => (
//         <div key={zone.zoneId} style={{ width: '100%' }}>
//           <ZoneSection
//             zone={zone}
//             onAddCheckpoint={handleAddCheckpoint}
//             onAddZone={handleAddZone}
//             onAddSubzone={handleAddSubzone}
//           />
//           {/* SUBZONES */}
//           {subzonesByParent[zone.zoneId]?.map(subzone => (
//             <ZoneSection
//               key={subzone.zoneId}
//               zone={subzone}
//               isSubzone
//               parentZoneName={zone.name}
//               onAddCheckpoint={handleAddCheckpoint}
//             />
//           ))}
//         </div>
//       ))}
//       <Dialogs
//         gateDialogOpen={gateDialogOpen}
//         setGateDialogOpen={setGateDialogOpen}
//         zoneDialogOpen={zoneDialogOpen}
//         setZoneDialogOpen={setZoneDialogOpen}
//         checkpointDialogOpen={checkpointDialogOpen}
//         setCheckpointDialogOpen={setCheckpointDialogOpen}
//         subzoneDialogOpen={subzoneDialogOpen}
//         setSubzoneDialogOpen={setSubzoneDialogOpen}
//         selectedZone={selectedZone}
//         eventData={eventData}
//         setEventData={setEventData}
//         onSave={handleSave}
//       />
//     </VerticalLayout>
//   );
// };

// export default ZonesManagement;

const ZonesManagement = () => {
  return (
    <div>
      <h1>Zones Management</h1>
    
    </div>
  );
}

export default ZonesManagement;
