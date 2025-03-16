document.addEventListener('DOMContentLoaded', () => {
    // Carregar configurações salvas
    loadSettings();

    // Configurar eventos dos botões
    setupEventListeners();
});

/**
 * Carrega as configurações do sistema.
 * Funciona tanto no GitHub Pages quanto em um ambiente com backend.
 * 
 * - Se o site estiver rodando no GitHub Pages, carrega do localStorage.
 * - Se o site estiver rodando em um servidor backend, busca via API `/api/settings`.
 * - Se a API falhar, aplica configurações padrão para evitar falhas no sistema.
 */
function loadSettings() {
    const isGitHubPages = window.location.hostname.includes("github.io") || window.location.hostname.includes("githubusercontent.com"); 

    if (isGitHubPages) {
        // 🟢 GitHub Pages: Carrega configurações do localStorage (pois não há backend disponível)
        const savedSettings = localStorage.getItem('aquaponia-settings');
        if (savedSettings) {
            applySettings(JSON.parse(savedSettings)); // Aplica configurações salvas no navegador
        } else {
            applyDefaultSettings(); // Aplica configurações padrão se não houver nada salvo
        }
    } else {
        // 🔵 Ambiente com backend: Busca configurações via API
        fetch('/api/settings')
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`); // Verifica erros HTTP
                return response.json(); // Converte a resposta para JSON
            })
            .then(settings => {
                applySettings(settings); // Aplica as configurações recebidas do backend
                localStorage.setItem('aquaponia-settings', JSON.stringify(settings)); // Salva no localStorage para acesso offline
            })
            .catch(error => {
                console.warn('⚠️ Backend não disponível. Tentando carregar do localStorage.', error);
                
                const savedSettings = localStorage.getItem('aquaponia-settings');
                if (savedSettings) {
                    console.log("📦 Carregando configurações salvas no navegador.");
                    applySettings(JSON.parse(savedSettings));
                } else {
                    console.log("⚙️ Aplicando configurações padrão.");
                    applyDefaultSettings(); // Se a API falhar e não houver nada salvo, usa padrão
                }
            });
    }
}


// Aplicar configurações aos campos
function applySettings(settings) {
    // Sistema
    document.getElementById('system-name').value = settings.systemName || 'Aquaponia';
    document.getElementById('update-interval').value = settings.updateInterval || 1;
    document.getElementById('data-retention').value = settings.dataRetention || 30;

    // Alertas
    document.getElementById('email-alerts').checked = settings.emailAlerts ?? true;
    document.getElementById('push-alerts').checked = settings.pushAlerts ?? true;
    document.getElementById('alert-email').value = settings.alertEmail || '';

    // Limites de Temperatura
    document.getElementById('temp-critical-min').value = settings.temperature?.criticalMin || 18;
    document.getElementById('temp-warning-min').value = settings.temperature?.warningMin || 20;
    document.getElementById('temp-warning-max').value = settings.temperature?.warningMax || 28;
    document.getElementById('temp-critical-max').value = settings.temperature?.criticalMax || 30;

    // Limites de Nível
    document.getElementById('level-critical-min').value = settings.level?.criticalMin || 50;
    document.getElementById('level-warning-min').value = settings.level?.warningMin || 60;
    document.getElementById('level-warning-max').value = settings.level?.warningMax || 85;
    document.getElementById('level-critical-max').value = settings.level?.criticalMax || 90;

    // Automação da Bomba
    document.getElementById('pump-auto').checked = settings.pump?.auto ?? true;
    document.getElementById('pump-on-time').value = settings.pump?.onTime || '06:00';
    document.getElementById('pump-off-time').value = settings.pump?.offTime || '18:00';

    // Automação do Aquecedor
    document.getElementById('heater-auto').checked = settings.heater?.auto ?? true;
    document.getElementById('heater-on-temp').value = settings.heater?.onTemp || 22;
    document.getElementById('heater-off-temp').value = settings.heater?.offTemp || 24;
}

// Configurações padrão
function applyDefaultSettings() {
    const defaultSettings = {
        systemName: 'Aquaponia',
        updateInterval: 1,
        dataRetention: 30,
        emailAlerts: true,
        pushAlerts: true,
        alertEmail: '',
        temperature: {
            criticalMin: 18,
            warningMin: 20,
            warningMax: 28,
            criticalMax: 30
        },
        level: {
            criticalMin: 50,
            warningMin: 60,
            warningMax: 85,
            criticalMax: 90
        },
        pump: {
            auto: true,
            onTime: '06:00',
            offTime: '18:00'
        },
        heater: {
            auto: true,
            onTemp: 22,
            offTemp: 24
        }
    };

    applySettings(defaultSettings);
}

// Configurar event listeners corretamente
function setupEventListeners() {
    // Botão Salvar
    document.getElementById('save-settings').addEventListener('click', () => {
        saveSettings();
    });

    // Botão Restaurar Padrões
    document.getElementById('reset-settings').addEventListener('click', () => {
        if (confirm('Deseja restaurar todas as configurações para os valores padrão?')) {
            applyDefaultSettings();
            saveSettings(); // Salva os valores padrão
        }
    });
}

// ✅ Função para salvar configurações no localStorage
function saveSettings() {
    const settings = collectSettings();
    try {
        localStorage.setItem('aquaponia-settings', JSON.stringify(settings)); // Salva no navegador
        alert('Configurações salvas com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações. Por favor, tente novamente.');
    }
}

// ✅ Chamar a função de carregar configurações ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();

    // Validações em tempo real
    setupValidations();
});

// Coletar configurações dos campos
function collectSettings() {
    return {
        systemName: document.getElementById('system-name').value,
        updateInterval: parseInt(document.getElementById('update-interval').value),
        dataRetention: parseInt(document.getElementById('data-retention').value),
        emailAlerts: document.getElementById('email-alerts').checked,
        pushAlerts: document.getElementById('push-alerts').checked,
        alertEmail: document.getElementById('alert-email').value,
        temperature: {
            criticalMin: parseFloat(document.getElementById('temp-critical-min').value),
            warningMin: parseFloat(document.getElementById('temp-warning-min').value),
            warningMax: parseFloat(document.getElementById('temp-warning-max').value),
            criticalMax: parseFloat(document.getElementById('temp-critical-max').value)
        },
        level: {
            criticalMin: parseInt(document.getElementById('level-critical-min').value),
            warningMin: parseInt(document.getElementById('level-warning-min').value),
            warningMax: parseInt(document.getElementById('level-warning-max').value),
            criticalMax: parseInt(document.getElementById('level-critical-max').value)
        },
        pump: {
            auto: document.getElementById('pump-auto').checked,
            onTime: document.getElementById('pump-on-time').value,
            offTime: document.getElementById('pump-off-time').value
        },
        heater: {
            auto: document.getElementById('heater-auto').checked,
            onTemp: parseFloat(document.getElementById('heater-on-temp').value),
            offTemp: parseFloat(document.getElementById('heater-off-temp').value)
        }
    };
}

// Configurar validações
function setupValidations() {
    // Validação de temperatura
    const tempInputs = [
        'temp-critical-min',
        'temp-warning-min',
        'temp-warning-max',
        'temp-critical-max'
    ];

    tempInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', validateTemperatureRanges);
    });

    // Validação de nível
    const levelInputs = [
        'level-critical-min',
        'level-warning-min',
        'level-warning-max',
        'level-critical-max'
    ];

    levelInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', validateLevelRanges);
    });

    // Validação de horários da bomba
    document.getElementById('pump-on-time').addEventListener('change', validatePumpTimes);
    document.getElementById('pump-off-time').addEventListener('change', validatePumpTimes);

    // Validação de temperaturas do aquecedor
    document.getElementById('heater-on-temp').addEventListener('change', validateHeaterTemps);
    document.getElementById('heater-off-temp').addEventListener('change', validateHeaterTemps);
}

// Funções de validação
function validateTemperatureRanges() {
    const criticalMin = parseFloat(document.getElementById('temp-critical-min').value);
    const warningMin = parseFloat(document.getElementById('temp-warning-min').value);
    const warningMax = parseFloat(document.getElementById('temp-warning-max').value);
    const criticalMax = parseFloat(document.getElementById('temp-critical-max').value);

    if (criticalMin >= warningMin || 
        warningMin >= warningMax || 
        warningMax >= criticalMax) {
        alert('Os limites de temperatura devem seguir a ordem: Crítico Mín < Alerta Mín < Alerta Máx < Crítico Máx');
        applyDefaultSettings();
    }
}

function validateLevelRanges() {
    const criticalMin = parseInt(document.getElementById('level-critical-min').value);
    const warningMin = parseInt(document.getElementById('level-warning-min').value);
    const warningMax = parseInt(document.getElementById('level-warning-max').value);
    const criticalMax = parseInt(document.getElementById('level-critical-max').value);

    if (criticalMin >= warningMin || 
        warningMin >= warningMax || 
        warningMax >= criticalMax) {
        alert('Os limites de nível devem seguir a ordem: Crítico Mín < Alerta Mín < Alerta Máx < Crítico Máx');
        applyDefaultSettings();
    }
}

function validatePumpTimes() {
    const onTime = document.getElementById('pump-on-time').value;
    const offTime = document.getElementById('pump-off-time').value;

    if (onTime >= offTime) {
        alert('O horário de ligar deve ser anterior ao horário de desligar');
        document.getElementById('pump-on-time').value = '06:00';
        document.getElementById('pump-off-time').value = '18:00';
    }
}

function validateHeaterTemps() {
    const onTemp = parseFloat(document.getElementById('heater-on-temp').value);
    const offTemp = parseFloat(document.getElementById('heater-off-temp').value);

    if (onTemp >= offTemp) {
        alert('A temperatura para ligar deve ser menor que a temperatura para desligar');
        document.getElementById('heater-on-temp').value = '22';
        document.getElementById('heater-off-temp').value = '24';
    }
}