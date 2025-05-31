document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is logged in
    const username = localStorage.getItem('loggedInUsername');
    if (!username) {
        // If not logged in, redirect to the login page
        window.location.href = '/';
        return;
    }

    // Display logged-in username
    document.getElementById('user-info').textContent = `Logged in as: ${username}`;

    // Initialize Socket.IO connection
    const socket = io(); // Connects to the server where this script is served from

    const messages = document.getElementById('messages');
    const form = document.getElementById('form');
    const input = document.getElementById('input');

    // Handle form submission (sending messages)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            // Emit a 'chat message' event to the server
            socket.emit('chat message', {
                username: username, // Send the logged-in username
                text: input.value
            });
            input.value = ''; // Clear input field
        }
    });

    // Listen for 'chat message' events from the server
    socket.on('chat message', (msg) => {
        const item = document.createElement('li');
        item.textContent = `${msg.username} (${msg.timestamp}): ${msg.text}`;
        
        // Add class for styling (e.g., messages from current user vs others)
        if (msg.username === username) {
            item.classList.add('sent');
        } else {
            item.classList.add('received');
        }
        
        messages.appendChild(item);
        // Scroll to the bottom
        messages.scrollTop = messages.scrollHeight;
    });

    // Optional: Listen for connect/disconnect events for debugging
    socket.on('connect', () => {
        const item = document.createElement('li');
        item.classList.add('system');
        item.textContent = `You joined the chat.`;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    socket.on('disconnect', () => {
        const item = document.createElement('li');
        item.classList.add('system');
        item.textContent = `You disconnected from the chat.`;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });
});