import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearPublicacion } from '../services/publicacion'

const inputClass =
  'w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 transition-colors outline-none placeholder:text-neutral-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20'

const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

function CrearPublicacion() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [anonymous, setAnonymous] = useState(
    () => !localStorage.getItem('token'),
  )
  const [feedback, setFeedback] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('user') || 'null')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback('')

    const publicarAnonimamente = !token || anonymous
    setGuardando(true)

    try {
      await crearPublicacion(
        {
          title: title.trim(),
          content: content.trim(),
          authorName: publicarAnonimamente
            ? authorName.trim() || undefined
            : undefined,
        },
        publicarAnonimamente ? null : token,
      )
      navigate('/publicaciones')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Crear publicación
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Comparte una pregunta, idea o recurso con tu clase.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {token ? (
          <fieldset>
            <legend className={labelClass}>Publicar como</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="publication-author"
                  checked={!anonymous}
                  onChange={() => setAnonymous(false)}
                  className="accent-violet-600"
                />
                <span>Mi cuenta ({usuario?.name || 'Usuario registrado'})</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="publication-author"
                  checked={anonymous}
                  onChange={() => setAnonymous(true)}
                  className="accent-violet-600"
                />
                <span>Anónimamente</span>
              </label>
            </div>
          </fieldset>
        ) : (
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            Puedes publicar sin registrarte. Si prefieres usar tu cuenta,{' '}
            <Link
              to="/registrarme"
              className="font-semibold underline hover:text-violet-950"
            >
              regístrate aquí
            </Link>
            .
          </div>
        )}

        {(!token || anonymous) && (
          <div>
            <label htmlFor="authorName" className={labelClass}>
              Nombre visible (opcional)
            </label>
            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anónimo"
              className={inputClass}
              maxLength={40}
            />
            <p className="mt-1 text-xs text-neutral-400">
              Si lo dejas vacío, la publicación aparecerá como “Anónimo”.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué quieres compartir?"
            className={inputClass}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="content" className={labelClass}>
            Contenido
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe los detalles de tu publicación…"
            className={`${inputClass} min-h-40 resize-y`}
            rows={7}
            required
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {guardando ? 'Publicando…' : 'Publicar'}
        </button>

        {feedback && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            {feedback}
          </p>
        )}
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/publicaciones"
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-violet-700"
        >
          Volver a publicaciones
        </Link>
      </div>
    </div>
  )
}

export default CrearPublicacion
