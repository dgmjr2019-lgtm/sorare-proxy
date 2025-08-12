const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/player', async (req, res) => {
  const { slug } = req.body;

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
  console.error('Sorare API error:', response.status, response.statusText);
  return res.status(response.status).json({ error: 'Sorare API error' });
}

const data = await response.json();

 
