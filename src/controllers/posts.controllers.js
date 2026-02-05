import * as postsModel from '../models/posts.models.js'

export const createPost = async (req, res) => {
  const body = req.body || {}
  // Nota: Quitamos 'status' de aquí porque el modelo ahora lo pone automático
  const { title, content, user_id, category_id, author_id } = body
  
  if (!title || !content || !user_id || !category_id || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    // El modelo se encarga de poner "pending_approval" y la fecha
    const post = await postsModel.createPost({ title, content, user_id, category_id, author_id })
    return res.status(201).json({ ok: true, post })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el post' })
  }
}

// --- ESTA ES LA FUNCIÓN QUE FALTABA ---
export const updatePost = async (req, res) => {
  const { id } = req.params
  const { title, content, category_id } = req.body

  try {
    const post = await postsModel.updatePost(id, { title, content, category_id })
    
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post no encontrado para editar' })
    }

    return res.status(200).json({ ok: true, message: 'Post actualizado con éxito', post })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al actualizar el post' })
  }
}

export const getPosts = async (req, res) => {
  try {
    const posts = await postsModel.getAllPosts()
    return res.status(200).json({ ok: true, posts })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener posts' })
  }
}

export const getPostById = async (req, res) => {
  const { id } = req.params
  try {
    const post = await postsModel.getPostById(id)
    if (!post) return res.status(404).json({ ok: false, error: 'Post no encontrado' })
    return res.status(200).json({ ok: true, post })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el post' })
  }
}

export const deletePost = async (req, res) => {
  const { id } = req.params
  try {
    const post = await postsModel.deletePost(id)
    if (!post) return res.status(404).json({ ok: false, error: 'Post no encontrado' })
    return res.status(200).json({ ok: true, message: 'Post eliminado', post })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el post' })
  }
}