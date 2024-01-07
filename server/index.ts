import mongoose from 'mongoose';

export default async () => {
    const mongoDbUri = useRuntimeConfig().mongoUri;
    try {
        await mongoose.connect(mongoDbUri);
        console.log('DB connection established');
    } catch (err) {
        console.error('DB connection failed', err);
    }
};