import * as postsModel from '../models/posts.models.js';

/**
 * CORRECCIÓN 1: El controlador aceptaba "status" en el destructuring del body
 * pero luego lo ignoraba (el modelo fuerza 'pending_approval'). Esto generaba
 * confusión: el cliente podía creer que enviando status='published' lo publicaba.
 * Se eliminó "status" del destructuring para ser explícitos con la intención.
 */
export const createPost = async (req, res) => {
  const body = req.body || {};
  const { title, content, user_id, category_id, author_id } = body;

  if (!title || !content || !user_id || !category_id || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' });
  }

  try {
    const post = await postsModel.createPost({ title, content, user_id, category_id, author_id });
    return res.status(201).json({ ok: true, post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al crear el post' });
  }
};

/**
 * CORRECCIÓN 2: updatePost permitía actualizar el campo "status" libremente
 * (p.ej. cambiar a 'published' sin pasar por ningún flujo de aprobación).
 * Si existe un flujo de moderación, el cambio de status debe ir por una ruta
 * dedicada con permisos específicos. Se filtra "status" del body aquí para
 * proteger la integridad del flujo editorial.
 *
 * Si se quiere aprobar un post, debe usarse una ruta/controlador dedicado
 * (p.ej. PATCH /posts/:id/approve) con middleware de roles.
 */
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const rawData = req.body;

  if (!rawData || Object.keys(rawData).length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'Debe enviar al menos un campo para actualizar',
    });
  }

  // Excluir "status" para proteger el flujo de aprobación
  const { status: _ignored, ...dataToUpdate } = rawData;

  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'No se puede actualizar solo el status desde esta ruta',
    });
  }

  try {
    const post = await postsModel.updatePost(id, dataToUpdate);

    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post no encontrado' });
    }

    return res.status(200).json({ ok: true, message: 'Post actualizado con éxito', post });
  } catch (error) {
    console.error('Error en updatePost:', error);
    return res.status(500).json({ ok: false, error: 'Error al actualizar el post' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await postsModel.getAllPosts();
    return res.status(200).json({ ok: true, posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener posts' });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postsModel.getPostById(id);
    if (!post) return res.status(404).json({ ok: false, error: 'Post no encontrado' });
    return res.status(200).json({ ok: true, post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener el post' });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postsModel.deletePost(id);
    if (!post) return res.status(404).json({ ok: false, error: 'Post no encontrado' });
    return res.status(200).json({ ok: true, message: 'Post eliminado', post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al eliminar el post' });
  }
};
