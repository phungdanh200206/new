const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

mongoose.connect('mongodb://127.0.0.1:27017/nguyen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    location: {
        lat: Number,
        lng: Number
    }
});

const User = mongoose.model('User', userSchema);

// Sign Up
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({ name, email, password });
    await user.save();
    res.json({ message: 'User registered successfully' });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user });
});

// Update user location
app.post('/location', async (req, res) => {
    const { email, lat, lng } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    user.location = { lat, lng };
    await user.save();
    res.json({ message: 'Location updated', user });
});

// Get all users' locations
app.get('/locations', async (req, res) => {
    const users = await User.find({}, { name: 1, email: 1, location: 1, _id: 0 });
    res.json(users);
});

// Get all users (for testing)
app.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
