import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Switch,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { clientService, Client } from '../services/clientService';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_person: '',
    email: '',
    phone: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [showInactive]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const fetchedClients = await clientService.getClients(showInactive);
      setClients(fetchedClients);
      setError(null);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (client: Client | null = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        name: client.name, 
        industry: client.industry, 
        contact_person: client.contact_person,
        email: client.email,
        phone: client.phone,
        is_active: client.is_active
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', industry: '', contact_person: '', email: '', phone: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'is_active' ? checked : value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.industry || !formData.contact_person || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData);
      } else {
        await clientService.createClient(formData);
      }
      fetchClients();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to save client');
      console.error('Error saving client:', err);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await clientService.deleteClient(id);
      } else {
        await clientService.reactivateClient(id);
      }
      fetchClients();
    } catch (err) {
      setError(`Failed to ${currentStatus ? 'deactivate' : 'reactivate'} client`);
      console.error('Error toggling client status:', err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Client Management
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Client
        </Button>
        <Box display="flex" alignItems="center">
          <Typography variant="body1" mr={1}>Show Inactive</Typography>
          <Switch
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
        </Box>
      </Box>
      {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.industry}</TableCell>
                <TableCell>{client.contact_person}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  <Chip 
                    label={client.is_active ? "Active" : "Inactive"} 
                    color={client.is_active ? "success" : "error"} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(client)} size="small" aria-label='Edit Client'>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleToggleActive(client.id, client.is_active)} size="small" aria-label={client.is_active ? 'Delete Client' : 'Restore Client'}>
                    {client.is_active ? <DeleteIcon /> : <RestoreIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Client Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="industry"
              label="Industry"
              type="text"
              fullWidth
              required
              value={formData.industry}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="contact_person"
              label="Contact Person"
              type="text"
              fullWidth
              required
              value={formData.contact_person}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone"
              type="tel"
              fullWidth
              required
              value={formData.phone}
              onChange={handleInputChange}
            />
            <Box display="flex" alignItems="center" mt={2}>
              <Switch
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <Typography>Active</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingClient ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientsPage;