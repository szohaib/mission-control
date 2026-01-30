/**
 * Clawdbot Gateway HTTP Client
 * Connects to the Gateway REST API with API key authentication
 */

const https = require('https');
const http = require('http');
const EventEmitter = require('events');

class ClawdbotGatewayClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.gatewayUrl = options.gatewayUrl || process.env.CLAWDBOT_GATEWAY_URL || 'http://127.0.0.1:3002';
    this.apiKey = options.apiKey || process.env.CLAWDBOT_API_KEY;
    this.connected = false;
    
    // Remove trailing slash
    this.gatewayUrl = this.gatewayUrl.replace(/\/$/, '');
    
    // Cache
    this.sessionsCache = [];
    this.lastUpdate = 0;
    this.cacheTimeout = 5000; // 5 seconds
    
    // Test connection
    this.testConnection();
  }

  async testConnection() {
    try {
      const response = await this.request('/health');
      if (response.status === 'ok') {
        this.connected = true;
        this.emit('connected');
        console.log('✅ Connected to Clawdbot Gateway API');
      }
    } catch (error) {
      this.connected = false;
      console.error('❌ Gateway connection failed:', error.message);
      this.emit('error', error);
      
      // Retry connection every 10 seconds
      setTimeout(() => this.testConnection(), 10000);
    }
  }

  async request(path, options = {}) {
    const url = new URL(this.gatewayUrl + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers
        }
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            if (res.statusCode >= 400) {
              reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
            } else {
              resolve(parsed.data || parsed);
            }
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        this.connected = false;
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async listSessions() {
    // Use cache if fresh
    if (this.sessionsCache.length > 0 && Date.now() - this.lastUpdate < this.cacheTimeout) {
      return this.sessionsCache;
    }

    try {
      const response = await this.request('/api/sessions');
      this.sessionsCache = response.sessions || response;
      this.lastUpdate = Date.now();
      return this.sessionsCache;
    } catch (error) {
      console.error('Error listing sessions:', error);
      // Return cached data on error
      return this.sessionsCache;
    }
  }

  async getSession(sessionId) {
    return await this.request(`/api/sessions/${sessionId}`);
  }

  async spawnSession(params) {
    const result = await this.request('/api/sessions/spawn', {
      method: 'POST',
      body: params
    });
    
    // Invalidate cache
    this.lastUpdate = 0;
    
    return result;
  }

  async killSession(sessionId) {
    const result = await this.request(`/api/sessions/${sessionId}/kill`, {
      method: 'POST'
    });
    
    // Invalidate cache
    this.lastUpdate = 0;
    
    return result;
  }

  async sendMessage(sessionId, message) {
    return await this.request(`/api/sessions/${sessionId}/send`, {
      method: 'POST',
      body: { message }
    });
  }

  async getTranscript(sessionId) {
    return await this.request(`/api/sessions/${sessionId}/transcript`);
  }

  disconnect() {
    this.connected = false;
  }
}

// Singleton instance
let gatewayClient = null;

function getGatewayClient() {
  if (!gatewayClient) {
    gatewayClient = new ClawdbotGatewayClient();
  }
  
  return gatewayClient;
}

module.exports = { ClawdbotGatewayClient, getGatewayClient };
