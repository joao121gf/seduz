#!/bin/bash

echo "🚀 Deploy para Vercel - Guia Completo"
echo "======================================"

echo ""
echo "📋 PASSO 1: Instalar Vercel CLI"
echo "npm install -g vercel"

echo ""
echo "📋 PASSO 2: Fazer login na Vercel"
echo "vercel login"

echo ""
echo "📋 PASSO 3: Deploy do projeto"
echo "vercel"

echo ""
echo "📋 PASSO 4: Configurar variáveis de ambiente"
echo "vercel env add MERCADO_PAGO_ACCESS_TOKEN"
echo "vercel env add NEXT_PUBLIC_BASE_URL"

echo ""
echo "📋 PASSO 5: Deploy final"
echo "vercel --prod"

echo ""
echo "✅ Pronto! Seu site estará no ar com domínio personalizado!"
