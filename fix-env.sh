# 1. Pare o servidor se estiver rodando
# Ctrl + C no terminal

# 2. Delete a pasta .env (se existir)
rm -rf .env

# 3. Crie o arquivo .env.local na raiz do projeto
echo "MERCADO_PAGO_ACCESS_TOKEN=APP_USR-2303516479543987-062014-1b953593c2522bfea92a27092a437f59-334838550" > .env.local
echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env.local

# 4. Reinicie o servidor
npm run dev
