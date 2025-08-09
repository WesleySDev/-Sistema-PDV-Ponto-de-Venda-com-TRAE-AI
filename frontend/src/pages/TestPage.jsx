import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Alert, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const TestPage = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const testBasicConnectivity = async () => {
    setLoading(true);
    setResult('Testando conectividade básica...');
    
    try {
      // Teste 1: Health check
      console.log('🔍 Teste 1: Health check');
      const healthResponse = await fetch('http://localhost:8080/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health check OK:', healthData);
      
      // Teste 2: Login direto
      console.log('🔍 Teste 2: Login direto');
      const loginResponse = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@pdv.com',
          password: 'admin123'
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login falhou: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      console.log('✅ Login OK, token obtido');
      
      // Teste 3: Categorias com fetch
      console.log('🔍 Teste 3: Categorias com fetch');
      const categoriesResponse = await fetch('http://localhost:8080/api/v1/categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!categoriesResponse.ok) {
        throw new Error(`Categorias falhou: ${categoriesResponse.status}`);
      }
      
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categorias OK:', categoriesData);
      
      setResult(`✅ Todos os testes passaram! ${categoriesData.length} categorias encontradas`);
      
    } catch (error) {
      console.error('❌ Erro:', error);
      setResult(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAxiosConnectivity = async () => {
    setLoading(true);
    setResult('Testando conectividade com axios...');
    
    try {
      console.log('🔍 Testando axios configurado');
      console.log('🔗 BaseURL:', axios.defaults.baseURL);
      console.log('🔑 Authorization:', axios.defaults.headers.common['Authorization']);
      
      const response = await axios.get('/categories/');
      console.log('✅ Axios funcionou:', response.data);
      
      setResult(`✅ Axios OK! ${response.data.length} categorias encontradas`);
      
    } catch (error) {
      console.error('❌ Erro axios:', error);
      
      let errorMsg = 'Erro desconhecido';
      if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Erro de rede';
      } else if (error.response) {
        errorMsg = `HTTP ${error.response.status}: ${error.response.data?.message || 'Erro do servidor'}`;
      } else if (error.request) {
        errorMsg = 'Servidor não respondeu';
      } else {
        errorMsg = error.message;
      }
      
      setResult(`❌ Erro axios: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Executar teste básico automaticamente
    testBasicConnectivity();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Diagnóstico de Conectividade
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estado da Autenticação
        </Typography>
        <Typography variant="body2">
          Usuário logado: {isAuthenticated ? '✅ Sim' : '❌ Não'}<br/>
          Usuário: {user ? `${user.name} (${user.email})` : 'Nenhum'}<br/>
          Token configurado: {axios.defaults.headers.common['Authorization'] ? '✅ Sim' : '❌ Não'}<br/>
          BaseURL: {axios.defaults.baseURL}
        </Typography>
      </Paper>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={testBasicConnectivity}
          disabled={loading}
        >
          {loading ? 'Testando...' : 'Teste Básico (Fetch)'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={testAxiosConnectivity}
          disabled={loading}
        >
          {loading ? 'Testando...' : 'Teste Axios'}
        </Button>
      </Box>
      
      {result && (
        <Alert 
          severity={result.includes('✅') ? 'success' : 'error'}
          sx={{ mt: 2 }}
        >
          {result}
        </Alert>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Informações de Debug:</Typography>
        <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          Frontend: http://localhost:5173{"\n"}
          Backend: http://localhost:8080{"\n"}
                API Base: http://localhost:8080/api/v1{"\n"}
          CORS configurado para: localhost:3000, localhost:5173
        </Typography>
      </Box>
    </Container>
  );
};

export default TestPage;