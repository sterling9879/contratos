#!/bin/bash
#===============================================================================
#
#          FILE: install.sh
#
#         USAGE: sudo ./install.sh
#
#   DESCRIPTION: Script de instalacao completa do Contrato.AI para VPS Ubuntu 22.04
#
#       OPTIONS: ---
#  REQUIREMENTS: Ubuntu 22.04, root access, dominio configurado (opcional)
#         NOTES: Portas utilizadas: 3000 (frontend), 3001 (backend), 5432 (postgres)
#        AUTHOR: Contrato.AI
#       VERSION: 1.0.0
#
#===============================================================================

set -e

#-------------------------------------------------------------------------------
# CONFIGURACOES
#-------------------------------------------------------------------------------
PROJECT_NAME="contrato-ai"
PROJECT_DIR="/var/www/${PROJECT_NAME}"
FRONTEND_PORT=3000
BACKEND_PORT=3001
DB_PORT=5432

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

#-------------------------------------------------------------------------------
# FUNCOES AUXILIARES
#-------------------------------------------------------------------------------
print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║     ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  █████╗       ║"
    echo "║    ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗      ║"
    echo "║    ██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝███████║      ║"
    echo "║    ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██╔══██║      ║"
    echo "║    ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║██║  ██║      ║"
    echo "║     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ║"
    echo "║                        .AI                                    ║"
    echo "║                                                               ║"
    echo "║           Instalacao Automatizada para VPS                    ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Este script precisa ser executado como root (sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if [ ! -f /etc/os-release ]; then
        log_error "Sistema operacional nao suportado"
        exit 1
    fi

    . /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        log_warn "Este script foi testado apenas no Ubuntu. Continuando mesmo assim..."
    fi
}

generate_password() {
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
}

generate_secret() {
    openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64
}

#-------------------------------------------------------------------------------
# INSTALACAO DE DEPENDENCIAS
#-------------------------------------------------------------------------------
install_dependencies() {
    log_info "Atualizando sistema..."
    apt update && apt upgrade -y

    log_info "Instalando dependencias basicas..."
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        htop \
        nano \
        vim

    log_success "Dependencias basicas instaladas"
}

install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker ja esta instalado"
        return
    fi

    log_info "Instalando Docker..."

    # Remove versoes antigas
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Adiciona repositorio oficial
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Inicia e habilita Docker
    systemctl start docker
    systemctl enable docker

    log_success "Docker instalado com sucesso"
}

install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_info "Node.js ja esta instalado: $NODE_VERSION"
        return
    fi

    log_info "Instalando Node.js 20 LTS..."

    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs

    # Instala PM2 globalmente
    npm install -g pm2

    log_success "Node.js $(node -v) instalado com sucesso"
}

install_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Nginx ja esta instalado"
        return
    fi

    log_info "Instalando Nginx..."
    apt install -y nginx

    systemctl start nginx
    systemctl enable nginx

    log_success "Nginx instalado com sucesso"
}

install_certbot() {
    if command -v certbot &> /dev/null; then
        log_info "Certbot ja esta instalado"
        return
    fi

    log_info "Instalando Certbot..."
    apt install -y certbot python3-certbot-nginx

    log_success "Certbot instalado com sucesso"
}

install_postgresql() {
    if command -v psql &> /dev/null; then
        log_info "PostgreSQL ja esta instalado"
        return
    fi

    log_info "Instalando PostgreSQL 15..."

    # Adiciona repositorio oficial do PostgreSQL
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

    apt update
    apt install -y postgresql-15 postgresql-contrib-15

    systemctl start postgresql
    systemctl enable postgresql

    log_success "PostgreSQL 15 instalado com sucesso"
}

#-------------------------------------------------------------------------------
# CONFIGURACAO DO PROJETO
#-------------------------------------------------------------------------------
setup_project_directory() {
    log_info "Configurando diretorio do projeto..."

    mkdir -p "$PROJECT_DIR"
    mkdir -p "$PROJECT_DIR/uploads"
    mkdir -p "$PROJECT_DIR/logs"

    cd "$PROJECT_DIR"

    log_success "Diretorio do projeto criado: $PROJECT_DIR"
}

setup_database() {
    log_info "Configurando banco de dados..."

    DB_USER="contrato_user"
    DB_PASSWORD=$(generate_password)
    DB_NAME="contrato_ai"

    # Cria usuario e banco
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

    # Salva credenciais
    echo "DB_USER=$DB_USER" >> "$PROJECT_DIR/.db_credentials"
    echo "DB_PASSWORD=$DB_PASSWORD" >> "$PROJECT_DIR/.db_credentials"
    echo "DB_NAME=$DB_NAME" >> "$PROJECT_DIR/.db_credentials"
    chmod 600 "$PROJECT_DIR/.db_credentials"

    log_success "Banco de dados configurado"
}

create_env_file() {
    log_info "Criando arquivo de configuracao .env..."

    # Le credenciais do banco
    source "$PROJECT_DIR/.db_credentials"

    JWT_SECRET=$(generate_secret)
    JWT_REFRESH_SECRET=$(generate_secret)

    cat > "$PROJECT_DIR/.env" << EOF
#===============================================================================
# CONTRATO.AI - CONFIGURACOES DE AMBIENTE
# Gerado automaticamente em $(date)
#===============================================================================

# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# JWT Secrets (MANTENHA EM SEGREDO!)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Gemini API - CONFIGURE SUA CHAVE AQUI!
# Obtenha em: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI

# Server
NODE_ENV=production
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}

# URLs (configure com seu dominio)
# Se nao tiver dominio, use o IP do servidor
API_URL=http://localhost:${BACKEND_PORT}/api
FRONTEND_URL=http://localhost:${FRONTEND_PORT}

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=20971520
EOF

    chmod 600 "$PROJECT_DIR/.env"

    log_success "Arquivo .env criado"
    log_warn "IMPORTANTE: Edite o arquivo .env e adicione sua GEMINI_API_KEY"
}

clone_project() {
    log_info "Verificando codigo fonte..."

    # Se ja existe o codigo, pula
    if [ -f "$PROJECT_DIR/package.json" ] || [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        log_info "Codigo fonte ja existe"
        return
    fi

    log_warn "Codigo fonte nao encontrado em $PROJECT_DIR"
    log_info "Copie os arquivos do projeto para: $PROJECT_DIR"
    log_info "Ou clone o repositorio: git clone <seu-repo> $PROJECT_DIR"
}

#-------------------------------------------------------------------------------
# CONFIGURACAO DO NGINX
#-------------------------------------------------------------------------------
setup_nginx() {
    log_info "Configurando Nginx..."

    # Remove configuracao default
    rm -f /etc/nginx/sites-enabled/default

    # Cria configuracao do projeto
    cat > /etc/nginx/sites-available/contrato-ai << EOF
# Contrato.AI - Nginx Configuration
# Gerado automaticamente

upstream frontend {
    server 127.0.0.1:${FRONTEND_PORT};
    keepalive 64;
}

upstream backend {
    server 127.0.0.1:${BACKEND_PORT};
    keepalive 64;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=upload_limit:10m rate=2r/s;

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 25M;
    client_body_buffer_size 25M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    # API
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }

    # Upload endpoint (stricter rate limit)
    location /api/contracts/upload {
        limit_req zone=upload_limit burst=5 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # Analysis endpoint (longer timeout)
    location ~ /api/contracts/.*/analyze {
        limit_req zone=api_limit burst=5 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 600s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

    # Ativa o site
    ln -sf /etc/nginx/sites-available/contrato-ai /etc/nginx/sites-enabled/

    # Testa configuracao
    nginx -t

    # Recarrega Nginx
    systemctl reload nginx

    log_success "Nginx configurado"
}

#-------------------------------------------------------------------------------
# CONFIGURACAO DO FIREWALL
#-------------------------------------------------------------------------------
setup_firewall() {
    log_info "Configurando firewall..."

    # Permite SSH
    ufw allow 22/tcp

    # Permite HTTP e HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Habilita firewall
    ufw --force enable

    log_success "Firewall configurado"
}

#-------------------------------------------------------------------------------
# SCRIPTS DE GERENCIAMENTO
#-------------------------------------------------------------------------------
create_management_scripts() {
    log_info "Criando scripts de gerenciamento..."

    # Script de start
    cat > "$PROJECT_DIR/start.sh" << 'EOF'
#!/bin/bash
cd /var/www/contrato-ai

echo "Iniciando Contrato.AI..."

# Carrega variaveis de ambiente
source .env

# Inicia backend
cd backend
pm2 start dist/app.js --name "contrato-backend" --env production
cd ..

# Inicia frontend
cd frontend
pm2 start npm --name "contrato-frontend" -- start
cd ..

pm2 save
echo "Contrato.AI iniciado!"
EOF
    chmod +x "$PROJECT_DIR/start.sh"

    # Script de stop
    cat > "$PROJECT_DIR/stop.sh" << 'EOF'
#!/bin/bash
echo "Parando Contrato.AI..."
pm2 stop all
echo "Contrato.AI parado!"
EOF
    chmod +x "$PROJECT_DIR/stop.sh"

    # Script de restart
    cat > "$PROJECT_DIR/restart.sh" << 'EOF'
#!/bin/bash
echo "Reiniciando Contrato.AI..."
pm2 restart all
echo "Contrato.AI reiniciado!"
EOF
    chmod +x "$PROJECT_DIR/restart.sh"

    # Script de logs
    cat > "$PROJECT_DIR/logs.sh" << 'EOF'
#!/bin/bash
pm2 logs
EOF
    chmod +x "$PROJECT_DIR/logs.sh"

    # Script de status
    cat > "$PROJECT_DIR/status.sh" << 'EOF'
#!/bin/bash
echo "=== Status do Contrato.AI ==="
echo ""
echo "--- PM2 ---"
pm2 status
echo ""
echo "--- Nginx ---"
systemctl status nginx --no-pager -l
echo ""
echo "--- PostgreSQL ---"
systemctl status postgresql --no-pager -l
EOF
    chmod +x "$PROJECT_DIR/status.sh"

    # Script de build
    cat > "$PROJECT_DIR/build.sh" << 'EOF'
#!/bin/bash
cd /var/www/contrato-ai

echo "Building Contrato.AI..."

# Carrega variaveis
source .env

# Build backend
echo "Building backend..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build completo!"
EOF
    chmod +x "$PROJECT_DIR/build.sh"

    # Script de setup SSL
    cat > "$PROJECT_DIR/setup-ssl.sh" << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Uso: ./setup-ssl.sh seu-dominio.com.br"
    exit 1
fi

DOMAIN=$1
echo "Configurando SSL para: $DOMAIN"

# Atualiza nginx para usar o dominio
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/contrato-ai
nginx -t && systemctl reload nginx

# Obtem certificado
certbot --nginx -d $DOMAIN

echo "SSL configurado para $DOMAIN!"
echo "Atualize o arquivo .env com as URLs corretas:"
echo "  API_URL=https://$DOMAIN/api"
echo "  FRONTEND_URL=https://$DOMAIN"
EOF
    chmod +x "$PROJECT_DIR/setup-ssl.sh"

    log_success "Scripts de gerenciamento criados"
}

#-------------------------------------------------------------------------------
# CONFIGURACAO DO PM2
#-------------------------------------------------------------------------------
setup_pm2_startup() {
    log_info "Configurando PM2 para iniciar no boot..."

    pm2 startup systemd -u root --hp /root

    log_success "PM2 configurado para iniciar automaticamente"
}

#-------------------------------------------------------------------------------
# INSTALACAO COM DOCKER (ALTERNATIVA)
#-------------------------------------------------------------------------------
create_docker_install_script() {
    log_info "Criando script de instalacao com Docker..."

    cat > "$PROJECT_DIR/install-docker.sh" << 'EOF'
#!/bin/bash
#===============================================================================
# Instalacao do Contrato.AI usando Docker Compose
#===============================================================================

cd /var/www/contrato-ai

# Verifica se existe docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo "Erro: docker-compose.yml nao encontrado"
    exit 1
fi

# Carrega variaveis
source .env

echo "Iniciando containers..."
docker compose up -d --build

echo "Aguardando banco de dados..."
sleep 15

echo "Executando migrations..."
docker compose exec -T backend npx prisma migrate deploy

echo ""
echo "Contrato.AI iniciado com Docker!"
echo ""
echo "Comandos uteis:"
echo "  docker compose logs -f     # Ver logs"
echo "  docker compose restart     # Reiniciar"
echo "  docker compose down        # Parar"
echo "  docker compose ps          # Status"
EOF
    chmod +x "$PROJECT_DIR/install-docker.sh"

    log_success "Script Docker criado: install-docker.sh"
}

#-------------------------------------------------------------------------------
# RESUMO FINAL
#-------------------------------------------------------------------------------
print_summary() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║           INSTALACAO CONCLUIDA COM SUCESSO!                   ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}=== INFORMACOES DO SERVIDOR ===${NC}"
    echo -e "  IP do Servidor: ${YELLOW}${SERVER_IP}${NC}"
    echo -e "  Diretorio:      ${YELLOW}${PROJECT_DIR}${NC}"
    echo ""
    echo -e "${CYAN}=== PORTAS UTILIZADAS ===${NC}"
    echo -e "  Frontend: ${YELLOW}${FRONTEND_PORT}${NC}"
    echo -e "  Backend:  ${YELLOW}${BACKEND_PORT}${NC}"
    echo -e "  Postgres: ${YELLOW}${DB_PORT}${NC}"
    echo -e "  Nginx:    ${YELLOW}80/443${NC}"
    echo ""
    echo -e "${CYAN}=== PROXIMOS PASSOS ===${NC}"
    echo ""
    echo -e "${YELLOW}1. Copie o codigo do projeto para:${NC}"
    echo -e "   ${PROJECT_DIR}"
    echo ""
    echo -e "${YELLOW}2. Configure sua chave da API Gemini:${NC}"
    echo -e "   nano ${PROJECT_DIR}/.env"
    echo -e "   # Adicione: GEMINI_API_KEY=sua_chave_aqui"
    echo ""
    echo -e "${YELLOW}3. Faca o build do projeto:${NC}"
    echo -e "   cd ${PROJECT_DIR}"
    echo -e "   ./build.sh"
    echo ""
    echo -e "${YELLOW}4. Inicie a aplicacao:${NC}"
    echo -e "   ./start.sh"
    echo ""
    echo -e "${YELLOW}5. (Opcional) Configure SSL com seu dominio:${NC}"
    echo -e "   ./setup-ssl.sh seu-dominio.com.br"
    echo ""
    echo -e "${CYAN}=== SCRIPTS DISPONIVEIS ===${NC}"
    echo -e "  ${GREEN}./start.sh${NC}     - Iniciar aplicacao"
    echo -e "  ${GREEN}./stop.sh${NC}      - Parar aplicacao"
    echo -e "  ${GREEN}./restart.sh${NC}   - Reiniciar aplicacao"
    echo -e "  ${GREEN}./logs.sh${NC}      - Ver logs"
    echo -e "  ${GREEN}./status.sh${NC}    - Ver status"
    echo -e "  ${GREEN}./build.sh${NC}     - Rebuild do projeto"
    echo -e "  ${GREEN}./setup-ssl.sh${NC} - Configurar SSL"
    echo ""
    echo -e "${CYAN}=== ACESSO ===${NC}"
    echo -e "  URL: ${YELLOW}http://${SERVER_IP}${NC}"
    echo ""
    echo -e "${RED}IMPORTANTE:${NC} Nao esqueca de configurar a GEMINI_API_KEY!"
    echo ""
}

#-------------------------------------------------------------------------------
# MAIN
#-------------------------------------------------------------------------------
main() {
    print_banner

    check_root
    check_ubuntu

    echo ""
    log_info "Iniciando instalacao do Contrato.AI..."
    echo ""

    # Instalacao de dependencias
    install_dependencies
    install_docker
    install_nodejs
    install_nginx
    install_certbot
    install_postgresql

    # Configuracao do projeto
    setup_project_directory
    setup_database
    create_env_file
    clone_project

    # Configuracao de servicos
    setup_nginx
    setup_firewall
    setup_pm2_startup

    # Scripts de gerenciamento
    create_management_scripts
    create_docker_install_script

    # Resumo
    print_summary
}

# Executa
main "$@"
