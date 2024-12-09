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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { skillService, Skill } from '../services/skillService';
import { domainService, Domain } from '../services/domainService';

const SkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({ name: '', domain_id: '', is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  useEffect(() => {
    fetchSkills();
    fetchDomains();
  }, [showInactive, selectedDomain]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      let fetchedSkills;
      if (selectedDomain) {
        fetchedSkills = await skillService.getSkillsByDomain(parseInt(selectedDomain), showInactive);
      } else {
        fetchedSkills = await skillService.getSkills(showInactive);
      }
      setSkills(fetchedSkills);
      setError(null);
    } catch (err) {
      setError('Failed to fetch skills');
      console.error('Error fetching skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const fetchedDomains = await domainService.getDomains(true);
      setDomains(fetchedDomains);
    } catch (err) {
      setError('Failed to fetch domains');
      console.error('Error fetching domains:', err);
    }
  };

  const handleOpenDialog = (skill: Skill | null = null) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({ name: skill.name, domain_id: skill.domain_id.toString(), is_active: skill.is_active });
    } else {
      setEditingSkill(null);
      setFormData({ name: '', domain_id: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSkill(null);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.domain_id) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      const skillData = {
        name: formData.name,
        domain_id: parseInt(formData.domain_id),
        is_active: formData.is_active
      };

      if (editingSkill) {
        await skillService.updateSkill(editingSkill.id, skillData);
      } else {
        await skillService.createSkill(skillData);
      }
      fetchSkills();
      handleCloseDialog();
      setError(null);  // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Failed to save skill');
      console.error('Error saving skill:', err);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await skillService.deleteSkill(id);
      } else {
        await skillService.reactivateSkill(id);
      }
      fetchSkills();
    } catch (err) {
      setError(`Failed to ${currentStatus ? 'deactivate' : 'reactivate'} skill`);
      console.error('Error toggling skill status:', err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Skill Management
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Skill
        </Button>
        <Box display="flex" alignItems="center">
          <FormControl style={{ minWidth: 120, marginRight: 16 }}>
            <InputLabel>Filter by Domain</InputLabel>
            <Select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as string)}
            >
              <MenuItem value="">All Domains</MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id.toString()}>{domain.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
              <TableCell>Domain</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell>{skill.name}</TableCell>
                <TableCell>{domains.find(d => d.id === skill.domain_id)?.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={skill.is_active ? "Active" : "Inactive"} 
                    color={skill.is_active ? "success" : "error"} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(skill)} size="small"  aria-label="Edit skill">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleToggleActive(skill.id, skill.is_active)} size="small" aria-label={skill.is_active ? 'Delete skill' : 'Restore skill'}>
                    {skill.is_active ? <DeleteIcon /> : <RestoreIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Skill Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleTextInputChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel htmlFor="domain-select">Domain</InputLabel>
              <Select
                id='domain-select'
                name="domain_id"
                value={formData.domain_id}
                onChange={handleSelectChange}
                required
                aria-label='Domain'
              >
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id.toString()}>{domain.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" alignItems="center" mt={2}>
              <Switch
                name="is_active"
                checked={formData.is_active}
                onChange={handleSwitchChange}
              />
              <Typography>Active</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingSkill ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SkillsPage;