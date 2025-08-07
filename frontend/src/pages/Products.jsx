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
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency } from '../utils/currency';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    active: '',
    lowStock: false
  });
  const { isManager, isAdmin, user } = useAuth();

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category_id', filters.category);
      if (filters.active !== '') params.append('active', filters.active);
      if (filters.lowStock) params.append('low_stock', 'true');

      const response = await axios.get(`/products/?${params}`);
      setProducts(response.data);
    } catch (error) {
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/categories/?active=true');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleOpenDialog = (product = null) => {
    setEditingProduct(product);
    if (product) {
      reset({
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        stock: product.stock,
        min_stock: product.min_stock,
        unit: product.unit,
        category_id: product.category_id,
        active: product.active
      });
    } else {
      reset({
        name: '',
        barcode: '',
        price: '',
        stock: '',
        min_stock: 10,
        unit: 'un',
        category_id: '',
        active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      // Converter campos numéricos para os tipos corretos
      const productData = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        min_stock: parseInt(data.min_stock),
        category_id: parseInt(data.category_id)
      };

      if (editingProduct) {
        await axios.put(`/products/${editingProduct.id}`, productData);
        setSuccess('Produto atualizado com sucesso!');
      } else {
        await axios.post('/products/', productData);
        setSuccess('Produto criado com sucesso!');
      }
      handleCloseDialog();
      loadProducts();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin()) {
      setError('Apenas administradores podem excluir produtos. Faça login como admin.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await axios.delete(`/products/${id}`);
        setSuccess('Produto excluído com sucesso!');
        loadProducts();
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao excluir produto');
      }
    }
  };



  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nome', width: 200 },
    { field: 'barcode', headerName: 'Código de Barras', width: 150 },
    {
      field: 'price',
      headerName: 'Preço',
      width: 120,
      renderCell: (params) => formatCurrency(params.value)
    },
    { field: 'stock', headerName: 'Estoque', width: 100 },
    { field: 'min_stock', headerName: 'Estoque Mín.', width: 120 },
    { field: 'unit', headerName: 'Unidade', width: 100 },
    {
      field: 'category',
      headerName: 'Categoria',
      width: 150,
      renderCell: (params) => params.row.category?.name || 'N/A'
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Ativo' : 'Inativo'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 150,
      renderCell: (params) => (
        <Box>
          {isManager() && (
            <Button
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
          )}
          {isAdmin() && (
            <Button
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
              startIcon={<DeleteIcon />}
            >
              Excluir
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Produtos
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

      {!isAdmin() && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Para excluir produtos, faça login como administrador (admin@pdv.com / admin123)
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
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
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
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
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.lowStock}
                  onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                />
              }
              label="Apenas estoque baixo"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            {isManager() && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Novo Produto
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={products}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Dialog para criar/editar produto */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <Controller
                  name="barcode"
                  control={control}
                  rules={{ required: 'Código de barras é obrigatório' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Código de Barras"
                      error={!!errors.barcode}
                      helperText={errors.barcode?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="price"
                  control={control}
                  rules={{ required: 'Preço é obrigatório', min: { value: 0.01, message: 'Preço deve ser maior que 0' } }}
                  render={({ field }) => (
                    <CurrencyInput
                      {...field}
                      fullWidth
                      label="Preço"
                      error={!!errors.price}
                      helperText={errors.price?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="stock"
                  control={control}
                  rules={{ required: 'Estoque é obrigatório', min: { value: 0, message: 'Estoque não pode ser negativo' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Estoque"
                      type="number"
                      error={!!errors.stock}
                      helperText={errors.stock?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="min_stock"
                  control={control}
                  rules={{ required: 'Estoque mínimo é obrigatório', min: { value: 0, message: 'Estoque mínimo não pode ser negativo' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Estoque Mínimo"
                      type="number"
                      error={!!errors.min_stock}
                      helperText={errors.min_stock?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="unit"
                  control={control}
                  rules={{ required: 'Unidade é obrigatória' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.unit}>
                      <InputLabel>Unidade</InputLabel>
                      <Select {...field} label="Unidade">
                        <MenuItem value="un">Unidade</MenuItem>
                        <MenuItem value="kg">Quilograma</MenuItem>
                        <MenuItem value="g">Grama</MenuItem>
                        <MenuItem value="l">Litro</MenuItem>
                        <MenuItem value="ml">Mililitro</MenuItem>
                        <MenuItem value="m">Metro</MenuItem>
                        <MenuItem value="cm">Centímetro</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="category_id"
                  control={control}
                  rules={{ required: 'Categoria é obrigatória' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.category_id}>
                      <InputLabel>Categoria</InputLabel>
                      <Select {...field} label="Categoria">
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
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
                      label="Produto Ativo"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Products;