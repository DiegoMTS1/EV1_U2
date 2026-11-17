const API_URL = import.meta.env.VITE_API_URL

export async function obtenerPublicaciones() {
  const respuesta = await fetch(`${API_URL}/posts`)
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudieron cargar las publicaciones')
  }

  return datos.posts
}

export async function crearPublicacion(
  { title, content, authorName },
  token,
) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const respuesta = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, content, authorName }),
  })
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudo crear la publicación')
  }

  return datos.post
}

export async function obtenerReaccionesPublicacion(postId) {
  const respuesta = await fetch(`${API_URL}/posts/${postId}/reactions`)
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudieron cargar las reacciones')
  }

  return datos
}

export async function crearReaccionPublicacion(postId, { type, userId }) {
  const respuesta = await fetch(`${API_URL}/posts/${postId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, userId }),
  })
  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudo guardar la reacción')
  }

  return datos
}

export async function eliminarReaccionPublicacion(reactionId) {
  const respuesta = await fetch(`${API_URL}/reactions/${reactionId}`, {
    method: 'DELETE',
  })

  if (!respuesta.ok) {
    const datos = await respuesta.json()
    throw new Error(datos.error || 'No se pudo quitar la reacción')
  }
}
