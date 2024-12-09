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
import { locationService, Location } from '../services/locationService';

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [showInactive]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const fetchedLocations = await locationService.getLocations(showInactive);
      setLocations(fetchedLocations);
      setError(null);
    } catch (err) {
      setError('Failed to fetch locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location: Location | null = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({ 
        name: location.name, 
        country: location.country, 
        description: location.description || '',
        is_active: location.is_active
      });
    } else {
      setEditingLocation(null);
      setFormData({ name: '', country: '', description: '', is_active: true });
    }
    setIsSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'is_active' ? checked : value });
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    if (!formData.name.trim() || !formData.country.trim()) return;

    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, {
          name: formData.name,
          country: formData.country,
          description: formData.description,
          is_active: formData.is_active  // Explicitly include is_active
        });
      } else {
        await locationService.createLocation(formData);
      }
      fetchLocations();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to save location');
      console.error('Error saving location:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await locationService.deleteLocation(id);
        fetchLocations();
      } catch (err) {
        setError('Failed to delete location');
        console.error('Error deleting location:', err);
      }
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await locationService.reactivateLocation(id);
      fetchLocations();
    } catch (err) {
      setError('Failed to reactivate location');
      console.error('Error reactivating location:', err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Location Management
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Location
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
              <TableCell>Country</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.country}</TableCell>
                <TableCell>{location.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={location.is_active ? "Active" : "Inactive"} 
                    color={location.is_active ? "success" : "error"} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(location)} size="small" aria-label='Edit Location'>
                    <EditIcon />
                  </IconButton>
                  {location.is_active ? (
                    <IconButton onClick={() => handleDelete(location.id)} size="small" aria-label='Delete Location'>
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => handleReactivate(location.id)} size="small" aria-label='Restore Location'>
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Location Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
              error={isSubmitted && !formData.name.trim()}
              helperText={isSubmitted && !formData.name.trim() ? 'Location name is required' : ''}
            />
            <TextField
              margin="dense"
              name="country"
              label="Country"
              type="text"
              fullWidth
              required
              value={formData.country}
              onChange={handleInputChange}
              error={isSubmitted && !formData.country.trim()}
              helperText={isSubmitted && !formData.country.trim() ? 'Country is required' : ''}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              value={formData.description}
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
            {editingLocation ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LocationsPage;