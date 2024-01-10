import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
    pdfName: String,
    userId: String,
});

export const pdfModel = mongoose.model('pdfModel', pdfSchema)