const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { initDatabase, saveHistory, getHistory } = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve input JSON files
app.use('/input', express.static(path.join(__dirname, 'input')));

// Serve output folder (for history.json)
//app.use('/output', express.static(path.join(__dirname, 'output')));

// API to save history data
app.post('/save-history', async (req, res) => {
  try {
    const id = await saveHistory(req.body);
    console.log('History successfully saved to database with ID:', id);
    res.status(200).send('Saved');
  } catch (err) {
    console.error('Error saving to database:', err);
    res.status(500).send('Failed to save to database');
  }
});

// API to get history data
app.get('/history', async (req, res) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).send('Failed to get history');
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
