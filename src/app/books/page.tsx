'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import Link from 'next/link'

interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  description?: string
  isbn?: string
  publishedYear?: number
  genre?: string
  pages?: number
  author: Author
  createdAt: string
}

interface SearchResponse {
  data: Book[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Search and filter states
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  })

  // New book form
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
    authorId: ''
  })

  // Debounce search input
  const [debouncedSearch] = useDebounce(search, 500)

  useEffect(() => {
    fetchAuthors()
    fetchBooks()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchBooks()
  }, [debouncedSearch, selectedGenre, selectedAuthor, sortBy, order])

  useEffect(() => {
    fetchBooks()
  }, [page])

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors')
      const data = await response.json()
      setAuthors(data)
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        order
      })
      
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedGenre) params.append('genre', selectedGenre)
      if (selectedAuthor) {
        const author = authors.find(a => a.id === selectedAuthor)
        if (author) params.append('authorName', author.name)
      }

      const response = await fetch(`/api/books/search?${params}`)
      const data: SearchResponse = await response.json()
      
      setBooks(data.data)
      setPagination(data.pagination)
      
      // Extract unique genres
      const uniqueGenres = Array.from(new Set(
        data.data.map(book => book.genre).filter(Boolean)
      )) as string[]
      setGenres(prev => Array.from(new Set([...prev, ...uniqueGenres])))
      
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, selectedGenre, selectedAuthor, sortBy, order, authors])

  const createBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBook,
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
          pages: '',
          authorId: ''
        })
        setShowCreateForm(false)
        fetchBooks()
      }
    } catch (error) {
      console.error('Error creating book:', error)
    }
  }

  const deleteBook = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este libro?')) return
    
    try {
      const response = await fetch(`/api/books/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchBooks()
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre('')
    setSelectedAuthor('')
    setSortBy('createdAt')
    setOrder('desc')
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Libros</h1>
            <div className="flex gap-4">
              <Link href="/" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors">
                Dashboard
              </Link>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                Crear Libro
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Buscar por título</label>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Género</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="">Todos los géneros</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Autor</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                >
                  <option value="">Todos los autores</option>
                  {authors.map(author => (
                    <option key={author.id} value={author.id}>{author.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Ordenar por</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Fecha de creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año publicación</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Orden</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-900 font-medium">
              {loading ? 'Cargando...' : `${pagination.total} libros encontrados`}
            </p>
          </div>
        </div>

        {/* Create Book Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all overflow-y-auto max-h-[90vh]">
              <div className="bg-amber-600 px-6 py-5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Crear Nuevo Libro</h2>
                </div>
              </div>
              <form onSubmit={createBook} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                  <input
                    type="text"
                    required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                    placeholder="Título del libro"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Autor *</label>
                  <select
                    required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                    value={newBook.authorId}
                    onChange={(e) => setNewBook({...newBook, authorId: e.target.value})}
                  >
                    <option value="">Seleccionar autor</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                    rows={3}
                    placeholder="Descripción del libro"
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ISBN</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                      placeholder="ISBN"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Año de Publicación</label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                      placeholder="Año"
                      value={newBook.publishedYear}
                      onChange={(e) => setNewBook({...newBook, publishedYear: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                      placeholder="Género"
                      value={newBook.genre}
                      onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Páginas</label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-gray-900"
                      placeholder="Número"
                      value={newBook.pages}
                      onChange={(e) => setNewBook({...newBook, pages: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Crear Libro
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h3>
              <p className="text-sm text-gray-700 mb-2">por {book.author.name}</p>
              
              {book.description && (
                <p className="text-sm text-gray-800 mb-3 line-clamp-3">{book.description}</p>
              )}
              
              <div className="space-y-1 text-sm text-gray-900 mb-4">
                {book.genre && <p><span className="font-medium text-gray-800">Género:</span> {book.genre}</p>}
                {book.publishedYear && <p><span className="font-medium text-gray-800">Año:</span> {book.publishedYear}</p>}
                {book.pages && <p><span className="font-medium text-gray-800">Páginas:</span> {book.pages}</p>}
                {book.isbn && <p><span className="font-medium text-gray-800">ISBN:</span> {book.isbn}</p>}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => deleteBook(book.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-900 font-medium">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {books.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-900 text-lg font-medium">No se encontraron libros</p>
          </div>
        )}
      </div>
    </div>
  )
}