# Utilitários do VicCoin

Este diretório contém funções utilitárias reutilizáveis no projeto VicCoin.

## Formatters

O arquivo `formatters.js` contém funções para formatação de dados, especialmente valores monetários.

### Funções disponíveis

- `formatCurrency(value, includeSymbol)`: Formata um valor como moeda brasileira (R$)
- `formatarMoeda(valor, inclueSymbol)`: Alias para formatCurrency (mantido para compatibilidade)
- `formatCompactCurrency(value)`: Formata valores grandes de forma compacta (ex: 1.5K, 10M)
- `formatarValorResumido(valor)`: Alias para formatCompactCurrency (mantido para compatibilidade)

### Uso recomendado

```javascript
// Importação
import { formatCurrency } from '../utils/formatters';

// Uso
const formattedValue = formatCurrency(1234.56); // R$ 1.234,56
const valueWithoutSymbol = formatCurrency(1234.56, false); // 1.234,56
```

## Padrões de Nomenclatura

Para manter consistência no código, recomendamos seguir os padrões:

1. Para novas implementações, use os nomes em inglês (`formatCurrency`)
2. Para código legado, você pode continuar usando os aliases em português (`formatarMoeda`)

## Observações Importantes

Anteriormente, existiam arquivos formatters em diferentes locais (como `src/screens/Home/utils/formatters.js`).
Agora, **todas as funções de formatação foram centralizadas neste diretório** para evitar duplicação e garantir consistência.

Por favor, não crie novas funções de formatação em outros locais. Adicione-as aqui para que possam ser reutilizadas em todo o projeto. 