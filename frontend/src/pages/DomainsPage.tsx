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
import { domainService, Domain } from '../services/domainService';

const DomainsPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, [showInactive]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const fetchedDomains = await domainService.getDomains(showInactive);
      setDomains(fetchedDomains);
      setError(null);
    } catch (err) {
      setError('Failed to fetch domains');
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (domain: Domain | null = null) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({ name: domain.name, is_active: domain.is_active });
    } else {
      setEditingDomain(null);
      setFormData({ name: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDomain(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'is_active' ? checked : value });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      if (editingDomain) {
        await domainService.updateDomain(editingDomain.id, formData);
      } else {
        await domainService.createDomain(formData);
      }
      fetchDomains();
      handleCloseDialog();
      setError(null);  // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Failed to save domain');
      console.error('Error saving domain:', err);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await domainService.deleteDomain(id);
      } else {
        await domainService.reactivateDomain(id);
      }
      fetchDomains();
    } catch (err) {
      setError(`Failed to ${currentStatus ? 'deactivate' : 'reactivate'} domain`);
      console.error('Error toggling domain status:', err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Domain Management
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Domain
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
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell>{domain.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={domain.is_active ? "Active" : "Inactive"} 
                    color={domain.is_active ? "success" : "error"} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(domain)} aria-label="Edit domain" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleToggleActive(domain.id, domain.is_active)} size="small" aria-label={domain.is_active ? 'Delete domain' : 'Restore domain'}>
                    {domain.is_active ? <DeleteIcon /> : <RestoreIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingDomain ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Domain Name"
            type="text"
            fullWidth
            required
            value={formData.name}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingDomain ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DomainsPage;