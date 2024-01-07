import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
    textContent: {
        type: String,
        required: true
    },
    page: {
        type: String,
        required: true,
    }
});

export const useDocModel = (collection = 'document') => mongoose.model('Document', docSchema, collection);