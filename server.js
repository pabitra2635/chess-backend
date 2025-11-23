const express = require('express');
const cors = require('cors');
// CHANGED: We now require 'stockfish.js' instead of 'stockfish'
const stockfish = require('stockfish.js');

const app = express();
app.use(cors()); 
app.use(express.json());

const LEVEL_DEPTHS = {
    5: 8,   
    6: 10,  
    7: 12,  
    8: 15   
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
    
    // CHANGED: stockfish.js is initialized strictly as a function
    const engine = stockfish();
    let bestMoveFound = false;

    engine.onmessage = function(line) {
        if (bestMoveFound) return;

        // Log for debugging on Render Dashboard
        console.log(`Engine: ${line}`);

        if (line.startsWith('bestmove')) {
            bestMoveFound = true;
            const bestMove = line.split(' ')[1];
            res.json({ move: bestMove });
            engine.postMessage('quit');
        }
    };

    // Send commands
    engine.postMessage('uci');
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
