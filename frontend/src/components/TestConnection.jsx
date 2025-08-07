import React, { useState } from 'react';
import { Button, Alert, Box, Typography } from '@mui/material';
import axios from 'axios';
import testDirectAPI from '../utils/apiTest';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('=== INICIANDO TESTE DE CONECTIVIDADE ===');
      
      // Primeiro, teste direto sem axios
      const directResult = await testDirectAPI();
      
      if (directResult.success) {
        console.log('✅ Teste direto passou!');
        
        // Agora testar com axios configurado
        console.log('🔍 Testando com axios configurado...');
        console.log('🔗 BaseURL atual:', axios.defaults.baseURL);
        console.log('🔑 Token atual:', axios.defaults.headers.common['Authorization']);
        
        const categoriesResponse = await axios.get('/categories/');
        console.log('✅ Axios também funcionou:', categoriesResponse.data);
        
        setSuccess(`✅ Conexão OK! ${directResult.data.length} categorias encontradas.`);
      } else {
        throw new Error(directResult.message);
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      
      let errorMessage = '❌ Erro: ';
      
      if (error.code === 'NETWORK_ERROR') {
        errorMessage += 'Erro de rede - servidor pode estar offline';
      } else if (error.response?.status === 401) {
        errorMessage += 'Não autorizado - token inválido ou expirado';
      } else if (error.response?.status === 403) {
        errorMessage += 'Acesso negado';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Erro interno do servidor';
      } else {
        errorMessage += error.message || 'Erro desconhecido';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Teste de Conectividade
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testAPI} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testando...' : 'Testar API'}
      </Button>
      
      {result && (
        <Alert 
          severity={result.includes('✅') ? 'success' : 'error'}
          sx={{ mt: 1 }}
        >
          {result}
        </Alert>
      )}
    </Box>
  );
};

export default TestConnection;