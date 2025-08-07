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
  Chip,
  Alert,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
// import TestConnection from '../components/TestConnection'; // Removido temporariamente

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    active: ''
  });
  const { isManager } = useAuth();

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Iniciando carregamento de categorias...');
      console.log('🔗 BaseURL do axios:', axios.defaults.baseURL);
      console.log('🔑 Token de autorização:', axios.defaults.headers.common['Authorization'] ? 'Configurado' : 'Não configurado');
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.active !== '') params.append('active', filters.active);

      const url = `/categories/${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('📡 Fazendo requisição para:', url);
      
      const response = await axios.get(url);
      console.log('✅ Resposta recebida:', response.status, response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        console.log(`📊 ${response.data.length} categorias carregadas com sucesso`);
      } else {
        console.error('❌ Formato de resposta inválido:', response.data);
        setCategories([]);
        setError('Formato de resposta inválido do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      
      let errorMessage = 'Erro ao carregar categorias';
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        console.error('🌐 Erro de rede detectado');
      } else if (error.response) {
        const status = error.response.status;
        console.error(`📡 Erro HTTP ${status}:`, error.response.data);
        switch (status) {
          case 401:
            errorMessage = 'Token de autenticação inválido ou expirado. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Acesso negado. Verifique suas permissões.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = `Erro HTTP ${status}: ${error.response.data?.message || 'Erro desconhecido'}`;
        }
      } else if (error.request) {
        errorMessage = 'Servidor não respondeu. Verifique se o backend está rodando.';
        console.error('🔌 Servidor não respondeu:', error.request);
      } else {
        errorMessage = error.message;
        console.error('⚠️ Erro desconhecido:', error.message);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    setEditingCategory(category);
    if (category) {
      reset({
        name: category.name,
        description: category.description,
        active: category.active
      });
    } else {
      reset({
        name: '',
        description: '',
        active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await axios.put(`/categories/${editingCategory.id}/`, data);
        setSuccess('Categoria atualizada com sucesso!');
      } else {
        await axios.post('/categories/', data);
        setSuccess('Categoria criada com sucesso!');
      }
      handleCloseDialog();
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await axios.delete(`/categories/${id}/`);
        setSuccess('Categoria excluída com sucesso!');
        loadCategories();
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao excluir categoria');
      }
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nome', width: 200 },
    { field: 'description', headerName: 'Descrição', width: 300 },
    {
      field: 'products_count',
      headerName: 'Produtos',
      width: 120,
      renderCell: (params) => params.row.products?.length || 0
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
          {isManager() && (
            <>
              <Button
                size="small"
                onClick={() => handleOpenDialog(params.row)}
                startIcon={<EditIcon />}
                sx={{ mr: 1 }}
              >
                Editar
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(params.row.id)}
                startIcon={<DeleteIcon />}
              >
                Excluir
              </Button>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Categorias
      </Typography>

      {/* <TestConnection /> Removido temporariamente */}

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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
            {isManager() && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nova Categoria
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={categories}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Dialog para criar/editar categoria */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descrição"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
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
                      label="Categoria Ativa"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingCategory ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Categories;