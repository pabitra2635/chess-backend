const express = require('express');
const cors = require('cors');
const stockfish = require('stockfish');

const app = express();
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json());

// Map levels to Stockfish Depths (How many moves ahead it thinks)
const LEVEL_DEPTHS = {
    5: 8,   // Master Candidate (Fast but strong)
    6: 10,  // Grandmaster (Very strong)
    7: 12,  // Legendary (Crushing)
    8: 15   // FALCONIX GOD MODE (Maximum feasible for free tier)
};

app.get('/', (req, res) => {
    res.send('Falconix Chess Server is Running! ♟️');
});

app.post('/api/move', (req, res) => {
    const { fen, level } = req.body;

    if (!fen || !level) {
        return res.status(400).json({ error: 'Missing FEN or Level' });
    }

    const depth = LEVEL_DEPTHS[level] || 5;
    
    // Initialize a new engine instance for this request
    const engine = stockfish();
    let bestMoveFound = false;

    // Listen for the engine's response
    engine.onmessage = function(line) {
        if (bestMoveFound) return;

        // Stockfish returns "bestmove e2e4 ponder e7e5"
        if (line.startsWith('bestmove')) {
            bestMoveFound = true;
            const bestMove = line.split(' ')[1];
            
            res.json({ move: bestMove });
            
            // Kill this engine instance to save memory
            engine.postMessage('quit');
        }
    };

    // Send commands to Stockfish
    engine.postMessage('uci');
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
