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
            setCategories(data);
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
      
      // Categorias padrão quando a API falha
      const defaultCategories = [
        { id: 'alimentacao', nome: 'Alimentação' },
        { id: 'transporte', nome: 'Transporte' },
        { id: 'moradia', nome: 'Moradia' },
        { id: 'saude', nome: 'Saúde' },
        { id: 'educacao', nome: 'Educação' },
        { id: 'lazer', nome: 'Lazer' },
        { id: 'vestuario', nome: 'Vestuário' },
        { id: 'outros', nome: 'Outros' }
      ];
      
      setCategories(defaultCategories);
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    
    // Usar categorias padrão como fallback
    const defaultCategories = [
      { id: 'alimentacao', nome: 'Alimentação' },
      { id: 'transporte', nome: 'Transporte' },
      { id: 'moradia', nome: 'Moradia' },
      { id: 'saude', nome: 'Saúde' },
      { id: 'educacao', nome: 'Educação' },
      { id: 'lazer', nome: 'Lazer' },
      { id: 'vestuario', nome: 'Vestuário' },
      { id: 'outros', nome: 'Outros' }
    ];
    
    setCategories(defaultCategories);
  } finally {
    setLoadingCategories(false);
  }
};

// Função para lidar com mudança de categoria
const handleCategoryChange = (categoryId, index) => {
  setCategoryId(categoryId);
  console.log('Categoria selecionada:', categoryId, 'índice:', index);
  
  // Encontrar a categoria selecionada pelo ID em vez de usar o índice
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  if (selectedCategory) {
    console.log('Categoria encontrada:', selectedCategory.nome);
    setCategoryName(selectedCategory.nome);
  } else {
    console.warn('Categoria não encontrada para o ID:', categoryId);
  }
}; 