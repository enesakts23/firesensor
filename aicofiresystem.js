class ModernFireDashboard {
    constructor() {
        this.sensors = {
            temperature: {
                id: 'temperature',
                name: 'Temperature',
                unit: '°C',
                current: 24.5,
                min: 15,
                max: 60,
                thresholds: { warning: 35, critical: 45 },
                history: [],
                status: 'normal',
                trend: { direction: 'up', value: '+0.3°C' },
                color: '#ff6b35',
                pattern: 'sine'
            },
            humidity: {
                id: 'humidity',
                name: 'Humidity',
                unit: '%',
                current: 45.2,
                min: 20,
                max: 85,
                thresholds: { warning: 30, critical: 80 },
                history: [],
                status: 'normal',
                trend: { direction: 'down', value: '-1.2%' },
                color: '#00d4ff',
                pattern: 'cosine'
            },
            'air-quality': {
                id: 'air-quality',
                name: 'Air Quality',
                unit: 'AQI',
                current: 28,
                min: 0,
                max: 200,
                thresholds: { warning: 50, critical: 100 },
                history: [],
                status: 'normal',
                trend: { direction: 'up', value: '+2 AQI' },
                color: '#00ff88',
                pattern: 'noise'
            },
            gas: {
                id: 'gas',
                name: 'Gas Detection',
                unit: 'ppm',
                current: 125,
                min: 50,
                max: 800,
                thresholds: { warning: 300, critical: 500 },
                history: [],
                status: 'normal',
                trend: { direction: 'stable', value: 'Stable' },
                color: '#ffd700',
                pattern: 'random'
            },
            'surface-temp': {
                id: 'surface-temp',
                name: 'Surface Temp',
                unit: '°C',
                current: 23.8,
                min: 18,
                max: 90,
                thresholds: { warning: 60, critical: 80 },
                history: [],
                status: 'normal',
                trend: { direction: 'up', value: '+0.5°C' },
                color: '#8a2be2',
                pattern: 'wave'
            },
            tvoc: {
                id: 'tvoc',
                name: 'TVOC',
                unit: 'ppb',
                current: 350,
                min: 0,
                max: 2000,
                thresholds: { warning: 660, critical: 2200 },
                history: [],
                status: 'normal',
                trend: { direction: 'stable', value: 'Stable' },
                color: '#34d399',
                pattern: 'noise'
            },
            eco2: {
                id: 'eco2',
                name: 'eCO2',
                unit: 'ppm',
                current: 450,
                min: 400,
                max: 5000,
                thresholds: { warning: 1000, critical: 2000 },
                history: [],
                status: 'normal',
                trend: { direction: 'up', value: '+5ppm' },
                color: '#fbbf24',
                pattern: 'sine'
            },
            no2: {
                id: 'no2',
                name: 'NO2',
                unit: 'ppb',
                current: 20,
                min: 0,
                max: 200,
                thresholds: { warning: 50, critical: 100 },
                history: [],
                status: 'normal',
                trend: { direction: 'stable', value: 'Stable' },
                color: '#a855f7',
                pattern: 'random'
            },
            co: {
                id: 'co',
                name: 'CO',
                unit: 'ppm',
                current: 5,
                min: 0,
                max: 100,
                thresholds: { warning: 25, critical: 50 },
                history: [],
                status: 'normal',
                trend: { direction: 'stable', value: 'Stable' },
                color: '#f87171',
                pattern: 'cosine'
            }
        };

        this.systemState = {
            isActive: true,
            currentView: 'chart',
            alertCount: 0,
            sensorCount: 9,
            lastUpdate: new Date(),
            scenario: 'normal'
        };

        this.scenarios = {
            normal: {
                name: 'Normal Operation',
                multipliers: { temperature: 1.0, humidity: 1.0, 'air-quality': 1.0, gas: 1.0, 'surface-temp': 1.0, tvoc: 1.0, eco2: 1.0, no2: 1.0, co: 1.0 }
            },
            fire_simulation: {
                name: 'Fire Simulation',
                multipliers: { temperature: 1.8, humidity: 0.7, 'air-quality': 3.0, gas: 4.0, 'surface-temp': 2.0, tvoc: 5.0, eco2: 3.5, no2: 6.0, co: 8.0 }
            },
            maintenance: {
                name: 'Maintenance Mode',
                multipliers: { temperature: 0.9, humidity: 1.1, 'air-quality': 0.8, gas: 0.6, 'surface-temp': 0.85, tvoc: 0.9, eco2: 0.9, no2: 0.9, co: 0.9 }
            }
        };

        this.updateInterval = null;
        this.animationFrames = new Map();
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Modern Fire Detection Dashboard...');
            
            this.generateHistoricalData();
            this.setupEventListeners();
            this.initializeUI();
            // Real-time updates now come from MQTT data instead of fake data generation
            this.createParticleEffects();
            
            // Initialize chart system
            if (window.SensorChartSystem) {
                this.chartSystem = new window.SensorChartSystem(this);
                this.chartSystem.initializeCharts();
                console.log('📈 Chart system initialized!');
            }
            
            console.log('✅ Dashboard initialized successfully - Ready for real MQTT data!');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showNotification('System initialization failed', 'error');
        }
    }

    generateHistoricalData() {
        Object.keys(this.sensors).forEach(sensorId => {
            const sensor = this.sensors[sensorId];
            sensor.history = [];
            
            for (let i = 0; i < 50; i++) {
                const timeIndex = i / 50;
                let value = sensor.current;
                
                switch (sensor.pattern) {
                    case 'sine':
                        value += Math.sin(timeIndex * Math.PI * 4) * 2;
                        break;
                    case 'cosine':
                        value += Math.cos(timeIndex * Math.PI * 3) * 3;
                        break;
                    case 'wave':
                        value += Math.sin(timeIndex * Math.PI * 6) * 1.5;
                        value += Math.cos(timeIndex * Math.PI * 2) * 1;
                        break;
                    case 'noise':
                        value += (Math.random() - 0.5) * 4;
                        break;
                    case 'random':
                    default:
                        value += (Math.random() - 0.5) * 2;
                        break;
                }
                
                value += timeIndex * 0.5;
                value = Math.max(sensor.min, Math.min(sensor.max * 0.8, value));
                sensor.history.push(parseFloat(value.toFixed(2)));
            }
            
            sensor.current = sensor.history[sensor.history.length - 1];
        });
    }

    // generateNewData method removed - now using real MQTT data instead of fake data generation

    gaussianRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    updateSensorHistory(sensorId, value) {
        const sensor = this.sensors[sensorId];
        sensor.history.push(value);
        
        if (sensor.history.length > 50) {
            sensor.history.shift();
        }
    }

    updateSensorStatus(sensorId) {
        const sensor = this.sensors[sensorId];
        const value = sensor.current;
        const buffer = 1;
        
        if (sensor.status === 'critical') {
            if (value < sensor.thresholds.critical - buffer) {
                sensor.status = value >= sensor.thresholds.warning ? 'warning' : 'normal';
            }
        } else if (sensor.status === 'warning') {
            if (value >= sensor.thresholds.critical) {
                sensor.status = 'critical';
            } else if (value < sensor.thresholds.warning - buffer) {
                sensor.status = 'normal';
            }
        } else {
            if (value >= sensor.thresholds.critical) {
                sensor.status = 'critical';
            } else if (value >= sensor.thresholds.warning) {
                sensor.status = 'warning';
            }
        }
    }

    updateTrendIndicator(sensorId) {
        const sensor = this.sensors[sensorId];
        const history = sensor.history;
        
        if (history.length >= 10) {
            const recent = history.slice(-5);
            const older = history.slice(-10, -5);
            
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
            
            const diff = recentAvg - olderAvg;
            
            if (Math.abs(diff) < 0.5) {
                sensor.trend = { direction: 'stable', value: 'Stable' };
            } else if (diff > 0) {
                sensor.trend = { 
                    direction: 'up', 
                    value: `+${Math.abs(diff).toFixed(1)}${sensor.unit}`
                };
            } else {
                sensor.trend = { 
                    direction: 'down', 
                    value: `-${Math.abs(diff).toFixed(1)}${sensor.unit}`
                };
            }
        }
    }

    setupEventListeners() {
        document.getElementById('chartView')?.addEventListener('click', () => {
            this.switchView('chart');
        });
        
        document.getElementById('gaugeView')?.addEventListener('click', () => {
            this.switchView('gauge');
        });
        
        document.getElementById('gridView')?.addEventListener('click', () => {
            this.switchView('grid');
        });
        
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.forceRefresh();
        });
        
        document.getElementById('scenarioBtn')?.addEventListener('click', () => {
            this.showScenarioModal();
        });
        
        document.getElementById('emergencyBtn')?.addEventListener('click', () => {
            this.triggerEmergency();
        });
        
        document.getElementById('aiBtn')?.addEventListener('click', () => {
            this.runAIAnalysis();
        });
        
        document.getElementById('closeEmergency')?.addEventListener('click', () => {
            this.hideEmergencyModal();
        });
        
        document.getElementById('closeScenario')?.addEventListener('click', () => {
            this.hideScenarioModal();
        });
        
        document.getElementById('acknowledgeBtn')?.addEventListener('click', () => {
            this.acknowledgeAlert();
        });
        
        document.getElementById('silenceBtn')?.addEventListener('click', () => {
            this.silenceAlert();
        });
        
        document.querySelectorAll('.scenario-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const scenario = e.currentTarget.dataset.scenario;
                this.activateScenario(scenario);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    initializeUI() {
        this.renderAllSensors();
        this.updateSystemStatus();
        this.updateTimestamp();
    }

    renderAllSensors() {
        Object.keys(this.sensors).forEach(sensorId => {
            this.renderSensorCard(sensorId);
        });
    }

    renderSensorCard(sensorId) {
        const sensor = this.sensors[sensorId];
        
        this.updateSensorValue(sensorId, sensor.current);
        this.updateStatusBadge(sensorId, sensor.status);
        this.updateTrendDisplay(sensorId, sensor.trend);
        
        if (this.systemState.currentView === 'chart') {
            this.renderChart(sensorId);
        } else if (this.systemState.currentView === 'gauge') {
            this.renderGauge(sensorId);
        }
        
        this.updateCardStyling(sensorId, sensor.status);
    }

    updateSensorValue(sensorId, newValue) {
        const valueElement = document.getElementById(`${sensorId}-value`);
        if (!valueElement) return;
        
        const currentValue = parseFloat(valueElement.textContent) || 0;
        const difference = Math.abs(newValue - currentValue);
        
        if (difference > 0.5) {
            valueElement.style.transform = 'scale(1.1)';
            valueElement.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                valueElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        this.animateValue(valueElement, currentValue, newValue, 400);
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const change = end - start;
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (change * easeProgress);
            
            element.textContent = currentValue.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    }

    updateStatusBadge(sensorId, status) {
        const statusElement = document.getElementById(`${sensorId}-status`);
        if (!statusElement) return;
        
        const badge = statusElement.querySelector('.status-badge');
        if (!badge) return;
        
        badge.classList.remove('normal', 'warning', 'critical');
        badge.classList.add(status);
        
        const statusText = {
            normal: 'NORMAL',
            warning: 'WARNING',
            critical: 'CRITICAL'
        };
        
        badge.textContent = statusText[status] || 'NORMAL';
    }

    updateTrendDisplay(sensorId, trend) {
        const trendElement = document.getElementById(`${sensorId}-trend`);
        if (!trendElement) return;
        
        const icon = trendElement.querySelector('i');
        const text = trendElement.querySelector('span');
        
        if (!icon || !text) return;
        
        icon.className = 'fas';
        switch (trend.direction) {
            case 'up':
                icon.classList.add('fa-arrow-trend-up');
                trendElement.style.color = '#00ff88';
                break;
            case 'down':
                icon.classList.add('fa-arrow-trend-down');
                trendElement.style.color = '#ff6b35';
                break;
            default:
                icon.classList.add('fa-minus');
                trendElement.style.color = '#00d4ff';
                break;
        }
        
        text.textContent = trend.value;
    }

    renderChart(sensorId) {
        const chartContainer = document.getElementById(`${sensorId}-chart`);
        if (!chartContainer) return;
        
        const sensor = this.sensors[sensorId];
        const data = sensor.history;
        
        chartContainer.innerHTML = '';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 30');
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `gradient-${sensorId}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        const color = this.getStatusColor(sensor.status, sensor.color);
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', color);
        stop1.setAttribute('stop-opacity', '0.8');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', color);
        stop2.setAttribute('stop-opacity', '0.1');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        
        if (data.length > 1) {
            const max = Math.max(...data);
            const min = Math.min(...data);
            const range = max - min || 1;
            
            const points = data.map((value, index) => ({
                x: (index / (data.length - 1)) * 100,
                y: 25 - ((value - min) / range) * 20
            }));
            
            let pathData = `M ${points[0].x} ${points[0].y}`;
            let fillData = `M 0 30 L ${points[0].x} ${points[0].y}`;
            
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const next = points[i + 1];
                
                if (next) {
                    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
                    const cp1y = prev.y;
                    const cp2x = curr.x - (next.x - curr.x) * 0.5;
                    const cp2y = curr.y;
                    
                    pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                    fillData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                } else {
                    pathData += ` L ${curr.x} ${curr.y}`;
                    fillData += ` L ${curr.x} ${curr.y}`;
                }
            }
            
            fillData += ' L 100 30 Z';
            
            const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fillPath.setAttribute('d', fillData);
            fillPath.setAttribute('fill', `url(#gradient-${sensorId})`);
            svg.appendChild(fillPath);
            
            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linePath.setAttribute('d', pathData);
            linePath.setAttribute('stroke', color);
            linePath.setAttribute('stroke-width', '2');
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('filter', `drop-shadow(0 0 5px ${color})`);
            svg.appendChild(linePath);
            
            const lastPoint = points[points.length - 1];
            const currentPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            currentPoint.setAttribute('cx', lastPoint.x);
            currentPoint.setAttribute('cy', lastPoint.y);
            currentPoint.setAttribute('r', '2');
            currentPoint.setAttribute('fill', color);
            currentPoint.setAttribute('filter', `drop-shadow(0 0 3px ${color})`);
            svg.appendChild(currentPoint);
        }
        
        chartContainer.appendChild(svg);
    }

    renderGauge(sensorId) {
        const canvas = document.querySelector(`#${sensorId}-gauge canvas`);
        const valueElement = document.getElementById(`${sensorId}-gauge-value`);
        
        if (!canvas || !valueElement) return;
        
        const sensor = this.sensors[sensorId];
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height - 20;
        const radius = 60;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const percentage = (sensor.current - sensor.min) / (sensor.max - sensor.min);
        const angle = (percentage * Math.PI) - Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 10;
        ctx.stroke();
        
        const color = this.getStatusColor(sensor.status, sensor.color);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + (percentage * Math.PI), false);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        if (sensor.status === 'critical') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        valueElement.textContent = sensor.current.toFixed(1);
    }

    getStatusColor(status, defaultColor) {
        const statusColors = {
            normal: defaultColor,
            warning: '#ff6b35',
            critical: '#ff3b5c'
        };
        return statusColors[status] || defaultColor;
    }

    updateCardStyling(sensorId, status) {
        const card = document.querySelector(`[data-sensor="${sensorId}"]`);
        if (!card) return;
        
        card.classList.remove('warning', 'critical');
        
        if (status === 'warning' || status === 'critical') {
            card.classList.add(status);
        }
    }

    switchView(viewType) {
        this.systemState.currentView = viewType;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${viewType}View`)?.classList.add('active');
        
        if (viewType === 'chart') {
            document.querySelectorAll('.chart-container').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.gauge-container').forEach(el => el.style.display = 'none');
        } else if (viewType === 'gauge') {
            document.querySelectorAll('.chart-container').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.gauge-container').forEach(el => el.style.display = 'flex');
        }
        
        this.renderAllSensors();
    }

    forceRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.6s ease';
            
            setTimeout(() => {
                refreshBtn.style.transform = '';
                refreshBtn.style.transition = '';
            }, 600);
        }
        
        this.generateNewData();
        this.renderAllSensors();
        this.updateSystemStatus();
        this.showNotification('Data refreshed successfully', 'success');
    }

    runAIAnalysis() {
        this.showNotification('Running AI analysis...', 'info');
        
        setTimeout(() => {
            const criticalSensors = Object.values(this.sensors).filter(s => s.status === 'critical');
            const warningSensors = Object.values(this.sensors).filter(s => s.status === 'warning');
            
            let message = 'AI Analysis Complete:\n';
            if (criticalSensors.length > 0) {
                message += `🔴 ${criticalSensors.length} critical sensors detected\n`;
            }
            if (warningSensors.length > 0) {
                message += `🟡 ${warningSensors.length} warning sensors detected\n`;
            }
            if (criticalSensors.length === 0 && warningSensors.length === 0) {
                message += '✅ All systems operating normally';
            }
            
            this.showNotification(message, criticalSensors.length > 0 ? 'error' : 'success');
        }, 2000);
    }

    showScenarioModal() {
        const modal = document.getElementById('scenarioModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideScenarioModal() {
        const modal = document.getElementById('scenarioModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showEmergencyModal(message) {
        const modal = document.getElementById('emergencyModal');
        const messageElement = document.getElementById('emergencyMessage');
        
        if (modal && messageElement) {
            messageElement.textContent = message || 'Critical fire condition detected!';
            modal.classList.add('show');
            this.playAlertSound();
        }
    }

    hideEmergencyModal() {
        const modal = document.getElementById('emergencyModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    triggerEmergency() {
        const confirmed = confirm('EMERGENCY PROTOCOL\n\nActivate fire detection emergency protocol?');
        
        if (confirmed) {
            this.activateScenario('fire_simulation');
            this.showEmergencyModal('EMERGENCY PROTOCOL ACTIVATED');
        }
    }

    acknowledgeAlert() {
        this.hideEmergencyModal();
        this.showNotification('Alert acknowledged', 'success');
    }

    silenceAlert() {
        this.hideEmergencyModal();
        this.showNotification('Alert silenced', 'info');
    }

    activateScenario(scenarioKey) {
        if (this.scenarios[scenarioKey]) {
            this.systemState.scenario = scenarioKey;
            const scenario = this.scenarios[scenarioKey];
            
            this.showNotification(`Scenario activated: ${scenario.name}`, 'info');
            this.hideScenarioModal();
            
            console.log(`🎬 Activated scenario: ${scenario.name}`);
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.switchView('chart');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchView('gauge');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchView('grid');
                    break;
                case 'r':
                    e.preventDefault();
                    this.forceRefresh();
                    break;
                case 's':
                    e.preventDefault();
                    this.showScenarioModal();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.hideScenarioModal();
            this.hideEmergencyModal();
        }
    }

    handleResize() {
        this.renderAllSensors();
    }

    updateSystemStatus() {
        const stats = this.calculateSystemStats();
        
        document.getElementById('alertCount').textContent = `${stats.total} Active Alerts`;
        document.getElementById('sensorCount').textContent = `${stats.online} Sensors Online`;
        
        this.systemState.alertCount = stats.total;
        this.systemState.sensorCount = stats.online;
    }

    calculateSystemStats() {
        let critical = 0, warnings = 0, normal = 0;
        
        Object.values(this.sensors).forEach(sensor => {
            switch (sensor.status) {
                case 'critical':
                    critical++;
                    break;
                case 'warning':
                    warnings++;
                    break;
                default:
                    normal++;
            }
        });
        
        return { 
            critical, 
            warnings, 
            normal, 
            total: critical + warnings,
            online: Object.keys(this.sensors).length
        };
    }

    updateTimestamp() {
        const timeElement = document.getElementById('lastUpdate');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }

    // startRealTimeUpdates method removed - now using real MQTT data instead of fake data generation

    checkForAlerts() {
        Object.keys(this.sensors).forEach(sensorId => {
            const sensor = this.sensors[sensorId];
            
            if (sensor.status === 'critical' && this.shouldTriggerAlert(sensorId, 'critical')) {
                this.triggerCriticalAlert(sensorId);
            }
        });
    }

    shouldTriggerAlert(sensorId, level) {
        const lastAlertKey = `lastAlert_${sensorId}_${level}`;
        const lastAlert = localStorage.getItem(lastAlertKey);
        const now = Date.now();
        
        if (!lastAlert || (now - parseInt(lastAlert)) > 30000) {
            localStorage.setItem(lastAlertKey, now.toString());
            return true;
        }
        
        return false;
    }

    triggerCriticalAlert(sensorId) {
        const sensor = this.sensors[sensorId];
        const message = `CRITICAL LEVEL: ${sensor.name} ${sensor.current}${sensor.unit} (Threshold: ${sensor.thresholds.critical}${sensor.unit})`;
        
        this.showEmergencyModal(message);
        this.showNotification(`Critical alert: ${sensor.name}`, 'error');
        
        console.log(`🚨 CRITICAL ALERT: ${message}`);
    }

    createParticleEffects() {
        const container = document.querySelector('.dashboard-container');
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: fixed;
                width: 2px;
                height: 2px;
                background: rgba(0, 212, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
            `;
            
            this.animateParticle(particle);
            container.appendChild(particle);
        }
    }

    animateParticle(particle) {
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const endX = Math.random() * window.innerWidth;
        const endY = Math.random() * window.innerHeight;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        const duration = 10000 + Math.random() * 10000;
        
        particle.animate([
            { 
                left: startX + 'px', 
                top: startY + 'px', 
                opacity: 0 
            },
            { 
                left: endX + 'px', 
                top: endY + 'px', 
                opacity: 0.6 
            },
            { 
                left: (endX + Math.random() * 200 - 100) + 'px', 
                top: (endY + Math.random() * 200 - 100) + 'px', 
                opacity: 0 
            }
        ], {
            duration: duration,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
    }

    playAlertSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Alert sound not available:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1rem 1.5rem;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            max-width: 300px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        if (type === 'error') {
            notification.style.borderColor = 'rgba(255, 59, 92, 0.5)';
            notification.style.background = 'rgba(255, 59, 92, 0.1)';
        } else if (type === 'success') {
            notification.style.borderColor = 'rgba(0, 255, 136, 0.5)';
            notification.style.background = 'rgba(0, 255, 136, 0.1)';
        } else if (type === 'warning') {
            notification.style.borderColor = 'rgba(255, 107, 53, 0.5)';
            notification.style.background = 'rgba(255, 107, 53, 0.1)';
        }
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.animationFrames.forEach(frame => {
            cancelAnimationFrame(frame);
        });
        
        console.log('🔥 Dashboard destroyed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Loading Modern Fire Detection Dashboard...');
    
    window.modernFireDashboard = new ModernFireDashboard();
    
    window.AICO = {
        dashboard: window.modernFireDashboard,
        version: '3.0.0-modern',
        features: [
            'Neural Network Visualization',
            'Advanced Particle Effects',
            'Real-time AI Analysis',
            'Futuristic UI Components',
            'Advanced Animations',
            'Multi-view Support',
            'Scenario Simulation',
            'Emergency Protocols'
        ]
    };
    
    console.log('🔥 Modern Fire Detection Dashboard v3.0 Ready');
    console.log('🎨 Futuristic UI activated');
    console.log('🧠 AI analysis ready');
    
    // Check for pending MQTT data and apply it
    if (window.pendingMQTTData) {
        console.log('📡 Applying pending MQTT sensor data to dashboard...');
        
        // Use the MQTT client's update method if available
        if (window.mqttClient && typeof window.mqttClient.updateDashboardSensors === 'function') {
            window.mqttClient.updateDashboardSensors(window.pendingMQTTData);
        } else {
            // Fallback: directly update the dashboard
            Object.keys(window.pendingMQTTData).forEach(sensorId => {
                const value = window.pendingMQTTData[sensorId];
                if (window.modernFireDashboard.sensors[sensorId]) {
                    window.modernFireDashboard.sensors[sensorId].current = parseFloat(value.toFixed(2));
                    window.modernFireDashboard.updateSensorValue(sensorId, value);
                    window.modernFireDashboard.updateSensorStatus(sensorId);
                    window.modernFireDashboard.updateTrendIndicator(sensorId);
                }
            });
        }
        
        // Clear pending data
        delete window.pendingMQTTData;
        console.log('✅ Pending MQTT data applied to dashboard!');
    }
});