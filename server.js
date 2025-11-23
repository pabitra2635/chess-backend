import express from 'express';
import cors from 'cors';
import Stockfish from 'stockfish';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Map levels to Depth
const LEVEL_DEPTHS = {
    5: 8,
    6: 10,
    7: 12,
    8: 15
};

app.get('/', (req, res) => {
    res.send('Falconix Chess Server is Running! ♟️');
});

app.post('/api/move', async (req, res) => {
    const { fen, level } = req.body;

    if (!fen || !level) {
        return res.status(400).json({ error: 'Missing FEN or Level' });
    }

    const depth = LEVEL_DEPTHS[level] || 5;

    // Initialize Stockfish
    // The 'stockfish' package v16+ returns a factory function that returns a promise
    try {
        const engine = await Stockfish(); 
        let bestMoveFound = false;

        // Set up listener
        engine.addMessageListener((line) => {
            if (bestMoveFound) return;

            if (line.startsWith('bestmove')) {
                bestMoveFound = true;
                const parts = line.split(' ');
                const bestMove = parts[1];
                
                res.json({ move: bestMove });
                engine.quit(); // Important to kill the process
            }
        });

        // Send commands
        engine.postMessage('uci');
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${depth}`);

    } catch (err) {
        console.error("Stockfish Init Error:", err);
        res.status(500).json({ error: "Engine failed to start" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
