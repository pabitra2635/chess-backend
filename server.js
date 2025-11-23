const express = require('express');
const cors = require('cors');

// --- CRITICAL FIX: Polyfill for Node.js ---
// This prevents the "postMessage is not defined" crash
if (typeof global.postMessage === 'undefined') {
    global.postMessage = (message) => {
        // This handles internal engine logs silently
    };
}
// ------------------------------------------

// MUST match the name in package.json ('stockfish.js')
const stockfish = require('stockfish.js');

const app = express();
app.use(cors());
app.use(express.json());

// Difficulty Mapping
const LEVEL_DEPTHS = {
    5: 8,
    6: 10,
    7: 12,
    8: 15
};

app.get('/', (req, res) => {
    res.send('Falconix Chess Server is Live! ♟️');
});

app.post('/api/move', (req, res) => {
    const { fen, level } = req.body;

    if (!fen || !level) {
        return res.status(400).json({ error: 'Missing FEN or Level' });
    }

    const depth = LEVEL_DEPTHS[level] || 5;

    try {
        // Initialize engine
        const engine = stockfish();
        let bestMoveFound = false;

        // Listen for messages
        engine.onmessage = function(line) {
            if (bestMoveFound) return;

            // Output format check: "bestmove e2e4 ponder e7e5"
            if (typeof line === 'string' && line.startsWith('bestmove')) {
                bestMoveFound = true;
                const parts = line.split(' ');
                const bestMove = parts[1];
                
                res.json({ move: bestMove });
                
                // Quit engine to save RAM
                engine.postMessage('quit');
            }
        };

        // Send commands
        engine.postMessage('uci');
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${depth}`);

    } catch (error) {
        console.error("Engine Error:", error);
        res.status(500).json({ error: "AI Engine Failed to Start" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
