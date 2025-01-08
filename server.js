require('dotenv').config();
const express = require('express');
const app = express();
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const i18n = require('i18n');

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

console.log(process.env.OPENAI_API_KEY); // outputs "localhost"

// WebSocket connections
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Als dit de eerste client is, start de updates
  if (clients.size === 1) {
    startBoeiDataUpdates();
  }

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);

    // Als er geen clients meer zijn, stop de updates
    if (clients.size === 0 && updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  });
});

// Function to send data to all connected WebSocket clients
function broadcastToClients(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error sending to client:", error);
      }
    }
  });
}

app.use(express.json());


app.get('/lang/:lang', (req, res) => {
  const lang = req.params.lang;
  i18n.setLocale(lang);
  res.render('index', { title: 'Home' });
});

// Routes
app.get('/', (req, res) => {
  const title = 'Home';

  // Render the index.ejs view with the title
  res.render('index', { title });
});

app.get('/api/getDashboard', (req, res) => {
  const title = 'Dashboard';


});

app.get('/api/getBoeiData', (req, res) => {
  // Start de live data updates
  startBoeiDataUpdates();
  res.json({ message: "Started live boei data updates" });
});

// Functie om data van de boei API op te halen
async function fetchBoeiData() {
  try {
    const response = await fetch('https://jouw-boei-api-endpoint.com/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching boei data:", error);
    return null;
  }
}

let updateInterval = null;

// Functie om de live updates te starten
function startBoeiDataUpdates() {
  // Als er al een interval loopt, niet nog een starten
  if (updateInterval) {
    return;
  }

  // Direct eerste data ophalen en versturen
  fetchAndBroadcastData();

  // Start interval voor periodieke updates
  updateInterval = setInterval(fetchAndBroadcastData, 1000); // Elke seconde
}

// Functie om data op te halen en te versturen
async function fetchAndBroadcastData() {
  const boeiData = await fetchBoeiData();
  if (boeiData) {
    broadcastToClients(boeiData);
  }
}

// Add a new endpoint for OpenAI API requests
app.post('/api/callOpenAI', async (req, res) => {
  const { prompt, context } = req.body; // Expecting prompt and context in the request body
  const OpenAIapiKey = "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"

  console.log("Called openai api")

  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OpenAIapiKey}`
  };
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: context },
      { role: "user", content: prompt }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data.choices[0].message.content); // Send the AI response back to the client
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error calling OpenAI API" });
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
