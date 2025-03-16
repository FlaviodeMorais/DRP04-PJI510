import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import cron from 'node-cron';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // ✅ Agora servindo arquivos diretamente da raiz
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(cors());

// Servir `index.html` corretamente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SQLite database connection
let db;

// Initialize database
async function initializeDatabase() {
    try {
        // Verifica se o banco de dados existe, senão cria um arquivo vazio
        if (!fs.existsSync('aquaponia.db')) {
            fs.writeFileSync('aquaponia.db', '');
            console.log('📁 Banco de dados criado: aquaponia.db');
        }

        db = await open({
            filename: 'aquaponia.db',
            driver: sqlite3.Database
        });

        console.log('🔄 Conectado ao banco de dados');

        // Criar tabelas caso não existam
        await db.exec(`
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temperature REAL NOT NULL,
                level REAL NOT NULL,
                pump_status INTEGER DEFAULT 0,
                heater_status INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS setpoints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temp_min REAL DEFAULT 20.0 NOT NULL,
                temp_max REAL DEFAULT 30.0 NOT NULL,
                level_min INTEGER DEFAULT 60 NOT NULL,
                level_max INTEGER DEFAULT 90 NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
        `);

        console.log('✅ Tabelas criadas com sucesso');

        // Verificar e inserir valores padrão na tabela `setpoints`
        await db.run(`
            INSERT INTO setpoints (id, temp_min, temp_max, level_min, level_max, updated_at)
            SELECT 1, 20.0, 30.0, 60, 90, CURRENT_TIMESTAMP
            WHERE NOT EXISTS (SELECT 1 FROM setpoints WHERE id = 1);
        `);

        console.log('✅ Banco de dados inicializado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao inicializar o banco de dados:', error);
        throw error;
    }
} // <-- Adicionamos esse fechamento que estava ausente

// ThingSpeak configuration
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY;
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY;
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

async function fetchThingSpeakData(retries = 3) {
    const timeout = 5000; // Timeout de 5 segundos

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📡 Buscando dados do ThingSpeak (tentativa ${attempt}/${retries})...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(
                `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINGSPEAK_READ_API_KEY}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Erro HTTP! Código: ${response.status}`);
            }

            const text = await response.text(); // Pegamos como texto primeiro
            console.log('📩 Resposta bruta do ThingSpeak:', text);

            let data;
            try {
                data = JSON.parse(text); // Converte para JSON
            } catch (e) {
                console.error('❌ Erro ao converter JSON:', e);
                throw new Error('Resposta inválida do ThingSpeak');
            }

            if (!data) {
                console.log('⚠️ Nenhum dado recebido do ThingSpeak');
                return getDefaultReading();
            }

            console.log(`📊 Dados originais do ThingSpeak:`, data);

            // ** Correção: Normalizar valores antes de salvar **
            function parseNumber(value) {
                if (typeof value === 'string') {
                    return parseFloat(value.replace(",", ".")); // Substitui vírgula por ponto
                }
                return parseFloat(value) || 0.0;
            }

            const reading = {
                temperature: parseNumber(data.campo1), // Corrigindo temperatura
                level: parseNumber(data.campo2),      // Corrigindo nível de água
                pump_status: parseInt(data.campo3) || 0,
                heater_status: parseInt(data.campo4) || 0,
                timestamp: new Date(data.criado_em || new Date()) // Timestamp correto
            };

            console.log('✅ Dados formatados antes de salvar:', reading);
            return reading;

        } catch (error) {
            console.error(`❌ Tentativa ${attempt} falhou:`, error);
            if (attempt === retries) {
                console.log('⚠️ Todas as tentativas falharam. Usando valores padrão.');
                return getDefaultReading();
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Get default reading when ThingSpeak fails
function getDefaultReading() {
    return {
        temperature: 25.0,
        level: 75.0,
        pump_status: 0,
        heater_status: 0,
        timestamp: new Date()
    };
}

// Save reading to database
async function saveReading(reading) {
    if (!reading) return null;

    try {
        console.log('Saving reading to database:', reading);
        const result = await db.run(
            `INSERT INTO readings (
                temperature, 
                level, 
                pump_status, 
                heater_status, 
                timestamp
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                reading.temperature,
                reading.level,
                reading.pump_status,
                reading.heater_status,
                reading.timestamp
            ]
        );

        console.log('Reading saved successfully');
        return result;
    } catch (error) {
        console.error('Error saving reading:', error);
        return null;
    }
}

// Schedule data collection every 5 seconds
cron.schedule('*/5 * * * * *', async () => {
    try {
        console.log('Starting scheduled data collection...');
        const reading = await fetchThingSpeakData();
        if (reading) {
            await saveReading(reading);
            console.log('Data collection cycle completed successfully');
        } else {
            console.log('No data collected in this cycle');
        }
    } catch (error) {
        console.error('Error in data collection cycle:', error);
    }
});

// API Routes
app.get('/api/temperature/latest', async (req, res) => {
    try {
        const [readings, setpoints] = await Promise.all([
            db.all(
                `SELECT * FROM readings 
                 WHERE temperature IS NOT NULL OR level IS NOT NULL
                 ORDER BY timestamp DESC 
                 LIMIT 60`
            ),
            db.get('SELECT * FROM setpoints WHERE id = 1')
        ]);

        // Ensure we have at least one reading
        if (readings.length === 0) {
            const defaultReading = await fetchThingSpeakData();
            if (defaultReading) {
                readings.push(defaultReading);
            }
        }

        console.log(`Returning ${readings.length} latest readings`);
        res.json({
            readings: readings.reverse(),
            setpoints: {
                temp: {
                    min: setpoints.temp_min,
                    max: setpoints.temp_max
                },
                level: {
                    min: setpoints.level_min,
                    max: setpoints.level_max
                }
            }
        });
    } catch (error) {
        console.error('Error fetching latest readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/temperature', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`Fetching readings from ${startDate} to ${endDate}`);
        
        const [readings, setpoints] = await Promise.all([
            db.all(
                `SELECT * FROM readings 
                 WHERE timestamp BETWEEN datetime(?) AND datetime(?)
                 AND (temperature IS NOT NULL OR level IS NOT NULL)
                 ORDER BY timestamp ASC`,
                [startDate, endDate]
            ),
            db.get('SELECT * FROM setpoints WHERE id = 1')
        ]);

        // If no readings found, get at least one current reading
        if (readings.length === 0) {
            const currentReading = await fetchThingSpeakData();
            if (currentReading) {
                readings.push(currentReading);
            }
        }
        
        console.log(`Found ${readings.length} readings in date range`);
        res.json({
            readings,
            setpoints: {
                temp: {
                    min: setpoints.temp_min,
                    max: setpoints.temp_max
                },
                level: {
                    min: setpoints.level_min,
                    max: setpoints.level_max
                }
            }
        });
    } catch (error) {
        console.error('Error fetching readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();