import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const search = url.searchParams.get('search')
        const genre = url.searchParams.get('genre')
        const authorName = url.searchParams.get('authorName')
        const pageParam = url.searchParams.get('page')
        const limitParam = url.searchParams.get('limit')
        const sortByParam = url.searchParams.get('sortBy')
        const orderParam = url.searchParams.get('order')

        const page = Math.max(1, Number(pageParam ?? 1) || 1)
        let limit = Number(limitParam ?? 10) || 10
        if (limit < 1) limit = 1
        if (limit > 50) limit = 50

        const allowedSort: Record<string, keyof Prisma.BookOrderByWithRelationInput> = {
            title: { title: 'asc' } as any,
            publishedYear: { publishedYear: 'asc' } as any,
            createdAt: { createdAt: 'asc' } as any,
        }

        const sortBy = sortByParam && ['title', 'publishedYear', 'createdAt'].includes(sortByParam)
            ? sortByParam
            : 'createdAt'

        const order = orderParam === 'asc' ? 'asc' : 'desc'

        // construir filtro
        const where: Prisma.BookWhereInput = {}

        if (search) {
            where.title = { contains: search, mode: 'insensitive' }
        }

        if (genre) {
            where.genre = { equals: genre, mode: 'insensitive' }
        }

        if (authorName) {
            where.author = { name: { contains: authorName, mode: 'insensitive' } }
        }

        // total
        const total = await prisma.book.count({ where })

        const totalPages = Math.max(1, Math.ceil(total / limit))
        const skip = (page - 1) * limit

        // ordenar
        const orderBy: any = {}
        orderBy[sortBy] = order

        const data = await prisma.book.findMany({
            where,
            include: { author: true },
            orderBy,
            skip,
            take: limit,
        })

        const pagination = {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        }

        return NextResponse.json({ data, pagination })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error en búsqueda de libros' }, { status: 500 })
    }
}