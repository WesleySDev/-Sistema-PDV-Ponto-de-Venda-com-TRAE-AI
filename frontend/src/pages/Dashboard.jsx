import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  People,
  Warning,
  Visibility
} from '@mui/icons-material';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';
import LowStockModal from '../components/LowStockModal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Carregando dados do dashboard...');
      
      const [statsResponse, salesResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/sales/')
      ]);
      
      console.log('✅ Dados recebidos:', { stats: statsResponse.data, sales: salesResponse.data });
      
      setStats(statsResponse.data);
      
      // Buscar vendas recentes (últimas 10)
      const sales = salesResponse.data || [];
      setRecentSales(sales.slice(0, 10));
      
      // Calcular vendas dos últimos 7 dias
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
        const daySales = sales.filter(sale => {
          if (!sale.created_at) return false;
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate === dateStr;
        });
        
        last7Days.push({
          day: dayName,
          count: daySales.length,
          total: daySales.reduce((sum, sale) => sum + parseFloat(sale.final_total || sale.total || 0), 0)
        });
      }
      
      setDailySales(last7Days);
      console.log('✅ Dashboard carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      
      let errorMessage = 'Erro ao carregar dados do dashboard';
      
      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Acesso negado. Você precisa ser gerente ou administrador para acessar o dashboard.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = `Erro HTTP ${status}: ${error.response.data?.error || 'Erro desconhecido'}`;
        }
      } else if (error.request) {
        errorMessage = 'Servidor não respondeu. Verifique se o backend está rodando.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, bgColor, borderColor, textColor }) => (
    <Card sx={{ 
      backgroundColor: bgColor,
      border: `3px solid ${borderColor}`,
      borderRadius: 3,
      height: 140,
      display: 'flex',
      alignItems: 'center'
    }}>
      <CardContent sx={{ width: '100%', p: 3, '&:last-child': { pb: 3 } }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            color: textColor,
            mb: 1.5
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '32px',
            color: textColor,
            mb: 1
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: borderColor
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Cards de Estatísticas */}
        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Vendas Hoje"
            value={formatCurrency(stats?.today_revenue || 0)}
            subtitle={stats?.today_sales ? `${stats.today_sales} vendas` : "Nenhuma venda hoje"}
            bgColor="#e8f5e8"
            borderColor="#4caf50"
            textColor="#2e7d32"
          />
        </Grid>
        
        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Produtos"
            value={stats?.active_products || 0}
            subtitle="Em estoque"
            bgColor="#e3f2fd"
            borderColor="#2196f3"
            textColor="#1565c0"
          />
        </Grid>
        
        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Total de Vendas"
            value={stats?.total_sales || 0}
            subtitle="Todas as vendas"
            bgColor="#fff3e0"
            borderColor="#ff9800"
            textColor="#e65100"
          />
        </Grid>
      </Grid>

      {/* Seção de Estoque Baixo */}
      {stats?.low_stock_products > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 4, 
              backgroundColor: '#fff3e0', 
              border: '2px solid #ff9800', 
              borderRadius: 3,
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Warning sx={{ color: '#e65100', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
                      ⚠️ Atenção: Produtos com Estoque Baixo
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#bf360c' }}>
                      {stats.low_stock_products} produto{stats.low_stock_products !== 1 ? 's' : ''} 
                      {stats.low_stock_products === 1 ? 'está' : 'estão'} com estoque baixo ou zerado
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={() => setLowStockModalOpen(true)}
                  sx={{
                    backgroundColor: '#e65100',
                    '&:hover': { backgroundColor: '#bf360c' },
                    fontWeight: 'bold',
                    px: 3,
                    py: 1.5
                  }}
                >
                  Ver Produtos
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Gráfico de Vendas dos Últimos 7 Dias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, backgroundColor: '#fafafa', border: '2px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#424242', mb: 3, fontSize: '20px' }}>
              📊 Vendas dos Últimos 7 Dias
            </Typography>
            {dailySales.length > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: 160, mb: 3 }}>
                {dailySales.map((dayData, index) => {
                  const maxCount = Math.max(...dailySales.map(d => d.count), 1);
                  const height = dayData.count > 0 ? Math.max((dayData.count / maxCount) * 100, 10) : 10;
                  return (
                    <Box key={dayData.day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: height, 
                          backgroundColor: dayData.count > 0 ? '#4caf50' : '#e0e0e0', 
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1
                        }} 
                        title={`${dayData.count} vendas - ${formatCurrency(dayData.total)}`}
                      >
                        {dayData.count > 0 && (
                          <Typography variant="caption" sx={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>
                            {dayData.count}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 'medium' }}>
                        {dayData.day}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="textSecondary" sx={{ fontSize: '16px' }}>
                  Nenhuma venda registrada nos últimos 7 dias
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Vendas Recentes */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, border: '2px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#424242', mb: 3, fontSize: '20px' }}>
              🛍️ Vendas Recentes
            </Typography>
            {recentSales.length > 0 ? (
              <>
                <Box sx={{ backgroundColor: '#f5f5f5', p: 2, mb: 2, borderRadius: 2 }}>
                  <Grid container>
                    <Grid item xs={4}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', color: '#666' }}>
                        Cliente
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', color: '#666' }}>
                        Data
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', color: '#666' }}>
                        Total
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', color: '#666' }}>
                        Status
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                {recentSales.map((sale, index) => {
                  const saleDate = new Date(sale.created_at);
                  const formattedDate = saleDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  const isPaid = sale.payment_status === 'paid' || sale.payment_status === 'completed';
                  
                  return (
                    <Box key={sale.id || index} sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Grid container alignItems="center">
                        <Grid item xs={4}>
                          <Typography variant="body1" sx={{ fontSize: '13px', color: '#424242', fontWeight: 'medium' }}>
                            {sale.customer_name || 'Cliente Avulso'}
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body1" sx={{ fontSize: '13px', color: '#424242' }}>
                            {formattedDate}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1" sx={{ fontSize: '13px', color: '#424242', fontWeight: 'medium' }}>
                            {formatCurrency(sale.total || 0)}
                          </Typography>
                        </Grid>
                          <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                backgroundColor: isPaid ? '#4caf50' : '#ff9800', 
                                mr: 1.5 
                              }} 
                            />
                            <Typography variant="body1" sx={{ fontSize: '12px', color: isPaid ? '#4caf50' : '#ff9800', fontWeight: 'medium' }}>
                              {isPaid ? 'Pago' : 'Pendente'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '16px' }}>
                    Nenhuma venda registrada ainda
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Modal de Produtos com Estoque Baixo */}
        <LowStockModal 
          open={lowStockModalOpen}
          onClose={() => setLowStockModalOpen(false)}
          onProductUpdated={loadDashboardData}
        />
    </Box>
  );
};

export default Dashboard;