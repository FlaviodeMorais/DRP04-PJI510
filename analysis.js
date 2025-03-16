document.addEventListener('DOMContentLoaded', () => {
    let tempHistoryChart, levelHistoryChart, equipmentStatusChart;
    
    // Chart configurations
    const chartConfig = {
        temperature: {
            type: 'line',
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Histórico de Temperatura'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'DD/MM HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Data/Hora'
                        }
                    }
                }
            }
        },
        level: {
            type: 'line',
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Histórico do Nível da Água'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Nível (%)'
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'DD/MM HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Data/Hora'
                        }
                    }
                }
            }
        },
        equipment: {
            type: 'line',
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Status dos Equipamentos'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            callback: value => value === 1 ? 'Ligado' : 'Desligado'
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'DD/MM HH:mm'
                            }
                        }
                    }
                }
            }
        }
    };

    // Initialize charts
    function initCharts() {
        const tempCtx = document.getElementById('tempHistoryChart')?.getContext('2d');
        const levelCtx = document.getElementById('levelHistoryChart')?.getContext('2d');
        const equipmentCtx = document.getElementById('equipmentStatusChart')?.getContext('2d');

        if (tempCtx) {
            tempHistoryChart = new Chart(tempCtx, {
                ...chartConfig.temperature,
                data: {
                    datasets: [{
                        label: 'Temperatura',
                        borderColor: '#9f7aea',
                        backgroundColor: 'rgba(159, 122, 234, 0.1)',
                        fill: true
                    }]
                }
            });
        }

        if (levelCtx) {
            levelHistoryChart = new Chart(levelCtx, {
                ...chartConfig.level,
                data: {
                    datasets: [{
                        label: 'Nível',
                        borderColor: '#4299e1',
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        fill: true
                    }]
                }
            });
        }

        if (equipmentCtx) {
            equipmentStatusChart = new Chart(equipmentCtx, {
                ...chartConfig.equipment,
                data: {
                    datasets: [
                        {
                            label: 'Bomba',
                            borderColor: '#48bb78',
                            stepped: true
                        },
                        {
                            label: 'Aquecedor',
                            borderColor: '#f56565',
                            stepped: true
                        }
                    ]
                }
            });
        }
    }

    // Update statistics
    function updateStats(data) {
        if (!data || !data.length) return;

        // Temperature stats
        const temps = data.map(d => d.temperature).filter(t => t !== null);
        if (temps.length) {
            const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
            const maxTemp = Math.max(...temps);
            const minTemp = Math.min(...temps);

            document.getElementById('temp-avg').textContent = `${avgTemp.toFixed(1)}°C`;
            document.getElementById('temp-max').textContent = `${maxTemp.toFixed(1)}°C`;
            document.getElementById('temp-min').textContent = `${minTemp.toFixed(1)}°C`;
        }

        // Level stats
        const levels = data.map(d => d.level).filter(l => l !== null);
        if (levels.length) {
            const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
            const maxLevel = Math.max(...levels);
            const minLevel = Math.min(...levels);

            document.getElementById('level-avg').textContent = `${avgLevel.toFixed(1)}%`;
            document.getElementById('level-max').textContent = `${maxLevel.toFixed(1)}%`;
            document.getElementById('level-min').textContent = `${minLevel.toFixed(1)}%`;
        }
    }

    // Update charts with new data
    function updateCharts(data) {
        if (!data || !data.length) return;

        // Update temperature chart
        if (tempHistoryChart) {
            tempHistoryChart.data.labels = data.map(d => new Date(d.timestamp));
            tempHistoryChart.data.datasets[0].data = data.map(d => ({
                x: new Date(d.timestamp),
                y: d.temperature
            }));
            tempHistoryChart.update();
        }

        // Update level chart
        if (levelHistoryChart) {
            levelHistoryChart.data.labels = data.map(d => new Date(d.timestamp));
            levelHistoryChart.data.datasets[0].data = data.map(d => ({
                x: new Date(d.timestamp),
                y: d.level
            }));
            levelHistoryChart.update();
        }

        // Update equipment status chart
        if (equipmentStatusChart) {
            equipmentStatusChart.data.labels = data.map(d => new Date(d.timestamp));
            equipmentStatusChart.data.datasets[0].data = data.map(d => ({
                x: new Date(d.timestamp),
                y: d.pump_status
            }));
            equipmentStatusChart.data.datasets[1].data = data.map(d => ({
                x: new Date(d.timestamp),
                y: d.heater_status
            }));
            equipmentStatusChart.update();
        }

        updateStats(data);
    }

    // Load data based on date range
    async function loadData(startDate, endDate) {
        try {
            const response = await fetch(`/api/temperature?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Erro ao carregar dados');
            const data = await response.json();
            updateCharts(data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados históricos');
        }
    }

    // Setup filter button
    const filterButton = document.getElementById('filter-button');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (!startDate || !endDate) {
                alert('Por favor, selecione as datas inicial e final');
                return;
            }

            loadData(startDate, endDate);
        });
    }

    // Initialize
    initCharts();

    // Load last 24 hours by default
    const end = new Date();
    const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
    document.getElementById('startDate').value = start.toISOString().slice(0, 16);
    document.getElementById('endDate').value = end.toISOString().slice(0, 16);
    loadData(start.toISOString(), end.toISOString());
});