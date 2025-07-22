// import React, { useState } from 'react';
// import {
//   Dialog,
//   VerticalLayout,
//   HorizontalLayout,
//   TextField,
//   NumberField,
//   ComboBox,
//   Checkbox,
//   Button,
// } from '@vaadin/react-components';
// import { ZonesManagement } from './ZonesManagement';
// import { ViewConfig } from '@vaadin/hilla-file-router/types.js';


// export const config: ViewConfig = {
//   menu: { exclude: true },
// };


// interface DialogsProps {
//   gateDialogOpen: boolean;
//   setGateDialogOpen: (open: boolean) => void;
//   zoneDialogOpen: boolean;
//   setZoneDialogOpen: (open: boolean) => void;
//   checkpointDialogOpen: boolean;
//   setCheckpointDialogOpen: (open: boolean) => void;
//   subzoneDialogOpen: boolean;
//   setSubzoneDialogOpen: (open: boolean) => void;
//   selectedZone: ZonesManagement['Zone'] | null;
//   eventData: ZonesManagement['EventData'];
//   setEventData: (data: ZonesManagement['EventData']) => void;
// }

// const Dialogs = ({
//   gateDialogOpen,
//   setGateDialogOpen,
//   zoneDialogOpen,
//   setZoneDialogOpen,
//   checkpointDialogOpen,
//   setCheckpointDialogOpen,
//   subzoneDialogOpen,
//   setSubzoneDialogOpen,
//   selectedZone,
//   eventData,
//   setEventData,
// }: DialogsProps) => {
//   // Gate Dialog State
//   const [gateName, setGateName] = useState('');
//   const [gateDeviceId, setGateDeviceId] = useState('');
//   const [gateDeviceRole, setGateDeviceRole] = useState('');

//   // Zone Dialog State
//   const [zoneName, setZoneName] = useState('');
//   const [zoneMaxCapacity, setZoneMaxCapacity] = useState(100);
//   const [zoneGeneralAccess, setZoneGeneralAccess] = useState(false);
//   const [zoneBackstageAccess, setZoneBackstageAccess] = useState(false);
//   const [zoneStageAccess, setZoneStageAccess] = useState(false);

//   // Checkpoint Dialog State
//   const [checkpointName, setCheckpointName] = useState('');
//   const [checkpointType, setCheckpointType] = useState('IN_OUT');
//   const [checkpointDeviceId, setCheckpointDeviceId] = useState('');
//   const [checkpointDeviceRole, setCheckpointDeviceRole] = useState('');

//   // Subzone Dialog State
//   const [subzoneName, setSubzoneName] = useState('');
//   const [subzoneMaxCapacity, setSubzoneMaxCapacity] = useState(100);
//   const [subzoneGeneralAccess, setSubzoneGeneralAccess] = useState(false);
//   const [subzoneBackstageAccess, setSubzoneBackstageAccess] = useState(false);
//   const [subzoneStageAccess, setSubzoneStageAccess] = useState(false);

//   const handleAddGate = () => {
//     const newCheckpoint: ZonesManagement['Checkpoint'] = {
//       checkpointId: `checkpoint#${Date.now()}`,
//       name: gateName,
//       type: 'IN_OUT',
//       devices: [
//         {
//           deviceId: gateDeviceId,
//           name: `Scanner ${Date.now()}`,
//           role: gateDeviceRole as 'Entry Scanner' | 'Exit Monitor',
//         },
//       ],
//     };

//     const updatedZones = [...eventData.zones];
//     const gatesZoneIndex = updatedZones.findIndex((zone) => zone.name === 'GATES');
//     if (gatesZoneIndex !== -1) {
//       updatedZones[gatesZoneIndex].checkpoints.push(newCheckpoint);
//     }

//     setEventData({
//       ...eventData,
//       zones: updatedZones,
//     });
//     setGateDialogOpen(false);
//     setGateName('');
//     setGateDeviceId('');
//     setGateDeviceRole('');
//   };

//   const handleAddZone = () => {
//     const newZone: ZonesManagement['Zone'] = {
//       zoneId: `zona#${Date.now()}`,
//       id: Math.max(...eventData.zones.map((z) => z.id)) + 1,
//       name: zoneName,
//       parentZoneId: 0, // Under VENUE
//       maxCapacity: zoneMaxCapacity,
//       accessTypes: {
//         GENERAL: zoneGeneralAccess,
//         BACKSTAGE: zoneBackstageAccess,
//         STAGE: zoneStageAccess,
//       },
//       checkpoints: [],
//     };

//     setEventData({
//       ...eventData,
//       zones: [...eventData.zones, newZone],
//     });
//     setZoneDialogOpen(false);
//     setZoneName('');
//     setZoneMaxCapacity(100);
//     setZoneGeneralAccess(false);
//     setZoneBackstageAccess(false);
//     setZoneStageAccess(false);
//   };

//   const handleAddCheckpoint = () => {
//     if (!selectedZone) return;

//     const newCheckpoint: ZonesManagement['Checkpoint'] = {
//       checkpointId: `checkpoint#${Date.now()}`,
//       name: checkpointName,
//       type: checkpointType as 'IN' | 'OUT' | 'IN_OUT',
//       devices: [
//         {
//           deviceId: checkpointDeviceId,
//           name: `Scanner ${Date.now()}`,
//           role: checkpointDeviceRole as 'Entry Scanner' | 'Exit Monitor',
//         },
//       ],
//     };

//     const updatedZones = eventData.zones.map((zone) =>
//       zone.zoneId === selectedZone.zoneId
//         ? { ...zone, checkpoints: [...zone.checkpoints, newCheckpoint] }
//         : zone
//     );

//     setEventData({
//       ...eventData,
//       zones: updatedZones,
//     });
//     setCheckpointDialogOpen(false);
//     setCheckpointName('');
//     setCheckpointType('IN_OUT');
//     setCheckpointDeviceId('');
//     setCheckpointDeviceRole('');
//   };

//   const handleAddSubzone = () => {
//     if (!selectedZone) return;

//     const newSubzone: ZonesManagement['Zone'] = {
//       zoneId: `zona#${Date.now()}`,
//       id: Math.max(...eventData.zones.map((z) => z.id)) + 1,
//       name: `${selectedZone.name} / ${subzoneName}`,
//       parentZoneId: selectedZone.id,
//       maxCapacity: subzoneMaxCapacity,
//       accessTypes: {
//         GENERAL: subzoneGeneralAccess,
//         BACKSTAGE: subzoneBackstageAccess,
//         STAGE: subzoneStageAccess,
//       },
//       checkpoints: [],
//     };

//     setEventData({
//       ...eventData,
//       zones: [...eventData.zones, newSubzone],
//     });
//     setSubzoneDialogOpen(false);
//     setSubzoneName('');
//     setSubzoneMaxCapacity(100);
//     setSubzoneGeneralAccess(false);
//     setSubzoneBackstageAccess(false);
//     setSubzoneStageAccess(false);
//   };

//   return (
//     <>
//       {/* Gate Dialog */}
//       <Dialog
//         opened={gateDialogOpen}
//         onOpenedChanged={(e) => setGateDialogOpen(e.detail.value)}
//         header="Add New Gate"
//         footer={
//           <HorizontalLayout theme="spacing">
//             <Button onClick={() => setGateDialogOpen(false)}>Cancel</Button>
//             <Button theme="primary" onClick={handleAddGate}>
//               Add
//             </Button>
//           </HorizontalLayout>
//         }
//       >
//         <VerticalLayout theme="spacing">
//           <TextField
//             label="Gate Name"
//             value={gateName}
//             onValueChanged={(e) => setGateName(e.detail.value)}
//           />
//           <TextField
//             label="Device ID"
//             value={gateDeviceId}
//             onValueChanged={(e) => setGateDeviceId(e.detail.value)}
//           />
//           <TextField
//             label="Device Role"
//             value={gateDeviceRole}
//             onValueChanged={(e) => setGateDeviceRole(e.detail.value)}
//           />
//         </VerticalLayout>
//       </Dialog>

//       {/* Zone Dialog */}
//       <Dialog
//         opened={zoneDialogOpen}
//         onOpenedChanged={(e) => setZoneDialogOpen(e.detail.value)}
//         header="Add New Zone"
//         footer={
//           <HorizontalLayout theme="spacing">
//             <Button onClick={() => setZoneDialogOpen(false)}>Cancel</Button>
//             <Button theme="primary" onClick={handleAddZone}>
//               Add
//             </Button>
//           </HorizontalLayout>
//         }
//       >
//         <VerticalLayout theme="spacing">
//           <TextField
//             label="Zone Name"
//             value={zoneName}
//             onValueChanged={(e) => setZoneName(e.detail.value)}
//           />
//           <NumberField
//             label="Max Capacity"
//             value={zoneMaxCapacity}
//             onValueChanged={(e) => setZoneMaxCapacity(parseInt(e.detail.value) || 100)}
//           />
//           <span>Access Types</span>
//           <Checkbox
//             label="GENERAL"
//             checked={zoneGeneralAccess}
//             onCheckedChanged={(e) => setZoneGeneralAccess(e.detail.value)}
//           />
//           <Checkbox
//             label="BACKSTAGE"
//             checked={zoneBackstageAccess}
//             onCheckedChanged={(e) => setZoneBackstageAccess(e.detail.value)}
//           />
//           <Checkbox
//             label="STAGE"
//             checked={zoneStageAccess}
//             onCheckedChanged={(e) => setZoneStageAccess(e.detail.value)}
//           />
//         </VerticalLayout>
//       </Dialog>

//       {/* Checkpoint Dialog */}
//       <Dialog
//         opened={checkpointDialogOpen}
//         onOpenedChanged={(e) => setCheckpointDialogOpen(e.detail.value)}
//         header={`Add New Checkpoint to ${selectedZone?.name}`}
//         footer={
//           <HorizontalLayout theme="spacing">
//             <Button onClick={() => setCheckpointDialogOpen(false)}>Cancel</Button>
//             <Button theme="primary" onClick={handleAddCheckpoint}>
//               Add
//             </Button>
//           </HorizontalLayout>
//         }
//       >
//         <VerticalLayout theme="spacing">
//           <TextField
//             label="Checkpoint Name"
//             value={checkpointName}
//             onValueChanged={(e) => setCheckpointName(e.detail.value)}
//           />
//           <ComboBox
//             label="Type"
//             value={checkpointType}
//             onValueChanged={(e) => setCheckpointType(e.detail.value)}
//             items={['IN', 'OUT', 'IN_OUT']}
//           />
//           <TextField
//             label="Device ID"
//             value={checkpointDeviceId}
//             onValueChanged={(e) => setCheckpointDeviceId(e.detail.value)}
//           />
//           <TextField
//             label="Device Role"
//             value={checkpointDeviceRole}
//             onValueChanged={(e) => setCheckpointDeviceRole(e.detail.value)}
//           />
//         </VerticalLayout>
//       </Dialog>

//       {/* Subzone Dialog */}
//       <Dialog
//         opened={subzoneDialogOpen}
//         onOpenedChanged={(e) => setSubzoneDialogOpen(e.detail.value)}
//         header={`Add Subzone to ${selectedZone?.name}`}
//         footer={
//           <HorizontalLayout theme="spacing">
//             <Button onClick={() => setSubzoneDialogOpen(false)}>Cancel</Button>
//             <Button theme="primary" onClick={handleAddSubzone}>
//               Add
//             </Button>
//           </HorizontalLayout>
//         }
//       >
//         <VerticalLayout theme="spacing">
//           <TextField
//             label="Subzone Name"
//             value={subzoneName}
//             onValueChanged={(e) => setSubzoneName(e.detail.value)}
//           />
//           <NumberField
//             label="Max Capacity"
//             value={subzoneMaxCapacity}
//             onValueChanged={(e) => setSubzoneMaxCapacity(parseInt(e.detail.value) || 100)}
//           />
//           <span>Access Types</span>
//           <Checkbox
//             label="GENERAL"
//             checked={subzoneGeneralAccess}
//             onCheckedChanged={(e) => setSubzoneGeneralAccess(e.detail.value)}
//           />
//           <Checkbox
//             label="BACKSTAGE"
//             checked={subzoneBackstageAccess}
//             onCheckedChanged={(e) => setSubzoneBackstageAccess(e.detail.value)}
//           />
//           <Checkbox
//             label="STAGE"
//             checked={subzoneStageAccess}
//             onCheckedChanged={(e) => setSubzoneStageAccess(e.detail.value)}
//           />
//         </VerticalLayout>
//       </Dialog>
//     </>
//   );
// };

// export default Dialogs;