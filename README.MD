# 🏦 VISE API - Sistema de Gestión de Tarjetas de Crédito

## 👥 Equipo de Desarrollo

- **Nicolas Hernandez Archila** - [@Nicolas-Archila](https://github.com/Nicolas-Archila)
- **Vanessa Alejandra Vasquez Martinez** - DevOps A
- **Juan Jose Martinez Lotero**

---

## 📋 Descripción del Proyecto

VISE API es un sistema completo de gestión de tarjetas de crédito que implementa prácticas modernas de DevOps, incluyendo:

- ✅ **CI/CD automatizado** con GitHub Actions
- ✅ **Contenedorización** con Docker
- ✅ **Despliegue continuo** a Azure
- ✅ **Monitoreo en tiempo real** con Axiom
- ✅ **Tests automatizados** con Hurl
- ✅ **Arquitectura de microservicios**

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Frontend      │─────▶│   Backend API   │─────▶│   PostgreSQL    │
│   (Nginx)       │      │   (Node.js)     │      │   Database      │
│   Port: 8080    │      │   Port: 3000    │      │   Port: 5432    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────┐
│          Axiom Monitoring & Logging              │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- [Docker](https://www.docker.com/) instalado
- [Node.js 18+](https://nodejs.org/) (opcional, para desarrollo local)
- [Git](https://git-scm.com/)

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Nicolas-Archila/vise-apii.git
cd vise-apii

# 2. Levantar todos los servicios con Docker Compose
docker compose up --build

# 3. La API estará disponible en:
# - Frontend: http://localhost:8080
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

### Desarrollo sin Docker

```bash
# 1. Instalar dependencias
cd vise-api
npm install

# 2. Configurar variables de entorno (opcional)
export PORT=3000
export AXIOM_TOKEN="tu_token_aqui"
export AXIOM_DATASET="vise-api-logs"

# 3. Iniciar servidor
npm start
```

---

## 📡 Endpoints de la API

### 1️⃣ **POST /client** - Crear Cliente

Registra un nuevo cliente y valida su elegibilidad para tarjetas.

**Request:**
```json
POST http://localhost:3000/client
Content-Type: application/json

{
  "name": "Juan Pérez",
  "country": "Colombia",
  "monthlyIncome": 1500,
  "viseClub": true,
  "cardType": "Platinum"
}
```

**Response (200 OK):**
```json
{
  "clientId": 1,
  "name": "Juan Pérez",
  "cardType": "Platinum",
  "status": "Registered",
  "message": "Cliente apto para tarjeta Platinum"
}
```

**Validaciones:**
- **Classic**: Sin requisitos
- **Gold**: Ingreso ≥ $500 USD
- **Platinum**: Ingreso ≥ $1000 USD + VISE CLUB
- **Black/White**: Ingreso ≥ $2000 USD + VISE CLUB + No residir en países restringidos

---

### 2️⃣ **POST /purchase** - Realizar Compra

Procesa una compra y aplica descuentos según la tarjeta y condiciones.

**Request:**
```json
POST http://localhost:3000/purchase
Content-Type: application/json

{
  "clientId": 1,
  "amount": 250,
  "currency": "USD",
  "purchaseDate": "2025-11-18T14:30:00Z",
  "purchaseCountry": "France"
}
```

**Response (200 OK):**
```json
{
  "status": "Approved",
  "purchase": {
    "clientId": 1,
    "originalAmount": 250,
    "discountApplied": 50,
    "finalAmount": 200,
    "benefit": "Descuento 20%"
  }
}
```

**Descuentos Aplicables:**

| Tarjeta  | Condiciones                                    | Descuento |
|----------|------------------------------------------------|-----------|
| Gold     | Lun-Mié + Monto > $100                         | 15%       |
| Platinum | Lun-Mié + Monto > $100                         | 20%       |
| Platinum | Sábado + Monto > $200                          | 30%       |
| Platinum | Compra en el extranjero                        | 5%        |
| Black    | Lun-Mié + Monto > $100                         | 25%       |
| Black    | Sábado + Monto > $200                          | 35%       |
| White    | Lun-Vie + Monto > $100                         | 25%       |
| White    | Sáb-Dom + Monto > $200                         | 35%       |

---

### 3️⃣ **GET /clients** - Listar Clientes

```bash
GET http://localhost:3000/clients
```

### 4️⃣ **GET /health** - Health Check

```bash
GET http://localhost:3000/health
```

---

## 🔄 Flujo DevOps Implementado

### **1. Construcción y Testing (CI)**

**Workflow:** `.github/workflows/main.yml`

```yaml
Trigger: workflow_dispatch (manual)
Steps:
  1. Checkout del código
  2. Build de imágenes Docker (frontend + backend)
  3. Ejecución de contenedores
  4. Tests automatizados con Hurl
  5. Cleanup de recursos
```

**Ejecutar manualmente:**
1. Ve a **Actions** en GitHub
2. Selecciona "Build and test VISE API"
3. Click en "Run workflow"
4. Ingresa el puerto (ej: 3000)
5. Click "Run workflow"

---

### **2. Despliegue Continuo (CD)**

**Workflow:** `.github/workflows/cd.yml`

```yaml
Trigger: workflow_dispatch (manual)
Steps:
  1. Build de imágenes Docker
  2. Push a Azure Container Registry
  3. Deploy a Azure App Service
  4. Health check del deployment
  5. Reporte de despliegue
```

**Requisitos de Secretos en GitHub:**

```bash
AZURE_REGISTRY_NAME          # Nombre del ACR (sin .azurecr.io)
AZURE_REGISTRY_USERNAME      # Usuario del ACR
AZURE_REGISTRY_PASSWORD      # Password del ACR
AZURE_CREDENTIALS            # JSON de service principal
AZURE_APP_NAME               # Nombre del App Service
AZURE_RESOURCE_GROUP         # Grupo de recursos en Azure
```

**Configurar secretos:**
```bash
Settings → Secrets and variables → Actions → New repository secret
```

---

## 📊 Monitoreo con Axiom

El sistema integra **Axiom** para logging y monitoreo en tiempo real.

### Configuración

```bash
# Variables de entorno
AXIOM_TOKEN=xaat-your-token-here
AXIOM_DATASET=vise-api-logs
```

### Eventos Monitoreados

- ✅ `client_created` - Registro de nuevos clientes
- ✅ `purchase_completed` - Compras procesadas
- ✅ `http_request` - Todas las peticiones HTTP
- ✅ `error` - Errores capturados
- ✅ `metric` - Métricas de rendimiento (response time)

### Dashboard en Axiom

Accede a [axiom.co](https://axiom.co) y visualiza:
- Total de clientes registrados
- Volumen de compras por hora
- Tiempo promedio de respuesta
- Tasa de errores
- Distribución de tarjetas

---

## 🧪 Testing

### Tests Automatizados (Hurl)

El archivo `session.hurl` contiene 8 tests que validan:

1. ✅ Health check de la API
2. ✅ Crear cliente Platinum
3. ✅ Crear cliente Gold
4. ✅ Compra con descuento
5. ✅ Compra sin descuento
6. ✅ Validación de campos requeridos
7. ✅ Cliente inexistente (404)
8. ✅ Listar todos los clientes

**Ejecutar tests localmente:**

```bash
# Instalar Hurl
brew install hurl  # macOS
# o
sudo apt install hurl  # Linux

# Ejecutar tests
hurl --variable host=http://localhost:3000 --test ./session.hurl
```

### Load Testing (Artillery)

```bash
cd vise-api
npm run test:load
```

---

## 🐳 Docker

### Construir imágenes manualmente

```bash
# Backend
docker build -t vise-api:latest ./vise-api

# Frontend
docker build -t vise-frontend:latest ./frontend

# Ejecutar
docker run -d -p 3000:3000 vise-api:latest
docker run -d -p 8080:80 vise-frontend:latest
```

### Docker Compose

```bash
# Levantar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down

# Limpiar volúmenes
docker compose down -v
```

---

## 📁 Estructura del Proyecto

```
vise-apii/
├── .github/
│   └── workflows/
│       ├── main.yml          # CI - Build & Test
│       └── cd.yml            # CD - Deploy to Azure
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── index.html
├── vise-api/
│   ├── index.js              # API principal
│   ├── axiom.js              # Cliente de Axiom
│   ├── instrumentation.mjs   # OpenTelemetry
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── session.hurl              # Tests de API
└── README.md
```

---

## 🔐 Variables de Entorno

| Variable                              | Descripción                    | Default         |
|---------------------------------------|--------------------------------|-----------------|
| `PORT`                                | Puerto del servidor            | `3000`          |
| `AXIOM_TOKEN`                         | Token de autenticación Axiom   | -               |
| `AXIOM_DATASET`                       | Dataset en Axiom               | `vise-api-logs` |
| `NODE_ENV`                            | Entorno (dev/prod)             | `development`   |
| `DATABASE_URL`                        | URL de PostgreSQL              | -               |

---

## 📹 Video Demostrativo

🎥 [Ver demo completa en YouTube](#)

El video incluye:
1. ✅ Ejecución del workflow de CI (Build & Test)
2. ✅ Ejecución del workflow de CD (Deploy a Azure)
3. ✅ Prueba manual del endpoint POST /client
4. ✅ Prueba manual del endpoint POST /purchase
5. ✅ Visualización de logs en Axiom
6. ✅ Verificación del despliegue en Azure

---

## 🎓 Criterios de Evaluación Cumplidos

| # | Criterio                            | Evidencia                                          |
|---|-------------------------------------|----------------------------------------------------|
| 1 | Uso de Git colaborativo             | ✅ Historial de commits, ramas y pull requests     |
| 2 | Construcción de imagen Docker       | ✅ Dockerfiles funcionales + docker-compose.yml    |
| 3 | Integración continua (CI)           | ✅ `.github/workflows/main.yml` funcionando        |
| 4 | Despliegue continuo (CD)            | ✅ `.github/workflows/cd.yml` a Azure              |
| 5 | Trazabilidad y monitorización       | ✅ Axiom configurado con logs y métricas           |
| 6 | Colaboración y presentación         | ✅ README documentado + video demostrativo         |

---

## 🛠️ Troubleshooting

### Error: "Cannot connect to Docker daemon"

```bash
# Verificar que Docker esté corriendo
docker info

# Reiniciar Docker Desktop
```

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en docker-compose.yml o matar proceso
lsof -ti:3000 | xargs kill -9
```

### Tests de Hurl fallan

```bash
# Verificar que la API esté corriendo
curl http://localhost:3000/health

# Ejecutar con modo verbose
hurl --verbose --variable host=http://localhost:3000 --test ./session.hurl
```

---

## 📚 Recursos Adicionales

- [Documentación de Express](https://expressjs.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Axiom Docs](https://axiom.co/docs)
- [Hurl Testing](https://hurl.dev/)

---

## 📄 Licencia

Este proyecto es parte del curso de DevOps y está bajo licencia MIT.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ por el equipo VISE DevOps**