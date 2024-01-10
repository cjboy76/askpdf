import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
    textContent: {
        type: String,
        required: true
    },
    page: {
        type: String,
        required: true,
    },
    // userId: {
    //     type: String,
    //     required: true
    // }
});

export const DocumentModel = mongoose.model('DocumentModel', docSchema)