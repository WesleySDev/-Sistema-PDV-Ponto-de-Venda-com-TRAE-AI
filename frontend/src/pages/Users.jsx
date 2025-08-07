import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    active: ''
  });
  const { isAdmin, user: currentUser } = useAuth();

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
    }
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.active !== '') params.append('active', filters.active);

      const response = await axios.get(`/users/?${params}`);
      setUsers(response.data);
    } catch (error) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        password: '' // Não preencher senha ao editar
      });
    } else {
      reset({
        name: '',
        email: '',
        role: 'cashier',
        active: true,
        password: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      // Se estiver editando e a senha estiver vazia, remover do payload
      if (editingUser && !data.password) {
        delete data.password;
      }

      if (editingUser) {
        await axios.put(`/users/${editingUser.id}/`, data);
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        await axios.post('/users/', data);
        setSuccess('Usuário criado com sucesso!');
      }
      handleCloseDialog();
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await axios.delete(`/users/${id}/`);
        setSuccess('Usuário excluído com sucesso!');
        loadUsers();
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao excluir usuário');
      }
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'cashier': return 'Operador de Caixa';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'cashier': return 'info';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nome', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'role',
      headerName: 'Função',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getRoleLabel(params.value)}
          color={getRoleColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Ativo' : 'Inativo'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'created_at',
      headerName: 'Criado em',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString('pt-BR')
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
            disabled={params.row.id === currentUser?.id} // Não pode editar a si mesmo
          >
            Editar
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            startIcon={<DeleteIcon />}
            disabled={params.row.id === currentUser?.id} // Não pode excluir a si mesmo
          >
            Excluir
          </Button>
        </Box>
      )
    }
  ];

  if (!isAdmin()) {
    return (
      <Box>
        <Alert severity="error">
          Acesso negado. Apenas administradores podem gerenciar usuários.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Usuários
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Função</InputLabel>
              <Select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                label="Função"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="manager">Gerente</MenuItem>
                <MenuItem value="cashier">Operador de Caixa</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.active}
                onChange={(e) => setFilters({ ...filters, active: e.target.value })}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Usuário
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Dialog para criar/editar usuário */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Nome é obrigatório' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nome"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  rules={editingUser ? {} : { required: 'Senha é obrigatória' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: 'Função é obrigatória' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.role}>
                      <InputLabel>Função</InputLabel>
                      <Select {...field} label="Função">
                        <MenuItem value="cashier">Operador de Caixa</MenuItem>
                        <MenuItem value="manager">Gerente</MenuItem>
                        <MenuItem value="admin">Administrador</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Usuário Ativo"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users;