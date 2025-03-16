document.addEventListener('DOMContentLoaded', () => {
    let temperatureChart = null;
    let levelChart = null;
    let tempHistoryChart = null;
    let levelHistoryChart = null;
    let operationMode = 'manual';
    let setpoints = {
        temp: {
            min: 20.0,
            max: 30.0
        },
        level: {
            min: 60,
            max: 90
        }
    };

    // Atualizar data e hora
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        };
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Sao_Paulo'
        };

        document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', dateOptions);
        document.getElementById('current-time').textContent = now.toLocaleTimeString('pt-BR', timeOptions);
    }

    // Base Chart Configuration
    const baseChartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#ffffff',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Segoe UI', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                color: '#ffffff',
                font: {
                    family: "'Segoe UI', sans-serif",
                    size: 16,
                    weight: '500'
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#8a94a7',
                    font: {
                        family: "'Segoe UI', sans-serif",
                        size: 11
                    }
                },
                border: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#8a94a7',
                    font: {
                        family: "'Segoe UI', sans-serif",
                        size: 11
                    }
                },
                border: {
                    display: false
                }
            }
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 3,
                hoverRadius: 5
            }
        }
    };

    // Chart Configurations
    const chartConfigs = {
        temperature: {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        data: [],
                        borderColor: '#6C5DD3',
                        backgroundColor: 'rgba(108, 93, 211, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'SetPoint Mínimo',
                        data: [],
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    },
                    {
                        label: 'SetPoint Máximo',
                        data: [],
                        borderColor: '#2ecc71',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                ...baseChartConfig,
                plugins: {
                    ...baseChartConfig.plugins,
                    title: {
                        ...baseChartConfig.plugins.title,
                        text: 'Variação de Temperatura'
                    }
                }
            }
        },
        level: {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Nível (%)',
                        data: [],
                        borderColor: '#00B5D8',
                        backgroundColor: 'rgba(0, 181, 216, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'SetPoint Mínimo',
                        data: [],
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    },
                    {
                        label: 'SetPoint Máximo',
                        data: [],
                        borderColor: '#2ecc71',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                ...baseChartConfig,
                plugins: {
                    ...baseChartConfig.plugins,
                    title: {
                        ...baseChartConfig.plugins.title,
                        text: 'Nível da Água'
                    }
                },
                scales: {
                    ...baseChartConfig.scales,
                    y: {
                        ...baseChartConfig.scales.y,
                        min: 0,
                        max: 100
                    }
                }
            }
        }
    };

    // Initialize Charts
    function initCharts() {
        const tempCtx = document.getElementById('temperatureChart')?.getContext('2d');
        const levelCtx = document.getElementById('levelChart')?.getContext('2d');
        
        if (tempCtx) {
            temperatureChart = new Chart(tempCtx, chartConfigs.temperature);
            updateChartHeader('temperatureChart', setpoints.temp);
        }
        if (levelCtx) {
            levelChart = new Chart(levelCtx, chartConfigs.level);
            updateChartHeader('levelChart', setpoints.level);
        }

        // History charts
        const tempHistoryCtx = document.getElementById('tempHistoryChart')?.getContext('2d');
        const levelHistoryCtx = document.getElementById('levelHistoryChart')?.getContext('2d');

        if (tempHistoryCtx) {
            tempHistoryChart = new Chart(tempHistoryCtx, {
                ...chartConfigs.temperature,
                options: {
                    ...chartConfigs.temperature.options,
                    plugins: {
                        ...chartConfigs.temperature.options.plugins,
                        title: {
                            ...chartConfigs.temperature.options.plugins.title,
                            text: 'Histórico de Temperatura'
                        }
                    }
                }
            });
        }

        if (levelHistoryCtx) {
            levelHistoryChart = new Chart(levelHistoryCtx, {
                ...chartConfigs.level,
                options: {
                    ...chartConfigs.level.options,
                    plugins: {
                        ...chartConfigs.level.options.plugins,
                        title: {
                            ...chartConfigs.level.options.plugins.title,
                            text: 'Histórico do Nível da Água'
                        }
                    }
                }
            });
        }
    }

    // Update Chart Header
    function updateChartHeader(chartId, setpoints) {
        const chartHeader = document.querySelector(`#${chartId}`).closest('.chart-card').querySelector('.chart-header');
        const existingStats = chartHeader.querySelector('.chart-stats');
        
        if (!existingStats) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'chart-stats';
            
            statsDiv.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">SetPoint Min</span>
                    <span class="stat-value">${setpoints.min}${chartId.includes('temperature') ? '°C' : '%'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">SetPoint Max</span>
                    <span class="stat-value">${setpoints.max}${chartId.includes('temperature') ? '°C' : '%'}</span>
                </div>
            `;
            
            chartHeader.appendChild(statsDiv);
        }
    }

    // Update Charts
    function updateCharts(data, isHistorical = false) {
        if (!data || !data.readings || data.readings.length === 0) {
            console.log('No valid data available');
            return;
        }

        const readings = data.readings;
        const currentSetpoints = data.setpoints || setpoints;
        
        const labels = readings.map(reading => {
            const date = new Date(reading.timestamp);
            return isHistorical ? date.toLocaleDateString() : date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'America/Sao_Paulo'
            });
        });

        // Update temperature charts
        const temperatures = readings.map(reading => reading.temperature);
        const tempMinSetpoints = new Array(labels.length).fill(currentSetpoints.temp.min);
        const tempMaxSetpoints = new Array(labels.length).fill(currentSetpoints.temp.max);

        const tempChartData = {
            labels,
            datasets: [
                {
                    ...chartConfigs.temperature.data.datasets[0],
                    data: temperatures
                },
                {
                    ...chartConfigs.temperature.data.datasets[1],
                    data: tempMinSetpoints
                },
                {
                    ...chartConfigs.temperature.data.datasets[2],
                    data: tempMaxSetpoints
                }
            ]
        };

        if (temperatureChart && !isHistorical) {
            temperatureChart.data = tempChartData;
            temperatureChart.update();
        }

        if (tempHistoryChart && isHistorical) {
            tempHistoryChart.data = tempChartData;
            tempHistoryChart.update();
        }

        // Update level charts
        const levels = readings.map(reading => reading.level);
        const levelMinSetpoints = new Array(labels.length).fill(currentSetpoints.level.min);
        const levelMaxSetpoints = new Array(labels.length).fill(currentSetpoints.level.max);

        const levelChartData = {
            labels,
            datasets: [
                {
                    ...chartConfigs.level.data.datasets[0],
                    data: levels
                },
                {
                    ...chartConfigs.level.data.datasets[1],
                    data: levelMinSetpoints
                },
                {
                    ...chartConfigs.level.data.datasets[2],
                    data: levelMaxSetpoints
                }
            ]
        };

        if (levelChart && !isHistorical) {
            levelChart.data = levelChartData;
            levelChart.update();
        }

        if (levelHistoryChart && isHistorical) {
            levelHistoryChart.data = levelChartData;
            levelHistoryChart.update();
        }

        if (isHistorical) {
            updateStats(readings);
        }
        updateDeviceStatus(readings[readings.length - 1]);
    }

    // Função para atualizar estatísticas
    function updateStats(data) {
        if (!Array.isArray(data) || data.length === 0) return;

        // Temperature Stats
        const temps = data.map(d => d.temperature).filter(t => t !== null);
        if (temps.length > 0) {
            const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
            const maxTemp = Math.max(...temps);
            const minTemp = Math.min(...temps);

            document.getElementById('temp-avg').textContent = `${avgTemp.toFixed(1)}°C`;
            document.getElementById('temp-max').textContent = `${maxTemp.toFixed(1)}°C`;
            document.getElementById('temp-min').textContent = `${minTemp.toFixed(1)}°C`;
        }

        // Level Stats
        const levels = data.map(d => d.level).filter(l => l !== null);
        if (levels.length > 0) {
            const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
            const maxLevel = Math.max(...levels);
            const minLevel = Math.min(...levels);

            document.getElementById('level-avg').textContent = `${avgLevel.toFixed(1)}%`;
            document.getElementById('level-max').textContent = `${maxLevel.toFixed(1)}%`;
            document.getElementById('level-min').textContent = `${minLevel.toFixed(1)}%`;
        }
    }

    // Função para atualizar status dos dispositivos
    function updateDeviceStatus(latestData) {
        if (!latestData) return;

        const devices = {
            bomba: {
                statusElement: document.getElementById('pump-status'),
                modeElement: document.getElementById('pump-mode'),
                status: latestData.pump_status
            },
            aquecedor: {
                statusElement: document.getElementById('heater-status'),
                modeElement: document.getElementById('heater-mode'),
                status: latestData.heater_status
            }
        };

        Object.entries(devices).forEach(([device, info]) => {
            if (info.statusElement) {
                info.statusElement.textContent = info.status ? 'Ligado' : 'Desligado';
                info.statusElement.className = `status ${info.status ? 'active' : 'inactive'}`;
            }
            if (info.modeElement) {
                info.modeElement.textContent = operationMode;
            }
        });
    }

    // Atualizar a função loadLatestData para buscar dados a cada 5 segundos
async function loadLatestData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch('/api/temperature/latest', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        updateCharts(data, false);
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        document.getElementById('error-message').textContent = "❌ Erro ao carregar dados. Verifique a conexão!";
    }
}

// Função para carregar dados históricos com melhor tratamento de erros
async function loadData(startDate, endDate) {
    if (!validateDateRange(startDate, endDate)) return;

    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.style.display = 'block';

    try {
        const response = await fetch(`/api/temperature?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        updateCharts(data, true);
    } catch (error) {
        console.error('❌ Erro ao carregar dados históricos:', error);
        showError('❌ Falha ao buscar dados históricos. Verifique a conexão.');
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Validação do intervalo de datas antes da busca
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        showError('❌ Por favor, selecione as datas inicial e final.');
        return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showError('❌ A data inicial não pode ser maior que a final.');
        return false;
    }

    return true;
}

// Função para exibir mensagens de erro na interface
function showError(message) {
    const errorBox = document.getElementById('error-message');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

// Setup dos eventos da interface (filtro por data)
function setupEventListeners() {
    const filterButton = document.getElementById('filter-button');
    if (!filterButton) {
        console.warn("⚠️ Botão de filtro não encontrado no DOM.");
        return;
    }

    filterButton.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        loadData(startDate, endDate);
    });
}

// Controle inteligente da atualização automática de dados
let updateInterval = null;

function startUpdating() {
    if (!updateInterval) {
        loadLatestData();
        updateInterval = setInterval(loadLatestData, 5000);
    }
}

function stopUpdating() {
    clearInterval(updateInterval);
    updateInterval = null;
}

// Pausar a atualização quando a aba não estiver visível
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        startUpdating();
    } else {
        stopUpdating();
    }
});

// Iniciar atualização automática apenas quando necessário
startUpdating();


    // Initialize
    function init() {
        initCharts();
        setupEventListeners();
        
        // Set initial date range
        const end = new Date();
        const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
        
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput && endInput) {
            startInput.value = start.toISOString().split('T')[0];
            endInput.value = end.toISOString().split('T')[0];
            loadData(start.toISOString(), end.toISOString());
        }
        
        // Iniciar atualização de data e hora
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Start periodic updates for main dashboard
        loadLatestData();
        setInterval(loadLatestData, 5000);
    }

    init();
});