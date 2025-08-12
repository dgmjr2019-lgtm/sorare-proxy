const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function fetchPlayerData(slug) {
  const query = `
    query PlayerPriceHistory($slug: String!) {
      player(slug: $slug) {
        displayName
        cards(first: 1) {
          nodes {
            priceChart(period: THIRTY_DAYS) {
              date
              avgPrice
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.sorare.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { slug } }),
  });

  if (!response.ok) {
    throw new Error(`Sorare API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Main POST endpoint
app.post('/player', async (req, res) => {
  const { slug } = req.body;
  try {
    const data = await fetchPlayerData(slug);
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test GET endpoint with example slugs
app.get('/test/:slug', async (req, res) => {
  try {
    const data = await fetchPlayerData(req.params.slug);
    res.json(data);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Render requires listening on the provided PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
