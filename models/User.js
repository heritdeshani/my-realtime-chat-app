const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensure usernames are unique
        trim: true
    },
    password: {
        type: String,
        required: true
    }
    // You can add more fields here like email, joinDate, etc.
    // email: { type: String, unique: true, sparse: true }, // sparse allows null values to not trigger unique constraint
    // createdAt: { type: Date, default: Date.now }
});

// --- Mongoose Middleware for Password Hashing ---
// This runs BEFORE a user document is saved
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10); // Generate a salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next();
    } catch (error) {
        next(error); // Pass error to next middleware
    }
});

// --- Method to Compare Passwords ---
// This method will be available on user documents
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);