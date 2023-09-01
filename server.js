import express from 'express';
import router from './routes/index';
const app = express();

app.listen(process.env('PORT') || 5000);

app.use('/status', router);
app.use('/stats', router);
