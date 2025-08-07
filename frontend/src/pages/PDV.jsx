import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  QrCodeScanner as ScannerIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency } from '../utils/currency';

const PDV = () => {
  const [cartItems, setCartItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState(0);
  const { user } = useAuth();
  const barcodeInputRef = useRef(null);

  // Focar no input de código de barras quando a página carrega
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Buscar produto por código de barras
  const searchProductByBarcode = async (code) => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/products/barcode/${code}`);
      const product = response.data;
      
      if (product.stock <= 0) {
        setError('Produto sem estoque disponível');
        return;
      }
      
      addToCart(product);
      setBarcode('');
      
      // Focar novamente no input após adicionar
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Produto não encontrado');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Se já existe, aumenta a quantidade
        if (existingItem.quantity >= product.stock) {
          setError(`Estoque insuficiente. Disponível: ${product.stock}`);
          return prevItems;
        }
        
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Se não existe, adiciona novo item
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          barcode: product.barcode
        }];
      }
    });
  };

  // Remover item do carrinho
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Alterar quantidade do item
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          if (newQuantity > item.stock) {
            setError(`Estoque insuficiente. Disponível: ${item.stock}`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Calcular totais
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const change = amountReceived ? Math.max(0, parseFloat(amountReceived) - total) : 0;

  // Finalizar venda
  const finalizeSale = async () => {
    if (cartItems.length === 0) {
      setError('Carrinho vazio');
      return;
    }
    
    if (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < total)) {
      setError('Valor recebido insuficiente');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const saleData = {
        items: cartItems.map(item => ({
          product_id: parseInt(item.id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.price)
        })),
        payment_method: paymentMethod,
        discount_percentage: parseFloat(discount),
        amount_received: paymentMethod === 'dinheiro' ? parseFloat(amountReceived) : parseFloat(total)
      };
      
      await axios.post('/sales/', saleData);
      
      setSuccess('Venda finalizada com sucesso!');
      setCartItems([]);
      setPaymentDialogOpen(false);
      setAmountReceived('');
      setDiscount(0);
      setPaymentMethod('dinheiro');
      
      // Focar no input de código de barras
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };

  // Limpar carrinho
  const clearCart = () => {
    setCartItems([]);
    setError('');
    setSuccess('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Handle barcode input
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    searchProductByBarcode(barcode);
  };

  // Limpar mensagens após 3 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1565c0' }}>
        <Toolbar>
          <ScannerIcon sx={{ mr: 2 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            PDV - CAIXA ABERTO
          </Typography>
          <Chip 
            label={`Operador: ${user?.name}`} 
            color="secondary" 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }}
          />
        </Toolbar>
      </AppBar>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ m: 1 }}>
          {success}
        </Alert>
      )}
      
      {/* Layout Principal */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 120px)', p: 2 }}>
        {/* Left Panel - Scanner */}
        <Box sx={{ width: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Scanner */}
          <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              CÓDIGO DE BARRAS
            </Typography>
            
            <form onSubmit={handleBarcodeSubmit}>
              <TextField
                ref={barcodeInputRef}
                fullWidth
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Escaneie ou digite o código"
                autoFocus
                variant="outlined"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    bgcolor: 'white'
                  }
                }}
              />
            </form>
          </Paper>

          {/* Valor Unitário */}
          <Paper sx={{ p: 2, bgcolor: '#e8f5e8' }}>
            <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold' }}>
              VALOR UNITÁRIO
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              {cartItems.length > 0 ? formatCurrency(cartItems[cartItems.length - 1]?.price || 0) : formatCurrency(0)}
            </Typography>
          </Paper>

          {/* Total do Item */}
          <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
            <Typography variant="h6" gutterBottom color="warning.main" sx={{ fontWeight: 'bold' }}>
              TOTAL DO ITEM
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
              {cartItems.length > 0 ? formatCurrency((cartItems[cartItems.length - 1]?.price * cartItems[cartItems.length - 1]?.quantity) || 0) : formatCurrency(0)}
            </Typography>
          </Paper>

          {/* Código */}
          <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
            <Typography variant="h6" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
              CÓDIGO
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#7b1fa2', textAlign: 'center' }}>
              {barcode || '-----'}
            </Typography>
          </Paper>

          {/* Ações */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              onClick={clearCart}
              disabled={cartItems.length === 0}
              fullWidth
              size="large"
            >
              LIMPAR
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cartItems.length === 0}
              fullWidth
              size="large"
              startIcon={<PaymentIcon />}
            >
              FINALIZAR
            </Button>
          </Box>
        </Box>
        
        {/* Right Panel - Lista de Produtos */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Lista de Produtos */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            {/* Header da Lista */}
            <Box sx={{ bgcolor: '#1565c0', color: 'white', p: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                LISTA DE PRODUTOS
              </Typography>
            </Box>
            
            {cartItems.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="grey.500">
                  Nenhum produto escaneado
                </Typography>
                <Typography color="grey.400">
                  Escaneie um código de barras para começar
                </Typography>
              </Box>
            ) : (
              <>
                {/* Cabeçalho da Tabela */}
                <Box sx={{ bgcolor: '#e3f2fd', p: 1, borderBottom: '2px solid #1565c0' }}>
                  <Grid container spacing={1} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <Grid item xs={1}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Nº Item</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Código</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Descrição</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Qtd</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>Vlr. Unit.</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>Total</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Lista de Itens */}
                <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
                  {cartItems.map((item, index) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        p: 1, 
                        borderBottom: '1px solid #e0e0e0',
                        bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white',
                        '&:hover': { bgcolor: '#e3f2fd' }
                      }}
                    >
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {index + 1}
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {item.barcode}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {item.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              sx={{ width: 20, height: 20 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', fontWeight: 'bold' }}>
                              {item.quantity.toFixed(3)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              sx={{ width: 20, height: 20 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                            {formatCurrency(item.price)}
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                              {formatCurrency(item.price * item.quantity)}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.id)}
                              sx={{ width: 20, height: 20 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Painel de Totais */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {/* Subtotal */}
            <Paper sx={{ flex: 1, p: 2, bgcolor: '#e8f5e8' }}>
              <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                SUBTOTAL
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' }}>
                {formatCurrency(subtotal)}
              </Typography>
            </Paper>

            {/* Total Recebido */}
            <Paper sx={{ flex: 1, p: 2, bgcolor: '#e3f2fd' }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                TOTAL RECEBIDO
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#1565c0', textAlign: 'center' }}>
                {formatCurrency(parseFloat(amountReceived) || 0)}
              </Typography>
            </Paper>

            {/* Troco */}
            <Paper sx={{ flex: 1, p: 2, bgcolor: '#fff3e0' }}>
              <Typography variant="h6" gutterBottom color="warning.main" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                TROCO
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}>
                {formatCurrency(change)}
              </Typography>
            </Paper>
          </Box>

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setCartItems([])}
              disabled={cartItems.length === 0}
              size="large"
              sx={{ flex: 1, py: 2, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              LIMPAR VENDA
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cartItems.length === 0}
              startIcon={<PaymentIcon />}
              size="large"
              sx={{ flex: 2, py: 2, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              FINALIZAR VENDA
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Dialog de Pagamento */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon /> Finalizar Pagamento
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Método de Pagamento</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Método de Pagamento"
              >
                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
              </Select>
            </FormControl>
            
            {paymentMethod === 'dinheiro' && (
              <CurrencyInput
                fullWidth
                label="Valor Recebido"
                value={amountReceived}
                onChange={setAmountReceived}
                sx={{ mb: 2 }}
                InputProps={{
                  style: { fontSize: '1.2rem' }
                }}
              />
            )}
            
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Resumo do Pagamento
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total da Venda:</Typography>
                <Typography fontWeight="bold">{formatCurrency(total)}</Typography>
              </Box>
              {paymentMethod === 'dinheiro' && amountReceived && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Valor Recebido:</Typography>
                    <Typography>{formatCurrency(parseFloat(amountReceived))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Troco:</Typography>
                    <Typography fontWeight="bold" color={change >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(change)}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={finalizeSale}
            variant="contained"
            disabled={loading || (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < total))}
            size="large"
          >
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDV;