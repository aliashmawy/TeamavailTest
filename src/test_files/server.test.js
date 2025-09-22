const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock database functions
jest.mock('../database', () => ({
  initDatabase: jest.fn().mockResolvedValue(),
  saveHistory: jest.fn(),
  getHistory: jest.fn(),
}));

describe('Server Tests', () => {
  let app;

  beforeAll(() => {
    // Create a test app without starting the server
    app = express();
    const bodyParser = require('body-parser');
    const { saveHistory, getHistory } = require('../database');

    // Middleware
    app.use(bodyParser.json());

    // Serve static frontend
    app.use(express.static(path.join(__dirname, '../public')));

    // Serve input JSON files
    app.use('/input', express.static(path.join(__dirname, '../input')));

    // Serve output folder (for history.json)
    app.use('/output', express.static(path.join(__dirname, '../output')));

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /save-history', () => {
    it('should save history data successfully', async () => {
      const mockData = { test: 'data' };
      const { saveHistory } = require('../database');
      saveHistory.mockResolvedValue(1);

      const response = await request(app)
        .post('/save-history')
        .send(mockData)
        .expect(200);

      expect(response.text).toBe('Saved');
      expect(saveHistory).toHaveBeenCalledWith(mockData);
    });

    it('should handle database errors', async () => {
      const mockData = { test: 'data' };
      const { saveHistory } = require('../database');
      saveHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/save-history')
        .send(mockData)
        .expect(500);

      expect(response.text).toBe('Failed to save to database');
    });
  });

  describe('GET /history', () => {
    it('should get history data successfully', async () => {
      const mockHistory = [
        { id: 1, data: { test: 'data1' }, created_at: '2023-01-01' },
        { id: 2, data: { test: 'data2' }, created_at: '2023-01-02' },
      ];
      const { getHistory } = require('../database');
      getHistory.mockResolvedValue(mockHistory);

      const response = await request(app).get('/history').expect(200);

      expect(response.body).toEqual(mockHistory);
      expect(getHistory).toHaveBeenCalled();
    });

    it('should handle database errors when getting history', async () => {
      const { getHistory } = require('../database');
      getHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/history').expect(500);

      expect(response.text).toBe('Failed to get history');
    });
  });

  describe('Basic server functionality', () => {
    it('should have the app configured correctly', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });
  });
});
