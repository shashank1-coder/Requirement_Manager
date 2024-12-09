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
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { statusService, Status } from '../services/statusService';

const StatusIndicator = styled('span')<{ active: boolean }>(({ theme, active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '16px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  color: active ? theme.palette.success.main : theme.palette.error.main,
  backgroundColor: active ? theme.palette.success.light : theme.palette.error.light,
  opacity: 0.8,
}));

const StatusManagementPage: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const fetchedStatuses = await statusService.getStatuses();
      setStatuses(fetchedStatuses);
      setError(null);
    } catch (err) {
      setError('Failed to fetch statuses');
      console.error('Error fetching statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (status: Status | null = null) => {
    if (status) {
      setEditingStatus(status);
      setFormData({ 
        name: status.name, 
        description: status.description, 
        is_active: status.is_active 
      });
    } else {
      setEditingStatus(null);
      setFormData({ name: '', description: '', is_active: true });
    }
    setIsSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStatus(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'is_active' ? checked : value });
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    if (!formData.name.trim()) return;

    try {
      if (editingStatus) {
        await statusService.updateStatus(editingStatus.id, formData);
      } else {
        await statusService.createStatus(formData);
      }
      fetchStatuses();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to save status');
      console.error('Error saving status:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this status?')) {
      try {
        await statusService.deleteStatus(id);
        fetchStatuses();
      } catch (err) {
        setError('Failed to delete status');
        console.error('Error deleting status:', err);
      }
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Status Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        style={{ marginBottom: '20px' }}
      >
        Add New Status
      </Button>
      {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell>{status.name}</TableCell>
                <TableCell>{status.description}</TableCell>
                <TableCell>
                  <StatusIndicator active={status.is_active}>
                    {status.is_active ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
                    {status.is_active ? 'Active' : 'Inactive'}
                  </StatusIndicator>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(status)} size="small" aria-label='Edit status'>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(status.id)} size="small" aria-label='Delete status'>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingStatus ? 'Edit Status' : 'Add New Status'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Status Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
              error={isSubmitted && !formData.name.trim()}
              helperText={isSubmitted && !formData.name.trim() ? 'Status name is required' : ''}
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
            <Box display="flex" alignItems="center" marginTop={2}>
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
            {editingStatus ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StatusManagementPage;