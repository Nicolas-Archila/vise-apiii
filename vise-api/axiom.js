// axiom.js - Configuración de Axiom para monitoreo y logging
const axios = require('axios');

class AxiomLogger {
  constructor() {
    this.axiomToken = process.env.AXIOM_TOKEN || '';
    this.axiomDataset = process.env.AXIOM_DATASET || 'vise-api-logs';
    this.axiomUrl = `https://api.axiom.co/v1/datasets/${this.axiomDataset}/ingest`;
    this.enabled = !!this.axiomToken;

    if (!this.enabled) {
      console.warn('⚠️  Axiom token not configured. Logging to console only.');
    } else {
      console.log('✅ Axiom monitoring enabled');
    }
  }

  async log(eventType, data, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      data: data,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'vise-api',
        ...metadata
      }
    };

    // Siempre logear en consola
    console.log(`[${eventType}]`, JSON.stringify(data, null, 2));

    // Enviar a Axiom si está habilitado
    if (this.enabled) {
      try {
        await axios.post(
          this.axiomUrl,
          [logEntry],
          {
            headers: {
              'Authorization': `Bearer ${this.axiomToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('Error sending to Axiom:', error.message);
      }
    }

    return logEntry;
  }

  // Métodos específicos para diferentes tipos de eventos
  async logClientCreated(client) {
    return this.log('client_created', client, { action: 'registration' });
  }

  async logPurchase(purchase) {
    return this.log('purchase_completed', purchase, { action: 'transaction' });
  }

  async logError(error, context = {}) {
    return this.log('error', {
      message: error.message,
      stack: error.stack,
      ...context
    }, { severity: 'error' });
  }

  async logRequest(req) {
    return this.log('http_request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }, { type: 'http' });
  }

  async logMetric(metricName, value, tags = {}) {
    return this.log('metric', {
      metric_name: metricName,
      value: value,
      tags: tags
    }, { type: 'metric' });
  }
}

// Exportar instancia única (singleton)
module.exports = new AxiomLogger();