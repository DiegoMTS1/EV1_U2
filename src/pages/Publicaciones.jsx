import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  crearReaccionPublicacion,
  eliminarReaccionPublicacion,
  obtenerPublicaciones,
  obtenerReaccionesPublicacion,
} from '../services/publicacion'

const tiposReaccion = [
  { type: 'like', label: 'Me gusta', emoji: '👍' },
  { type: 'love', label: 'Me encanta', emoji: '❤️' },
  { type: 'haha', label: 'Me divierte', emoji: '😂' },
  { type: 'wow', label: 'Me asombra', emoji: '😮' },
  { type: 'sad', label: 'Me entristece', emoji: '😢' },
  { type: 'angry', label: 'Me enoja', emoji: '😡' },
]

function leerReaccionAnonima(postId) {
  const guardada = localStorage.getItem(`reaccion-anonima:${postId}`)
  if (!guardada) return null

  let reaction
  try {
    reaction = JSON.parse(guardada)
  } catch {
    throw new Error('No se pudo recuperar tu reacción anónima guardada.')
  }

  if (
    !reaction ||
    typeof reaction.id !== 'string' ||
    !tiposReaccion.some(({ type }) => type === reaction.type)
  ) {
    throw new Error('No se pudo recuperar tu reacción anónima guardada.')
  }

  return reaction
}

function ReaccionPublicacion({ publicacion, onCambiarConteos }) {
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const usuario = JSON.parse(localStorage.getItem('user') || 'null')
  const userId = usuario?.id
  const [estadoAnonimo] = useState(() => {
    if (userId) return { reaccion: null, mensaje: '' }
    try {
      return {
        reaccion: leerReaccionAnonima(publicacion.id)?.type || null,
        mensaje: '',
      }
    } catch (error) {
      return { reaccion: null, mensaje: error.message }
    }
  })
  const [reaccionActual, setReaccionActual] = useState(estadoAnonimo.reaccion)
  const [mensaje, setMensaje] = useState(estadoAnonimo.mensaje)

  const elegirReaccion = async (type) => {
    setGuardando(true)
    setMensaje('')

    try {
      let counts

      if (userId) {
        const { reactions } = await obtenerReaccionesPublicacion(publicacion.id)
        const reaccionesPropias = reactions.filter(
          (reaction) => reaction.user?.id === userId,
        )
        const quitarSeleccion = reaccionesPropias.some(
          (reaction) => reaction.type === type,
        )

        for (const reaction of reaccionesPropias) {
          await eliminarReaccionPublicacion(reaction.id)
        }
        setReaccionActual(null)

        if (quitarSeleccion) {
          const resultado = await obtenerReaccionesPublicacion(publicacion.id)
          counts = resultado.counts
        } else {
          const resultado = await crearReaccionPublicacion(publicacion.id, {
            type,
            userId,
          })
          counts = resultado.counts
          setReaccionActual(type)
        }
      } else {
        const reactionGuardada = leerReaccionAnonima(publicacion.id)
        if (reactionGuardada) {
          await eliminarReaccionPublicacion(reactionGuardada.id)
          localStorage.removeItem(`reaccion-anonima:${publicacion.id}`)
          setReaccionActual(null)
        }

        if (reactionGuardada?.type === type) {
          ;({ counts } = await obtenerReaccionesPublicacion(publicacion.id))
        } else {
          const resultado = await crearReaccionPublicacion(publicacion.id, {
            type,
          })
          counts = resultado.counts
          localStorage.setItem(
            `reaccion-anonima:${publicacion.id}`,
            JSON.stringify({
              id: resultado.reaction.id,
              type,
            }),
          )
          setReaccionActual(type)
        }
      }

      onCambiarConteos(publicacion.id, counts)
      setSelectorAbierto(false)
    } catch (error) {
      setMensaje(error.message)

      try {
        const { counts } = await obtenerReaccionesPublicacion(publicacion.id)
        onCambiarConteos(publicacion.id, counts)
      } catch (errorActualizacion) {
        setMensaje(
          `${error.message}. No se pudieron actualizar los conteos: ${errorActualizacion.message}`,
        )
      }
    } finally {
      setGuardando(false)
    }
  }

  const conteos = publicacion.reactions || {}
  const totalReacciones = Object.values(conteos).reduce(
    (total, cantidad) => total + cantidad,
    0,
  )

  return (
    <div className="mt-5 border-t border-neutral-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex min-h-6 items-center gap-1" aria-label="Reacciones">
          {totalReacciones === 0 ? (
            <span>0 reacciones</span>
          ) : (
            tiposReaccion.map(({ type, label, emoji }) =>
              conteos[type] ? (
                <span
                  key={type}
                  title={label}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1"
                >
                  <span aria-hidden="true">{emoji}</span>
                  <span>{conteos[type]}</span>
                </span>
              ) : null,
            )
          )}
        </div>
        <span>
          {publicacion.commentsCount || 0}{' '}
          {publicacion.commentsCount === 1 ? 'comentario' : 'comentarios'}
        </span>
      </div>

      <div className="relative mt-3">
        <button
          type="button"
          aria-expanded={selectorAbierto}
          aria-haspopup="true"
          onClick={() => {
            setSelectorAbierto(!selectorAbierto)
            setMensaje('')
          }}
          disabled={guardando}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
        >
          {reaccionActual
            ? `${tiposReaccion.find(({ type }) => type === reaccionActual)?.emoji} ${tiposReaccion.find(({ type }) => type === reaccionActual)?.label}`
            : '🙂 Reaccionar'}
        </button>

        {selectorAbierto && (
          <div
            role="group"
            aria-label="Elige una reacción"
            className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-full border border-neutral-200 bg-white p-2 shadow-lg"
          >
            {tiposReaccion.map(({ type, label, emoji }) => (
              <button
                key={type}
                type="button"
                aria-label={label}
                aria-pressed={reaccionActual === type}
                title={label}
                onClick={() => elegirReaccion(type)}
                disabled={guardando}
                className="rounded-full p-2 text-2xl transition-transform hover:scale-125 hover:bg-neutral-100 disabled:opacity-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {guardando && (
        <p className="mt-2 text-xs text-neutral-500" role="status">
          Guardando reacción…
        </p>
      )}
      {mensaje && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {mensaje}
        </p>
      )}
    </div>
  )
}

function fechaPublicacion(createdAt) {
  if (!createdAt) return 'Fecha desconocida'
  const fecha = new Date(createdAt)
  if (Number.isNaN(fecha.getTime())) return 'Fecha desconocida'

  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

function Publicaciones() {
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cambiarConteosReacciones = (postId, reactions) => {
    setPublicaciones((actuales) =>
      actuales.map((publicacion) =>
        publicacion.id === postId ? { ...publicacion, reactions } : publicacion,
      ),
    )
  }

  useEffect(() => {
    obtenerPublicaciones()
      .then(setPublicaciones)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Publicaciones
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Preguntas, ideas y recursos compartidos por la comunidad.
          </p>
        </div>
        <Link
          to="/post"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-transform hover:scale-[1.02]"
        >
          Crear publicación
        </Link>
      </header>

      {cargando && (
        <div className="grid gap-4" aria-label="Cargando publicaciones">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <div className="h-5 w-1/3 rounded bg-neutral-200" />
              <div className="mt-3 h-3 w-1/4 rounded bg-neutral-100" />
              <div className="mt-5 h-4 w-full rounded bg-neutral-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">
            No se pudieron cargar las publicaciones
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && publicaciones.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <h2 className="font-semibold text-neutral-800">
            Todavía no hay publicaciones
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Comparte una pregunta o una idea con tus compañeros.
          </p>
          <Link
            to="/post"
            className="mt-5 inline-block rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Crear la primera publicación
          </Link>
        </div>
      )}

      {!cargando && !error && publicaciones.length > 0 && (
        <div className="grid gap-4">
          {publicaciones.map((publicacion) => (
            <article
              key={publicacion.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {publicacion.title}
                </h2>
                <time
                  dateTime={publicacion.createdAt}
                  className="text-xs text-neutral-400"
                >
                  {fechaPublicacion(publicacion.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-sm text-violet-700">
                {publicacion.author?.name || publicacion.authorName || 'Anónimo'}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                {publicacion.content}
              </p>
              <ReaccionPublicacion
                publicacion={publicacion}
                onCambiarConteos={cambiarConteosReacciones}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Publicaciones
