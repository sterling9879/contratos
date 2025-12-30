#!/bin/bash
set -e

echo "================================================"
echo "    Contrato.AI - Script de Deploy"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Por favor, execute como root (sudo)${NC}"
    exit 1
fi

# Configuration
PROJECT_DIR="/var/www/contrato-ai"
DOMAIN="contrato.seudominio.com.br"

echo -e "${BLUE}[1/8] Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${BLUE}[2/8] Instalando dependencias...${NC}"
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo -e "${BLUE}[3/8] Criando diretorio do projeto...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Criando arquivo .env...${NC}"
    cat > .env << EOF
# Database
DB_USER=contrato_user
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
DB_NAME=contrato_ai

# JWT Secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)

# Gemini API - CONFIGURE THIS!
GEMINI_API_KEY=your-gemini-api-key-here

# URLs - CONFIGURE YOUR DOMAIN!
DOMAIN=$DOMAIN
API_URL=https://$DOMAIN/api
FRONTEND_URL=https://$DOMAIN
EOF
    echo -e "${RED}IMPORTANTE: Edite o arquivo .env com sua GEMINI_API_KEY!${NC}"
fi

# Create uploads directory
echo -e "${BLUE}[4/8] Criando diretorios...${NC}"
mkdir -p uploads
chmod 755 uploads

# Check if source code exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}Codigo fonte nao encontrado. Clone o repositorio primeiro.${NC}"
    echo "Execute: git clone <seu-repo> $PROJECT_DIR"
    exit 1
fi

echo -e "${BLUE}[5/8] Buildando containers...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}[6/8] Iniciando containers...${NC}"
docker-compose up -d

# Wait for database
echo -e "${YELLOW}Aguardando banco de dados...${NC}"
sleep 15

# Run migrations
echo -e "${BLUE}[7/8] Executando migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy || {
    echo -e "${YELLOW}Migrations podem precisar ser executadas manualmente${NC}"
}

echo -e "${BLUE}[8/8] Configurando Nginx...${NC}"
# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/contrato-ai
ln -sf /etc/nginx/sites-available/contrato-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t && systemctl reload nginx

# Configure firewall
echo -e "${YELLOW}Configurando firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    Deploy concluido com sucesso!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Proximos passos:${NC}"
echo "1. Edite /var/www/contrato-ai/.env com sua GEMINI_API_KEY"
echo "2. Configure o DNS do dominio $DOMAIN para este servidor"
echo "3. Execute: certbot --nginx -d $DOMAIN"
echo "4. Reinicie: cd $PROJECT_DIR && docker-compose restart"
echo ""
echo -e "${BLUE}Comandos uteis:${NC}"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Reiniciar: docker-compose restart"
echo "  - Parar: docker-compose down"
echo "  - Status: docker-compose ps"
echo ""
