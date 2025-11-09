'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  email: string
  bio?: string
  nationality?: string
  birthYear?: number
  books: Book[]
  _count: { books: number }
}

interface Book {
  id: string
  title: string
  description?: string
  isbn?: string
  publishedYear?: number
  genre?: string
  pages?: number
  createdAt: string
}

interface AuthorStats {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number | null
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

export default function AuthorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const authorId = params.id as string
  
  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showAddBookForm, setShowAddBookForm] = useState(false)
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: ''
  })
  
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: ''
  })

  useEffect(() => {
    if (authorId) {
      fetchAuthor()
      fetchStats()
    }
  }, [authorId])

  const fetchAuthor = async () => {
    try {
      const response = await fetch(`/api/authors/${authorId}`)
      if (response.ok) {
        const data = await response.json()
        setAuthor(data)
        setEditForm({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
          nationality: data.nationality || '',
          birthYear: data.birthYear ? data.birthYear.toString() : ''
        })
      } else {
        console.error('Author not found')
      }
    } catch (error) {
      console.error('Error fetching author:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/authors/${authorId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          birthYear: editForm.birthYear ? parseInt(editForm.birthYear) : null
        })
      })
      
      if (response.ok) {
        setEditing(false)
        fetchAuthor()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating author:', error)
    }
  }

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBook,
          authorId,
          publishedYear: newBook.publishedYear ? parseInt(newBook.publishedYear) : null,
          pages: newBook.pages ? parseInt(newBook.pages) : null
        })
      })
      
      if (response.ok) {
        setNewBook({
          title: '',
          description: '',
          isbn: '',
          publishedYear: '',
          genre: '',
          pages: ''
        })
        setShowAddBookForm(false)
        fetchAuthor()
        fetchStats()
      }
    } catch (error) {
      console.error('Error adding book:', error)
    }
  }

  const deleteBook = async (bookId: string) => {
    if (!confirm('¿Estás seguro de eliminar este libro?')) return
    
    try {
      const response = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
      if (response.ok) {
        fetchAuthor()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-900 font-medium">Cargando...</div>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600 font-medium">Autor no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Autor</h1>
            <div className="flex gap-4">
              <Link href="/" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors">
                Dashboard
              </Link>
              <Link href="/books" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
                Libros
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Author Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Información del Autor</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  {editing ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editing ? (
                <form onSubmit={updateAuthor}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Biografía</label>
                      <textarea
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Nacionalidad</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                        value={editForm.nationality}
                        onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Año de Nacimiento</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                        value={editForm.birthYear}
                        onChange={(e) => setEditForm({...editForm, birthYear: e.target.value})}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-gray-900">
                  <div>
                    <span className="font-medium text-gray-800">Nombre:</span> {author.name}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Email:</span> {author.email}
                  </div>
                  {author.bio && (
                    <div>
                      <span className="font-medium text-gray-800">Biografía:</span>
                      <p className="mt-1 text-gray-900">{author.bio}</p>
                    </div>
                  )}
                  {author.nationality && (
                    <div>
                      <span className="font-medium text-gray-800">Nacionalidad:</span> {author.nationality}
                    </div>
                  )}
                  {author.birthYear && (
                    <div>
                      <span className="font-medium text-gray-800">Año de Nacimiento:</span> {author.birthYear}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow p-6 mt-6 border-t-4 border-amber-500">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h2>
                <div className="space-y-3 text-sm text-gray-900">
                  <div>
                    <span className="font-medium text-gray-800">Total de libros:</span> {stats.totalBooks}
                  </div>
                  {stats.firstBook && (
                    <div>
                      <span className="font-medium text-gray-800">Primer libro:</span> {stats.firstBook.title} ({stats.firstBook.year})
                    </div>
                  )}
                  {stats.latestBook && (
                    <div>
                      <span className="font-medium text-gray-800">Último libro:</span> {stats.latestBook.title} ({stats.latestBook.year})
                    </div>
                  )}
                  {stats.averagePages && (
                    <div>
                      <span className="font-medium text-gray-800">Promedio de páginas:</span> {stats.averagePages}
                    </div>
                  )}
                  {stats.genres.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-800">Géneros:</span> {stats.genres.join(', ')}
                    </div>
                  )}
                  {stats.longestBook && (
                    <div>
                      <span className="font-medium text-gray-800">Libro más largo:</span> {stats.longestBook.title} ({stats.longestBook.pages} páginas)
                    </div>
                  )}
                  {stats.shortestBook && (
                    <div>
                      <span className="font-medium text-gray-800">Libro más corto:</span> {stats.shortestBook.title} ({stats.shortestBook.pages} páginas)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Books */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 bg-amber-600 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Libros del Autor</h2>
                <button
                  onClick={() => setShowAddBookForm(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                >
                  Agregar Libro
                </button>
              </div>

              <div className="p-6">
                {author.books && author.books.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {author.books.map((book) => (
                      <div key={book.id} className="border border-gray-200 rounded-lg p-4 border-l-4 border-l-amber-500">
                        <h3 className="font-semibold text-gray-900 mb-2">{book.title}</h3>
                        
                        {book.description && (
                          <p className="text-sm text-gray-800 mb-3 line-clamp-3">{book.description}</p>
                        )}
                        
                        <div className="space-y-1 text-sm text-gray-900 mb-4">
                          {book.genre && <p><span className="font-medium text-gray-800">Género:</span> {book.genre}</p>}
                          {book.publishedYear && <p><span className="font-medium text-gray-800">Año:</span> {book.publishedYear}</p>}
                          {book.pages && <p><span className="font-medium text-gray-800">Páginas:</span> {book.pages}</p>}
                          {book.isbn && <p><span className="font-medium text-gray-800">ISBN:</span> {book.isbn}</p>}
                        </div>
                        
                        <button 
                          onClick={() => deleteBook(book.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900 text-center py-8 font-medium">
                    Este autor no tiene libros publicados aún.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Book Modal */}
        {showAddBookForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 max-w-90vw max-h-90vh overflow-y-auto shadow-xl">
              <div className="bg-amber-600 text-white px-8 py-4 rounded-t-lg">
                <h2 className="text-xl font-bold">Agregar Nuevo Libro</h2>
              </div>
              <div className="p-8">
              <form onSubmit={addBook}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-800 mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-800 mb-1">Descripción</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    rows={3}
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-800 mb-1">ISBN</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-800 mb-1">Año de Publicación</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    value={newBook.publishedYear}
                    onChange={(e) => setNewBook({...newBook, publishedYear: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-800 mb-1">Género</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    value={newBook.genre}
                    onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-800 mb-1">Páginas</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    value={newBook.pages}
                    onChange={(e) => setNewBook({...newBook, pages: e.target.value})}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBookForm(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}