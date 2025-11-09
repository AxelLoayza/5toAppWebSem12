import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	try {
		// parsear query params desde la URL de la petición
		const url = new URL(request.url)
		const genre = url.searchParams.get('genre')

		// construir filtro opcional
		const where: any = {}
		if (genre) {
			// coincidencia exacta insensible a mayúsculas
			where.genre = { equals: genre, mode: 'insensitive' }
		}

		const books = await prisma.book.findMany({
			where,
			include: { author: true },
			orderBy: { publishedYear: 'desc' },
		})

		return NextResponse.json(books)
	} catch (error) {
		console.error(error)
		return NextResponse.json({ error: 'Error al obtener libros' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			title,
			description,
			isbn,
			publishedYear,
			genre,
			pages,
			authorId,
		} = body

		// Validaciones básicas
		if (!title || !authorId) {
			return NextResponse.json(
				{ error: 'title y authorId son obligatorios' },
				{ status: 400 }
			)
		}

		// Verificar que el autor existe
		const author = await prisma.author.findUnique({ where: { id: authorId } })
		if (!author) {
			return NextResponse.json(
				{ error: 'Autor no encontrado' },
				{ status: 404 }
			)
		}

		const book = await prisma.book.create({
			data: {
				title,
				description: description ?? null,
				isbn: isbn ?? null,
				publishedYear: publishedYear ? Number(publishedYear) : null,
				genre: genre ?? null,
				pages: pages ? Number(pages) : null,
				authorId,
			},
		})

		return NextResponse.json(book, { status: 201 })
	} catch (error: any) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Error al crear libro' },
			{ status: 500 }
		)
	}
}