import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    sub: String,
    picture: String,
    locale: String
});

export const User = mongoose.model('User', userSchema)