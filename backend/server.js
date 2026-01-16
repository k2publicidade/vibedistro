require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/catalog', require('./src/routes/catalog.routes'));
app.use('/api/distribution', require('./src/routes/distribution.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));

app.get('/', (req, res) => {
    res.send('VibeDistro Backend API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
