import express from 'express';
import morgan from 'morgan';

const app = express();
const port = Number(process.env.PORT);

app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on port ${port}`);
});
