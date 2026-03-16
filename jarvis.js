/**
 * 🤖 JARVIS HUD - Automation & Monitoring System
 * 24/7 Continuous Operation with Auto-Healing
 */

class JarvisAutomation {
  constructor() {
    this.config = null;
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.cycleInterval = 3000;
    this.healthChecks = {};
    this.logs = [];
    this.lastUpdate = null;
    this.init();
  }

  async init() {
    this.log('🚀 Jarvis iniciando...', 'INFO');
    try {
      await this.loadConfig();
      this.initHUD();
      this.startAutomationCycle();
      this.startHealthMonitor();
      this.setupErrorRecovery();
      this.isRunning = true;
      this.log('✅ Jarvis Online - Sistema operacional', 'SUCCESS');
    } catch (error) {
      this.log(`❌ Erro na inicialização: ${error.message}`, 'ERROR');
      this.attemptRecovery();
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('config.json');
      this.config = await response.json();
      this.maxRetries = this.config.retryLogic.maxRetries;
      this.cycleInterval = this.config.retryLogic.retryDelay;
      this.log('⚙️ Configuração carregada com sucesso', 'INFO');
    } catch (error) {
      this.log('⚠️ Config.json não encontrado, usando defaults', 'WARN');
      this.setDefaultConfig();
    }
  }

  setDefaultConfig() {
    this.config = {
      apiEndpoints: {
        status: 'https://project-automation-full.railway.app/api/status'
      },
      retryLogic: {
        maxRetries: 5,
        retryDelay: 3000
      },
      heartbeatInterval: 60000
    };
  }

  initHUD() {
    const hud = document.getElementById('hud');
    if (!hud) {
      this.log('⚠️ HUD element não encontrado', 'WARN');
      return;
    }
    
    hud.innerHTML = `
      <h2>🤖 Jarvis HUD – Automation Funnel</h2>
      <div id='status' style='font-size: 12px; line-height: 1.6;'>
        <p>⏳ Carregando sistema...</p>
      </div>
      <div id='metrics' style='margin-top: 10px; font-size: 11px; border-top: 1px solid #00ffcc; padding-top: 10px;'>
        <p>📊 Uptime: <span id='uptime'>0h 0m</span></p>
        <p>🔄 Ciclos: <span id='cycles'>0</span></p>
        <p>📡 Conexões OK: <span id='successRate'>0%</span></p>
      </div>
    `;
  }

  startAutomationCycle() {
    let cycleCount = 0;
    const startTime = Date.now();

    const cycle = async () => {
      try {
        cycleCount++;
        await this.updateStatus();
        await this.checkSystemHealth();
        this.updateMetrics(cycleCount, startTime);
        if (cycleCount % 20 === 0) {
          this.log(`✅ Ciclo ${cycleCount} completado`, 'INFO');
        }
        this.retryCount = 0;
      } catch (error) {
        this.log(`❌ Erro no ciclo ${cycleCount}: ${error.message}`, 'ERROR');
        this.handleCycleError(error);
      }
    };

    cycle();
    this.automationLoop = setInterval(cycle, this.cycleInterval);
    this.log('🔄 Ciclo de automação iniciado', 'INFO');
  }

  async updateStatus() {
    try {
      const apiUrl = this.config.apiEndpoints.status || 'https://project-automation-full.railway.app/api/status';
      const response = await fetch(apiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`API retornou ${response.status}`);
      const data = await response.json();
      this.displayStatus(data);
      this.lastUpdate = new Date();
      return data;
    } catch (error) {
      throw new Error(`Falha ao conectar API: ${error.message}`);
    }
  }

  displayStatus(data) {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    let html = '<p style="color: #00ff00;">✅ Sistema Online</p>';
    for (const [key, value] of Object.entries(data)) {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      html += `<p><strong>${key}:</strong> ${displayValue}</p>`;
    }
    statusDiv.innerHTML = html;
  }

  async checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      memoryUsage: this.getMemoryEstimate(),
      uptime: process.uptime ? process.uptime() : 'N/A',
      isOnline: navigator.onLine
    };
    this.healthChecks[health.timestamp] = health;
    const keys = Object.keys(this.healthChecks);
    if (keys.length > 100) delete this.healthChecks[keys[0]];
    return health;
  }

  getMemoryEstimate() {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      };
    }
    return 'N/A';
  }

  updateMetrics(cycleCount, startTime) {
    document.getElementById('cycles').textContent = cycleCount;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
    const successRate = this.calculateSuccessRate();
    document.getElementById('successRate').textContent = successRate + '%';
  }

  calculateSuccessRate() {
    if (this.logs.length === 0) return 0;
    const successes = this.logs.filter(log => log.type === 'SUCCESS').length;
    return Math.round((successes / this.logs.length) * 100);
  }

  startHealthMonitor() {
    const heartbeat = setInterval(() => {
      const memUsage = this.getMemoryEstimate();
      this.log(`💓 Heartbeat - Memória: ${JSON.stringify(memUsage)}`, 'INFO');
    }, this.config.heartbeatInterval || 60000);
    this.healthMonitor = heartbeat;
  }

  handleCycleError(error) {
    this.retryCount++;
    if (this.retryCount <= this.maxRetries) {
      this.log(`🔄 Tentativa ${this.retryCount}/${this.maxRetries}`, 'WARN');
    } else {
      this.log('⚠️ Máximo de tentativas atingido, aguardando recuperação...', 'WARN');
      this.retryCount = 0;
    }
  }

  setupErrorRecovery() {
    window.addEventListener('online', () => {
      this.log('🌐 Conexão restaurada', 'SUCCESS');
      this.restartCycle();
    });
    window.addEventListener('offline', () => {
      this.log('📡 Conexão perdida - Aguardando reconexão', 'WARN');
    });
    setInterval(() => {
      if (!navigator.onLine) {
        this.attemptRecovery();
      }
    }, 300000);
  }

  attemptRecovery() {
    this.log('🔧 Tentando recuperação automática...', 'INFO');
    if (this.automationLoop) clearInterval(this.automationLoop);
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    setTimeout(() => { this.init(); }, 5000);
  }

  restartCycle() {
    if (this.automationLoop) clearInterval(this.automationLoop);
    this.startAutomationCycle();
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString('pt-PT');
    const logEntry = { timestamp, message, type };
    this.logs.push(logEntry);
    if (this.logs.length > 500) this.logs.shift();
    const styles = {
      INFO: 'color: #00ffcc; font-weight: bold;',
      SUCCESS: 'color: #00ff00; font-weight: bold;',
      WARN: 'color: #ffff00; font-weight: bold;',
      ERROR: 'color: #ff0000; font-weight: bold;'
    };
    console.log(`%c[${timestamp}] ${type}: ${message}`, styles[type] || styles.INFO);
  }

  getLogs() { return this.logs; }

  stop() {
    if (this.automationLoop) clearInterval(this.automationLoop);
    if (this.healthMonitor) clearInterval(this.healthMonitor);
    this.isRunning = false;
    this.log('⏹️ Jarvis desligado', 'INFO');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.jarvis = new JarvisAutomation();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.jarvis) {
      window.jarvis = new JarvisAutomation();
    }
  });
} else {
  if (!window.jarvis) {
    window.jarvis = new JarvisAutomation();
  }
}