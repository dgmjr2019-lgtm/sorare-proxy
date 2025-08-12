const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function fetchFromSorare(query, variables) {
  const response = await fetch('https://api.sorare.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'sorare-proxy/1.0',
      'apikey': process.env.SORARE_API_KEY
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Sorare API error: ${response.status} ${response.statusText}\n${errorText}`);
    const error = new Error(`Sorare API error: ${response.status}`);
    error.status = response.status;
    error.text = errorText;
    throw error;
  }

  return response.json();
}

async function fetchPlayerData(slug) {
  const fullQuery = `
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

  const fallbackQuery = `
    query PlayerBasic($slug: String!) {
      player(slug: $slug) {
        displayName
      }
    }
  `;

  try {
    // Try full query first
    return await fetchFromSorare(fullQuery, { slug });
  } catch (error) {
    if (error.status === 422) {
      // If 422, try fallback simpler query
      console.log(`Falling back to simpler query for slug: ${slug}`);
      return await fetchFromSorare(fallbackQuery, { slug });
    }
    // Rethrow other errors
    throw error;
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Sorare Proxy API is running. Use /test/:slug to query player data.');
});

// POST /player endpoint
app.post('/player', async (req, res) => {
  const { slug } = req.body;
  try {
    const data = await fetchPlayerData(slug);
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /test/:slug endpoint
app.get('/test/:slug', async (req, res) => {
  try {
    const data = await fetchPlayerData(req.params.slug);
    res.json(data);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
