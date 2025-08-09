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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import NumberInput from '../components/NumberInput';
import { formatCurrency } from '../utils/currency';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_method: '',
    start_date: '',
    end_date: ''
  });
  const { isManager } = useAuth();

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      items: [{ product_id: '', quantity: 1, price: 0 }],
      payment_method: 'money',
      discount: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');

  useEffect(() => {
    loadSales();
    loadProducts();
  }, [filters]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`/sales/?${params}`);
      setSales(response.data);
    } catch (error) {
      setError('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get('/products/?active=true');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleOpenDialog = () => {
    reset({
      items: [{ product_id: '', quantity: 1, price: 0 }],
      payment_method: 'money',
      discount: 0
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
  };

  const handleViewSale = async (saleId) => {
    try {
      const response = await axios.get(`/sales/${saleId}`);
      setSelectedSale(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      setError('Erro ao carregar detalhes da venda');
    }
  };

  const handleCancelSale = async (saleId) => {
    if (window.confirm('Tem certeza que deseja cancelar esta venda?')) {
      try {
        await axios.put(`/sales/${saleId}/cancel/`);
        setSuccess('Venda cancelada com sucesso!');
        loadSales();
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao cancelar venda');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      // Filtrar itens válidos
      const validItems = data.items.filter(item => item.product_id && item.quantity > 0);
      
      if (validItems.length === 0) {
        setError('Adicione pelo menos um item à venda');
        return;
      }

      // Converter campos numéricos para os tipos corretos
      const saleData = {
        ...data,
        discount: parseFloat(data.discount) || 0,
        items: validItems.map(item => ({
          ...item,
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      };

      await axios.post('/sales/', saleData);
      setSuccess('Venda realizada com sucesso!');
      handleCloseDialog();
      loadSales();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao realizar venda');
    }
  };

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.price`, product.price);
    }
  };

  const calculateSubtotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = watchedDiscount || 0;
    return Math.max(0, subtotal - discount);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'money': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      default: return method;
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'created_at',
      headerName: 'Data',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleString('pt-BR')
    },
    {
      field: 'user',
      headerName: 'Vendedor',
      width: 150,
      renderCell: (params) => params.row.user?.name || 'N/A'
    },
    {
      field: 'items_count',
      headerName: 'Itens',
      width: 100,
      renderCell: (params) => params.row.items?.length || 0
    },
    {
      field: 'subtotal',
      headerName: 'Subtotal',
      width: 120,
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'discount',
      headerName: 'Desconto',
      width: 120,
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'final_total',
      headerName: 'Total',
      width: 120,
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'payment_method',
      headerName: 'Pagamento',
      width: 120,
      renderCell: (params) => getPaymentMethodLabel(params.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleViewSale(params.row.id)}
            title="Ver detalhes"
          >
            <ViewIcon />
          </IconButton>
          {params.row.status === 'completed' && isManager() && (
            <IconButton
              size="small"
              color="error"
              onClick={() => handleCancelSale(params.row.id)}
              title="Cancelar venda"
            >
              <CancelIcon />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vendas
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
          <Grid item xs={12} md={2}>
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="completed">Concluída</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Pagamento</InputLabel>
              <Select
                value={filters.payment_method}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                label="Pagamento"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="money">Dinheiro</MenuItem>
                <MenuItem value="card">Cartão</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Data Inicial"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Data Final"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CartIcon />}
              onClick={handleOpenDialog}
            >
              Nova Venda
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={sales}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Dialog para nova venda */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            Nova Venda
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Itens da Venda
              </Typography>
              
              {fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={5}>
                    <Controller
                      name={`items.${index}.product_id`}
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={products}
                          getOptionLabel={(option) => option.name || ''}
                          value={products.find(p => p.id === field.value) || null}
                          onChange={(_, value) => {
                            field.onChange(value?.id || '');
                            handleProductChange(index, value?.id);
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Produto" fullWidth />
                          )}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          {...field}
                          label="Quantidade"
                          fullWidth
                          min={1}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`items.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <CurrencyInput
                          {...field}
                          label="Preço Unitário"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box display="flex" alignItems="center" height="100%">
                      <Typography variant="body2">
                        {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0))}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={() => append({ product_id: '', quantity: 1, price: 0 })}
                sx={{ mb: 3 }}
              >
                Adicionar Item
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="payment_method"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Método de Pagamento</InputLabel>
                        <Select {...field} label="Método de Pagamento">
                          <MenuItem value="money">Dinheiro</MenuItem>
                          <MenuItem value="card">Cartão</MenuItem>
                          <MenuItem value="pix">PIX</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="discount"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        {...field}
                        label="Desconto"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">
                  Subtotal: {formatCurrency(calculateSubtotal())}
                </Typography>
                <Typography variant="h6">
                  Desconto: {formatCurrency(watchedDiscount || 0)}
                </Typography>
                <Typography variant="h5" color="primary">
                  Total: {formatCurrency(calculateTotal())}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Finalizar Venda
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog para visualizar venda */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes da Venda #{selectedSale?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Data:</strong> {new Date(selectedSale.created_at).toLocaleString('pt-BR')}</Typography>
                  <Typography><strong>Vendedor:</strong> {selectedSale.user?.name}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedSale.status)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Pagamento:</strong> {getPaymentMethodLabel(selectedSale.payment_method)}</Typography>
                  <Typography><strong>Subtotal:</strong> {formatCurrency(selectedSale.subtotal)}</Typography>
                  <Typography><strong>Desconto:</strong> {formatCurrency(selectedSale.discount)}</Typography>
                  <Typography><strong>Total:</strong> {formatCurrency(selectedSale.final_total)}</Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                Itens da Venda
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                      <TableCell align="right">Preço Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSale.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;