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
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  People,
  Warning
} from '@mui/icons-material';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, lowStockResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/dashboard/low-stock')
      ]);
      
      setStats(statsResponse.data);
      setLowStockProducts(lowStockResponse.data);
    } catch (error) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };



  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
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
      
      <Grid container spacing={3}>
        {/* Estatísticas Gerais */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Produtos Ativos"
            value={stats?.active_products || 0}
            icon={<Inventory fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vendas Hoje"
            value={stats?.today_sales || 0}
            icon={<ShoppingCart fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Receita Hoje"
            value={formatCurrency(stats?.today_revenue || 0)}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuários Ativos"
            value={stats?.total_users || 0}
            icon={<People fontSize="large" />}
            color="info"
          />
        </Grid>

        {/* Vendas do Mês */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vendas do Mês
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4">
                  {stats?.month_sales || 0}
                </Typography>
                <Typography color="textSecondary">
                  vendas realizadas
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h5" color="success.main">
                  {formatCurrency(stats?.month_revenue || 0)}
                </Typography>
                <Typography color="textSecondary">
                  receita total
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Vendas do Ano */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vendas do Ano
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4">
                  {stats?.year_sales || 0}
                </Typography>
                <Typography color="textSecondary">
                  vendas realizadas
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h5" color="success.main">
                  {formatCurrency(stats?.year_revenue || 0)}
                </Typography>
                <Typography color="textSecondary">
                  receita total
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Produtos com Estoque Baixo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Produtos com Estoque Baixo ({stats?.low_stock_products || 0})
              </Typography>
            </Box>
            
            {lowStockProducts.length === 0 ? (
              <Typography color="textSecondary">
                Nenhum produto com estoque baixo
              </Typography>
            ) : (
              <List>
                {lowStockProducts.slice(0, 10).map((product) => (
                  <ListItem key={product.id} divider>
                    <ListItemText
                      primary={product.name}
                      secondary={`Categoria: ${product.category?.name || 'N/A'}`}
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`Estoque: ${product.stock}`}
                        color="warning"
                        size="small"
                      />
                      <Chip
                        label={`Mín: ${product.min_stock}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;