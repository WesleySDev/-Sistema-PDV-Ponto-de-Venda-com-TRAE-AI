import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { isPrinterAvailable, printReceipt, previewReceipt, detectThermalPrinter } from '../utils/printer';
import { formatCurrency } from '../utils/currency';

const PrinterSettings = ({ open, onClose }) => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printerAvailable, setPrinterAvailable] = useState(false);
  const [thermalPrinterDetected, setThermalPrinterDetected] = useState(false);
  const [checkingPrinters, setCheckingPrinters] = useState(false);

  // Verificar status das impressoras quando o dialog abrir
  useEffect(() => {
    if (open) {
      checkPrinterStatus();
    }
  }, [open]);

  const checkPrinterStatus = async () => {
    setCheckingPrinters(true);
    try {
      const printerCheck = await isPrinterAvailable();
      const thermalCheck = await detectThermalPrinter();
      
      setPrinterAvailable(printerCheck);
      setThermalPrinterDetected(thermalCheck);
    } catch (error) {
      console.error('Erro ao verificar impressoras:', error);
      setPrinterAvailable(false);
      setThermalPrinterDetected(false);
    } finally {
      setCheckingPrinters(false);
    }
  };

  // Dados de teste para a nota fiscal
  const testSaleData = {
    payment_method: 'dinheiro',
    discount_percentage: 10,
    amount_received: 50.00,
    vendedor: 'Teste Sistema'
  };

  const testCartItems = [
    {
      id: 1,
      name: 'Produto Teste 1',
      barcode: '7891234567890',
      price: 15.50,
      quantity: 2
    },
    {
      id: 2,
      name: 'Produto Teste 2',
      barcode: '7891234567891',
      price: 8.75,
      quantity: 1
    }
  ];

  const testTotals = {
    subtotal: 39.75,
    discount: 10,
    discountPercentage: 10,
    discountAmount: 3.98,
    total: 35.77,
    change: 14.23
  };

  const handleTestPrint = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Verifica primeiro se há impressora térmica conectada
      const thermalPrinter = await detectThermalPrinter();
      const printerCheck = await isPrinterAvailable();
      
      if (!printerCheck) {
        setTestResult({
          success: false,
          message: 'Impressora não disponível. Verifique se há uma impressora configurada no sistema.'
        });
        return;
      }
      
      if (thermalPrinter) {
        setTestResult({
          success: true,
          message: 'Impressora térmica detectada! Enviando teste de impressão...'
        });
      }

      const printSuccess = await printReceipt(testSaleData, testCartItems, testTotals);
      
      if (printSuccess) {
        setTestResult({
          success: true,
          message: 'Teste de impressão enviado com sucesso! Verifique se a nota fiscal foi impressa.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Falha no teste de impressão. Verifique a conexão com a impressora.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro durante o teste: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewReceipt = () => {
    try {
      previewReceipt(testSaleData, testCartItems, testTotals);
      setTestResult({
        success: true,
        message: 'Preview da nota fiscal aberto em nova janela.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao abrir preview: ${error.message}`
      });
    }
  };

  // Status da impressora agora vem dos estados

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          Configurações de Impressora
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Status das Impressoras
          </Typography>
          
          {checkingPrinters ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography>Verificando impressoras...</Typography>
            </Box>
          ) : (
            <>
              {/* Status Impressora Térmica */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {thermalPrinterDetected ? (
                  <>
                    <CheckIcon color="success" />
                    <Chip label="Impressora Térmica Conectada" color="success" size="small" />
                  </>
                ) : (
                  <>
                    <ErrorIcon color="warning" />
                    <Chip label="Impressora Térmica Não Detectada" color="warning" size="small" />
                  </>
                )}
              </Box>
              
              {/* Status Impressora Geral */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {printerAvailable ? (
                  <>
                    <CheckIcon color="success" />
                    <Chip label="Sistema de Impressão Disponível" color="success" size="small" />
                  </>
                ) : (
                  <>
                    <ErrorIcon color="error" />
                    <Chip label="Sistema de Impressão Indisponível" color="error" size="small" />
                  </>
                )}
              </Box>
            </>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {thermalPrinterDetected 
              ? 'Impressora térmica detectada! As notas fiscais serão impressas automaticamente na impressora térmica.'
              : printerAvailable 
                ? 'Sistema de impressão disponível. As notas fiscais serão enviadas para a impressora padrão do sistema.'
                : 'Nenhuma impressora detectada. Verifique se há uma impressora configurada e conectada ao sistema.'}
          </Typography>
          
          <Button 
            onClick={checkPrinterStatus} 
            variant="outlined" 
            size="small"
            disabled={checkingPrinters}
          >
            {checkingPrinters ? 'Verificando...' : 'Verificar Novamente'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Teste de Impressão
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use os botões abaixo para testar a funcionalidade de impressão de nota fiscal:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePreviewReceipt}
              fullWidth
            >
              Visualizar Nota Fiscal
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handleTestPrint}
              disabled={loading || !printerAvailable}
              fullWidth
            >
              {loading ? 'Testando...' : 'Testar Impressão'}
            </Button>
          </Box>
        </Box>

        {testResult && (
          <Alert 
            severity={testResult.success ? 'success' : 'error'} 
            sx={{ mb: 2 }}
          >
            {testResult.message}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Dados do Teste
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Itens:</strong> {testCartItems.length} produtos
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Subtotal:</strong> {formatCurrency(testTotals.subtotal)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Desconto:</strong> {formatCurrency(testTotals.discountAmount)} ({testTotals.discountPercentage}%)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total:</strong> {formatCurrency(testTotals.total)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Pagamento:</strong> Dinheiro
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Valor Recebido:</strong> {formatCurrency(testSaleData.amount_received)}
            </Typography>
            <Typography variant="body2">
              <strong>Troco:</strong> {formatCurrency(testTotals.change)}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Nota:</strong> Quando uma venda for finalizada no PDV, a nota fiscal será impressa automaticamente se uma impressora estiver disponível.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrinterSettings;