import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-svc:8080';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-svc:8080';
const PROCESSOR_URL = process.env.PROCESSOR_SERVICE_URL || 'http://processor-svc:8080';

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', gateway: 'TypeScript Express' }));

app.get('/api/auth/validate', async (req, res) => {
    try {
        const response = await axios.get(`${AUTH_URL}/validate`);
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Auth service unreachable', details: err.message });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        const response = await axios.get(`${ANALYTICS_URL}/metrics`);
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Analytics service unreachable', details: err.message });
    }
});

app.get('/api/process', async (req, res) => {
    try {
        const response = await axios.post(`${PROCESSOR_URL}/process`, { payload: "k8s-mesh-data" });
        res.json({ gateway: 'API Gateway', upstream: response.data });
    } catch (err: any) {
        res.status(500).json({ error: 'Processor service unreachable', details: err.message });
    }
});

app.listen(PORT, () => console.log(`API Gateway escuchando en puerto ${PORT}`));
