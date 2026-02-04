import * as postsModel from '../models/posts.models.js'

export const createPost = async (req, res) => {
  const body = req.body || {}
  const { title, content, status, user_id, category_id, author_id } = body
  if (!title || !content || !user_id || !category_id || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    const post = await postsModel.createPost({ title, content, status, user_id, category_id, author_id })
    return res.status(201).json({ ok: true, post })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el post' })
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
