const express = require('express');
const app = express();
require('dotenv').config();

// const mqtt = require('mqtt');

// const options = {
//   // TTN V3 MQTT broker address
//   host: process.env.TTN_HOST || 'eu1.cloud.thethings.network',
//   port: 1883,  // Unsecure port
//   protocol: 'mqtt', // Unsecure protocol

//   // Your credentials
//   username: "esp32lorawanboei@ttn",
//   password: process.env.TTN_APIKEY,
// };
// // Connect to TTN MQTT broker
// const client = mqtt.connect(options);

// client.on('connect', () => {
//   console.log('Connected to TTN MQTT');

//   const uplinkTopic = 'v3/+/devices/+/up';
//   client.subscribe(uplinkTopic, (err) => {
//     if (err) {
//       console.error('Subscription error:', err);
//     } else {
//       console.log('Subscribed to device uplink topic');
//     }
//   });
// });

// client.on('message', (topic, message) => {
//   try {
//     const payload = JSON.parse(message.toString());
//     const deviceId = payload.end_device_ids.device_id;
//     const receivedAt = payload.received_at;
//     const fPort = payload.uplink_message.f_port;
//     const data = payload.uplink_message.frm_payload;
//     const decodedPayload = payload.uplink_message.decoded_payload;

//     latestData = {
//       deviceId,
//       receivedAt,
//       fPort,
//       data,
//       decodedPayload,
//     };

//     console.log('New data received:', latestData);
//   } catch (error) {
//     console.error('Error processing message:', error);
//   }
// });



// app.get('/lang/:lang', (req, res) => {
//   const lang = req.params.lang;
//   i18n.setLocale(lang);
//   res.render('index', { title: 'Home' });
// });

// Routes
app.get('/', (req, res) => {
  const title = 'Home';


  // Render the index.ejs view with the title
  res.render('index', { title });
});

// Express route to fetch the latest data
app.get('/data', (req, res) => {
  if (latestData) {
    res.json(latestData);
  } else {
    res.status(404).json({ error: 'No data available yet.' });
  }
});

// Add a new endpoint for OpenAI API requests
app.post('/callOpenAI', async (req, res) => {
  try {
    const { prompt, context } = req.body; // Expecting prompt and context in the request body
    const Sleutel = "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"; // Use the API key from the environment variable

    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Sleutel}`
    };
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: context },
        { role: "user", content: prompt }
      ]
    };


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
    res.status(500).json({ error: "Error calling OpenAI API" }, {errorMessage : error.message}, {input : prompt.text});
  }
});

// Start server
const port = 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
