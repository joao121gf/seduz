#!/bin/bash

# Script para criar o arquivo .env.local corretamente

echo "🔧 Criando arquivo .env.local..."

# Remover arquivo existente se houver
rm -f .env.local

# Criar novo arquivo com as variáveis
cat > .env.local << 'EOF'
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-2303516479543987-062014-1b953593c2522bfea92a27092a437f59-334838550
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

echo "✅ Arquivo .env.local criado!"
echo "📁 Conteúdo do arquivo:"
cat .env.local

echo ""
echo "🔄 Agora reinicie o servidor com: npm run dev"
