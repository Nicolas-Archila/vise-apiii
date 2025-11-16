const express = require('express');
const path = require('path');
const axiom = require('./axiom'); // Importar logger de Axiom

const app = express();
app.use(express.json());

// Middleware para logging de todas las peticiones
app.use(async (req, res, next) => {
  const start = Date.now();
  
  // Log request
  await axiom.logRequest(req);
  
  // Capturar respuesta
  res.on('finish', async () => {
    const duration = Date.now() - start;
    await axiom.logMetric('response_time', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
  });
  
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta raíz: muestra el index.html
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VISE API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /client - Crear cliente',
      'POST /purchase - Realizar compra',
      'GET /clients - Listar clientes',
      'GET /health - Health check'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;

// Datos en memoria (temporal)
let clients = [];
let nextClientId = 1;

const restrictedCountries = ['China', 'Vietnam', 'India', 'Irán', 'Iran'];

// Validar elegibilidad según tipo de tarjeta
function checkEligibility({ monthlyIncome, viseClub, cardType, country }) {
  const type = (cardType || '').toLowerCase();
  if (type === 'classic') return { eligible: true };
  if (type === 'gold') {
    if ((monthlyIncome || 0) >= 500) return { eligible: true };
    return { eligible: false, reason: 'El cliente no cumple con el ingreso mínimo de 500 USD para Gold' };
  }
  if (type === 'platinum') {
    if ((monthlyIncome || 0) < 1000) return { eligible: false, reason: 'Ingreso mínimo de 1000 USD requerido para Platinum' };
    if (!viseClub) return { eligible: false, reason: 'El cliente no cumple con la suscripción VISE CLUB requerida para Platinum' };
    return { eligible: true };
  }
  if (type === 'black' || type === 'white') {
    if ((monthlyIncome || 0) < 2000) return { eligible: false, reason: 'Ingreso mínimo de 2000 USD requerido para Black/White' };
    if (!viseClub) return { eligible: false, reason: 'El cliente no cumple con la suscripción VISE CLUB requerida para Black/White' };
    if (restrictedCountries.map(c => c.toLowerCase()).includes((country || '').toLowerCase())) {
      return { eligible: false, reason: `Clientes residentes en ${restrictedCountries.join(', ')} no pueden solicitar tarjeta ${cardType}` };
    }
    return { eligible: true };
  }
  return { eligible: false, reason: 'Tipo de tarjeta inválido' };
}

// POST /client
app.post('/client', async (req, res) => {
  const { name, country, monthlyIncome, viseClub, cardType } = req.body;
  
  try {
    if (!name || !country || typeof monthlyIncome === 'undefined' || typeof viseClub === 'undefined' || !cardType) {
      return res.status(400).json({ 
        status: 'Rejected', 
        error: 'Faltan campos requeridos: name, country, monthlyIncome, viseClub, cardType' 
      });
    }

    const check = checkEligibility({ monthlyIncome, viseClub, cardType, country });
    if (!check.eligible) {
      return res.status(400).json({ status: 'Rejected', error: check.reason });
    }

    const client = {
      clientId: nextClientId++,
      name,
      country,
      monthlyIncome,
      viseClub,
      cardType,
      createdAt: new Date().toISOString()
    };
    clients.push(client);

    // Log a Axiom
    await axiom.logClientCreated(client);

    return res.json({
      clientId: client.clientId,
      name: client.name,
      cardType: client.cardType,
      status: 'Registered',
      message: `Cliente apto para tarjeta ${client.cardType}`
    });
  } catch (error) {
    await axiom.logError(error, { endpoint: '/client' });
    return res.status(500).json({ status: 'Error', error: error.message });
  }
});

// Calcular descuento
function calculateDiscount(client, purchase) {
  const amount = purchase.amount;
  const purchaseCountry = purchase.purchaseCountry;
  const purchaseDate = new Date(purchase.purchaseDate);
  const day = purchaseDate.getUTCDay();
  const card = (client.cardType || '').toLowerCase();

  const discounts = [];
  const abroad = (purchaseCountry || '').toLowerCase() !== (client.country || '').toLowerCase();

  if (card === 'gold') {
    if ([1, 2, 3].includes(day) && amount > 100) discounts.push(15);
  }
  if (card === 'platinum') {
    if ([1, 2, 3].includes(day) && amount > 100) discounts.push(20);
    if (day === 6 && amount > 200) discounts.push(30);
    if (abroad) discounts.push(5);
  }
  if (card === 'black') {
    if ([1, 2, 3].includes(day) && amount > 100) discounts.push(25);
    if (day === 6 && amount > 200) discounts.push(35);
    if (abroad) discounts.push(5);
  }
  if (card === 'white') {
    if ([1, 2, 3, 4, 5].includes(day) && amount > 100) discounts.push(25);
    if ([6, 0].includes(day) && amount > 200) discounts.push(35);
    if (abroad) discounts.push(5);
  }

  return discounts.length ? Math.max(...discounts) : 0;
}

// POST /purchase
app.post('/purchase', async (req, res) => {
  const { clientId, amount, currency, purchaseDate, purchaseCountry } = req.body;
  
  try {
    if (typeof clientId === 'undefined' || typeof amount === 'undefined' || !currency || !purchaseDate || !purchaseCountry) {
      return res.status(400).json({ 
        status: 'Rejected', 
        error: 'Faltan campos requeridos: clientId, amount, currency, purchaseDate, purchaseCountry' 
      });
    }

    const client = clients.find(c => c.clientId === clientId);
    if (!client) {
      return res.status(404).json({ status: 'Rejected', error: 'Cliente no registrado' });
    }

    if (['black', 'white'].includes((client.cardType || '').toLowerCase())) {
      if (restrictedCountries.map(c => c.toLowerCase()).includes((purchaseCountry || '').toLowerCase())) {
        return res.status(403).json({ 
          status: 'Rejected', 
          error: `El cliente con tarjeta ${client.cardType} no puede realizar compras desde ${purchaseCountry}` 
        });
      }
    }

    const discountPercent = calculateDiscount(client, { amount, purchaseCountry, purchaseDate });
    const discountApplied = Math.round((amount * discountPercent / 100) * 100) / 100;
    const finalAmount = Math.round((amount - discountApplied) * 100) / 100;

    const purchase = {
      clientId,
      originalAmount: amount,
      discountApplied,
      finalAmount,
      benefit: discountPercent > 0 ? `Descuento ${discountPercent}%` : 'Sin beneficio aplicable',
      currency,
      purchaseDate,
      purchaseCountry,
      processedAt: new Date().toISOString()
    };

    // Log a Axiom
    await axiom.logPurchase(purchase);

    return res.json({
      status: 'Approved',
      purchase
    });
  } catch (error) {
    await axiom.logError(error, { endpoint: '/purchase' });
    return res.status(500).json({ status: 'Error', error: error.message });
  }
});

// Listar clientes
app.get('/clients', (req, res) => {
  res.json({
    total: clients.length,
    clients
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  axiom.logError(err, { 
    path: req.path, 
    method: req.method 
  });
  res.status(500).json({ status: 'Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 VISE API disponible en http://localhost:${PORT}`);
  console.log(`📊 Monitoreo con Axiom: ${axiom.enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
  axiom.log('server_started', { port: PORT });
});