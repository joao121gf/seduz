#!/bin/bash

echo "🏗️ Gerando build estático para cPanel..."

# Instalar dependências
npm install

# Gerar build estático
npm run build

echo "✅ Build gerado na pasta 'out/'"
echo "📁 Faça upload da pasta 'out/' para o cPanel"
echo "🌐 Configure o domínio para apontar para a pasta 'out/'"
