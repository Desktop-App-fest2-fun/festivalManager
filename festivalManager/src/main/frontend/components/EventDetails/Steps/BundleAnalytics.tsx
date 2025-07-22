import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface BundleData {
  name: string;
  totalInvitations: number;
  sent: number;
  accepted: number;
  general: number;
  vip: number;
  compromis: number;
  backstage: number;
  status: string;
}

const bundleData: BundleData[] = [
  {
    name: "Nike",
    totalInvitations: 50,
    sent: 48,
    accepted: 45,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "Coca-Cola",
    totalInvitations: 50,
    sent: 47,
    accepted: 43,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "Marketing",
    totalInvitations: 50,
    sent: 46,
    accepted: 42,
    general: 20,
    vip: 10,
    compromis: 15,
    backstage: 5,
    status: "DRAFT",
  },
  {
    name: "Sales",
    totalInvitations: 50,
    sent: 45,
    accepted: 40,
    general: 25,
    vip: 10,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "Human Resources",
    totalInvitations: 50,
    sent: 44,
    accepted: 41,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "John Doe",
    totalInvitations: 50,
    sent: 48,
    accepted: 46,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "Adidas",
    totalInvitations: 50,
    sent: 47,
    accepted: 44,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "DRAFT",
  },
  {
    name: "Pepsi",
    totalInvitations: 50,
    sent: 46,
    accepted: 43,
    general: 25,
    vip: 10,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "Finance",
    totalInvitations: 50,
    sent: 45,
    accepted: 42,
    general: 20,
    vip: 15,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
  {
    name: "VIP Guests",
    totalInvitations: 50,
    sent: 49,
    accepted: 47,
    general: 15,
    vip: 20,
    compromis: 10,
    backstage: 5,
    status: "ACTIVE",
  },
];

export const BundleAnalytics = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pt: 2, pb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bundle Allocation Details
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2">Bundle Name</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Total Invitations</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Sent</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Accepted</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">General</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">VIP</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Compromis</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Backstage</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Status</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bundleData.map((bundle, index) => (
                <TableRow key={index}>
                  <TableCell>{bundle.name}</TableCell>
                  <TableCell>{bundle.totalInvitations}</TableCell>
                  <TableCell>{bundle.sent}</TableCell>
                  <TableCell>{bundle.accepted}</TableCell>
                  <TableCell>{bundle.general}</TableCell>
                  <TableCell>{bundle.vip}</TableCell>
                  <TableCell>{bundle.compromis}</TableCell>
                  <TableCell>{bundle.backstage}</TableCell>
                  <TableCell>{bundle.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default BundleAnalytics;
