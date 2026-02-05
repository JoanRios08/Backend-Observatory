import express from 'express';
import morgan from 'morgan';
import userRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import authorsRoutes from './routes/authors.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// Manejo amigable de errores de JSON inválido en el cuerpo
app.use((err, req, res, next) => {
	if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
		return res.status(400).json({ ok: false, error: 'JSON inválido en el cuerpo de la petición' })
	}
	return next(err)
})
app.use(userRoutes);
app.use(postsRoutes);
app.use(documentsRoutes);
app.use(projectsRoutes);
app.use(authorsRoutes);
app.use(dashboardRoutes);

export default app;