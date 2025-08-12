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
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'sorare-proxy/1.0',
      // Uncomment if you have an API key
      // 'apikey': process.env.SORARE_API_KEY
    },
    body: JSON.stringify({ query, variables: { slug } }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Sorare API error: ${response.status} ${response.statusText}\n${errorText}`);
    throw new Error(`Sorare API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

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

app.get('/test/:slug', async (req, res) => {
  try {
    const data = await fetchPlayerData(req.params.slug);
    res.json(data);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
