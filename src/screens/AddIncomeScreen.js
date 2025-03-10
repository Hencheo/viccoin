// Função para buscar categorias do backend
const fetchCategories = async () => {
  try {
    setLoadingCategories(true);
    const token = await AsyncStorage.getItem('jwt_token');
    
    // Teste com diferentes URLs para o endpoint de categorias (incluindo o endpoint público)
    const apiEndpoints = [
      `${API_URL}/api/categorias/`,
      `${API_URL}/firestore_api/categorias/`,
      `${API_URL}/categorias/`,
      `${API_URL}/firestore_api/categorias-publicas/`
    ];
    
    console.log('Tentando múltiplos endpoints para categorias:');
    
    let success = false;
    
    // Tentar cada endpoint até encontrar um que funcione
    for (const endpoint of apiEndpoints) {
      console.log(`- Tentando: ${endpoint}`);
      
      try {
        // Para o endpoint público não precisamos de token
        const headers = endpoint.includes('publicas') 
          ? { 'Content-Type': 'application/json' }
          : {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            };
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: headers,
        });
        
        console.log(`  Status da resposta (${endpoint}):`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  Dados recebidos (${endpoint}):`, JSON.stringify(data).substring(0, 100) + '...');
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`  Encontradas ${data.length} categorias no endpoint: ${endpoint}`);
            
            // Filtrar para categorias de receita
            const incomeCategories = data.filter(cat => 
              cat && cat.nome && (
                cat.nome.toLowerCase().includes('receita') || 
                cat.nome.toLowerCase().includes('renda') ||
                cat.nome.toLowerCase().includes('salário') ||
                cat.nome.toLowerCase().includes('entrada') ||
                cat.nome.toLowerCase().includes('investimento')
              )
            );
            
            if (incomeCategories.length > 0) {
              console.log(`  Filtradas ${incomeCategories.length} categorias de receita`);
              setCategories(incomeCategories);
            } else {
              console.log('  Nenhuma categoria específica de receita encontrada, usando todas');
              setCategories(data);
            }
            
            success = true;
            break; // Endpoint funcionou, sair do loop
          }
        }
      } catch (endpointError) {
        console.warn(`  Erro no endpoint ${endpoint}:`, endpointError.message);
      }
    }
    
    // Se nenhum endpoint funcionou, usar categorias padrão
    if (!success) {
      console.warn('Nenhum endpoint de categorias funcionou. Usando categorias padrão.');
      
      // Categorias padrão para receitas quando a API falha
      const defaultCategories = [
        { id: 'salario', nome: 'Salário' },
        { id: 'freelance', nome: 'Freelance' },
        { id: 'investimentos', nome: 'Investimentos' },
        { id: 'presente', nome: 'Presente' },
        { id: 'reembolso', nome: 'Reembolso' },
        { id: 'vendas', nome: 'Vendas' },
        { id: 'aluguel', nome: 'Aluguel' },
        { id: 'outras_receitas', nome: 'Outras Receitas' }
      ];
      
      setCategories(defaultCategories);
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    
    // Usar categorias padrão como fallback
    const defaultCategories = [
      { id: 'salario', nome: 'Salário' },
      { id: 'freelance', nome: 'Freelance' },
      { id: 'investimentos', nome: 'Investimentos' },
      { id: 'presente', nome: 'Presente' },
      { id: 'reembolso', nome: 'Reembolso' },
      { id: 'vendas', nome: 'Vendas' },
      { id: 'aluguel', nome: 'Aluguel' },
      { id: 'outras_receitas', nome: 'Outras Receitas' }
    ];
    
    setCategories(defaultCategories);
  } finally {
    setLoadingCategories(false);
  }
}; 