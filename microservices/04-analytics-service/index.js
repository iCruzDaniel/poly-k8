const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Node.js Analytics' }));

app.get('/metrics', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        metrics: {
            active_pods: 5,
            requests_processed: Math.floor(Math.random() * 1000),
            cluster_status: "HEALTHY"
        }
    });
});

app.listen(PORT, () => console.log(`Analytics Service corriendo en puerto ${PORT}`));
