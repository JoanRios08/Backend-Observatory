import express from 'express';
import morgan from 'morgan';
import cors from 'cors'; // 1. Importar cors
import userRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import authorsRoutes from './routes/authors.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// 2. Configuración de CORS
const whiteList = [
    'https://69854eaa7b59a6000863d342--serene-douhua-3515f7.netlify.app/#/login',
    'http://localhost:3000',
    'http://localhost:5173' // Común si usas Vite
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o curl) o si están en la whitelist
        if (!origin || whiteList.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Necesario si manejas cookies o sesiones
};

app.use(cors(corsOptions)); // 3. Aplicar antes de las rutas
app.use(morgan('dev'));
app.use(express.json());

// Manejo amigable de errores de JSON inválido
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