import express from 'express';
import morgan from 'morgan';
import userRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import documentsRoutes from './routes/documents.routes.js';


const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(userRoutes);
app.use(postsRoutes);
app.use(documentsRoutes);

export default app;