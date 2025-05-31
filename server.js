const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose'); // Import Mongoose
const User = require('./models/User'); // Import the User model

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// --- MongoDB Connection ---
const mongoURI = 'mongodb://localhost:27017/realtime_chat'; // For local MongoDB
// OR for MongoDB Atlas:
// const mongoURI = 'mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/realtime_chat?retryWrites=true&w=majority';
// Remember to replace <username> and <password> if using Atlas!

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware to parse JSON bodies
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- User Registration Endpoint ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ username, password });
        await user.save(); // The pre-save hook in User.js will hash the password

        res.status(201).json({ success: true, message: 'User registered successfully!' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});


// --- User Login Endpoint ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password); // Use the method from User model
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // In a real app, you'd generate a JWT (JSON Web Token) here and send it to the client
        // For simplicity, we'll just send success and the username
        res.json({ success: true, message: 'Login successful!', username: user.username });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- Socket.IO Real-time Logic (remains mostly the same) ---
// In a real app, you might pass a JWT to the Socket.IO connection for authentication
// For this example, we'll assume the user is authenticated if they reached chat.html
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg.text + ' from ' + msg.username);
        io.emit('chat message', {
            username: msg.username,
            text: msg.text,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the login/registration page.`);
});