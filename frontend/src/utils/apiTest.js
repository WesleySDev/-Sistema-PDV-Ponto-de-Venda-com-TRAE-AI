// Teste direto da API sem dependências do contexto

const testDirectAPI = async () => {
  console.log('=== TESTE DIRETO DA API ===');
  
  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await fetch('http://localhost:8081/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // 2. Fazer login para obter token
    console.log('2. Fazendo login...');
    const loginResponse = await fetch('http://localhost:8081/api/v1/auth/login', {
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
    console.log('✅ Login realizado, token obtido');
    
    // 3. Testar categorias com token
    console.log('3. Testando categorias...');
    const categoriesResponse = await fetch('http://localhost:8081/api/v1/categories', {
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
    console.log('✅ Categorias obtidas:', categoriesData);
    console.log(`📊 Total de categorias: ${categoriesData.length}`);
    
    return {
      success: true,
      message: `Sucesso! ${categoriesData.length} categorias encontradas`,
      data: categoriesData
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Exportar para uso global
window.testDirectAPI = testDirectAPI;

export default testDirectAPI;