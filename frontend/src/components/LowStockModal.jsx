import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';

const LowStockModal = ({ open, onClose, onProductUpdated }) => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      loadLowStockProducts();
    }
  }, [open]);

  const loadLowStockProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/dashboard/low-stock');
      setLowStockProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos com estoque baixo:', error);
      setError('Erro ao carregar produtos com estoque baixo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setNewStock(product.stock.toString());
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewStock('');
  };

  const handleSaveStock = async (productId) => {
    try {
      setUpdating(true);
      setError('');
      
      const stockValue = parseInt(newStock);
      if (isNaN(stockValue) || stockValue < 0) {
        setError('Estoque deve ser um número válido e não negativo');
        return;
      }

      await axios.put(`/products/${productId}/stock`, {
        quantity: stockValue,
        type: 'set'
      });

      // Recarregar a lista de produtos com estoque baixo
      await loadLowStockProducts();
      
      // Notificar o componente pai para atualizar o dashboard
      if (onProductUpdated) {
        onProductUpdated();
      }

      setEditingProduct(null);
      setNewStock('');
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      setError('Erro ao atualizar estoque do produto');
    } finally {
      setUpdating(false);
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { label: 'SEM ESTOQUE', color: 'error', severity: 'high' };
    } else if (product.stock <= product.min_stock / 2) {
      return { label: 'CRÍTICO', color: 'error', severity: 'high' };
    } else {
      return { label: 'BAIXO', color: 'warning', severity: 'medium' };
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: '#fff3e0',
        color: '#e65100'
      }}>
        <WarningIcon />
        Produtos com Estoque Baixo
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : lowStockProducts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              🎉 Nenhum produto com estoque baixo!
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Todos os produtos estão com estoque adequado.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estoque Atual</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estoque Mínimo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Preço</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isEditing = editingProduct === product.id;
                  
                  return (
                    <TableRow 
                      key={product.id}
                      sx={{ 
                        backgroundColor: stockStatus.severity === 'high' ? '#ffebee' : '#fff8e1',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {product.name}
                        </Typography>
                        {product.barcode && (
                          <Typography variant="caption" color="textSecondary">
                            {product.barcode}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.category?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                            disabled={updating}
                          />
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: product.stock === 0 ? '#d32f2f' : '#f57c00'
                            }}
                          >
                            {product.stock} {product.unit}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.min_stock} {product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={stockStatus.label} 
                          color={stockStatus.color} 
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(product.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleSaveStock(product.id)}
                              disabled={updating}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={handleCancelEdit}
                              disabled={updating}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditClick(product)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {lowStockProducts.length > 0 && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              💡 <strong>Dica:</strong> Clique no ícone de edição para atualizar o estoque de um produto.
              Quando o estoque for atualizado acima do mínimo, o produto sairá automaticamente desta lista.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        <Button 
          onClick={loadLowStockProducts} 
          variant="contained"
          disabled={loading}
        >
          Atualizar Lista
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LowStockModal;