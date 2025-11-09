import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: any) {
	try {
		let params = context?.params
		if (params && typeof (params as any).then === 'function') {
			params = await params
		}

		const authorId: string = params?.id

		const author = await prisma.author.findUnique({
			where: { id: authorId },
			select: { name: true },
		})

		const totalBooks = await prisma.book.count({ where: { authorId } })

		if (totalBooks === 0) {
			return NextResponse.json({
				authorId,
				authorName: author?.name ?? null,
				totalBooks: 0,
				firstBook: null,
				latestBook: null,
				averagePages: null,
				genres: [],
				longestBook: null,
				shortestBook: null,
			})
		}

		const firstBook = await prisma.book.findFirst({
			where: { authorId, publishedYear: { not: null } },
			orderBy: { publishedYear: 'asc' },
			select: { title: true, publishedYear: true },
		})

		const latestBook = await prisma.book.findFirst({
			where: { authorId, publishedYear: { not: null } },
			orderBy: { publishedYear: 'desc' },
			select: { title: true, publishedYear: true },
		})

		const avgRes = await prisma.book.aggregate({
			_avg: { pages: true },
			where: { authorId, pages: { not: null } },
		})
		const averagePages = avgRes._avg.pages !== null && avgRes._avg.pages !== undefined
			? Math.round(avgRes._avg.pages)
			: null

		const genresRows = await prisma.book.findMany({
			where: { authorId, genre: { not: null } },
			select: { genre: true },
		})
		const genres = Array.from(new Set(genresRows.map((g) => g.genre))).filter(Boolean)

		const longestBook = await prisma.book.findFirst({
			where: { authorId, pages: { not: null } },
			orderBy: { pages: 'desc' },
			select: { title: true, pages: true },
		})

		const shortestBook = await prisma.book.findFirst({
			where: { authorId, pages: { not: null } },
			orderBy: { pages: 'asc' },
			select: { title: true, pages: true },
		})

		return NextResponse.json({
			authorId,
			authorName: author?.name ?? null,
			totalBooks,
			firstBook: firstBook ? { title: firstBook.title, year: firstBook.publishedYear } : null,
			latestBook: latestBook ? { title: latestBook.title, year: latestBook.publishedYear } : null,
			averagePages,
			genres,
			longestBook: longestBook ? { title: longestBook.title, pages: longestBook.pages } : null,
			shortestBook: shortestBook ? { title: shortestBook.title, pages: shortestBook.pages } : null,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json({ error: 'Error al obtener estadísticas del autor' }, { status: 500 })
	}
}

