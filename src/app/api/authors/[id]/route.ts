import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Obtiene todos los libros de un autor específico
export async function GET(
  request: Request,
  context: any
) {
  try {
    // resolver params (puede ser Promise en algunas versiones de Next)
    let params = context?.params
    if (params && typeof (params as any).then === 'function') {
      params = await params
    }

    // Verificar que el autor existe
    const author = await prisma.author.findUnique({
      where: { id: params.id },
      include: {
        books:{
            orderBy: {
                publishedYear: 'desc',
            }
        },
        _count:{
            select: { books: true }
        }
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(author)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener libros del autor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: any
) {
  try {
    const body = await request.json()
    const { name, email, bio, nationality, birthYear } = body

    // Validación
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    let params = context?.params
    if (params && typeof (params as any).then === 'function') {
      params = await params
    }

    const author = await prisma.author.update({
      where: { id: params.id },
      data: {
        name,
        email,
        bio,
        nationality,
        birthYear: birthYear ? parseInt(birthYear) : null,
      },
      include: {
        books: true,
      },
    })

    return NextResponse.json(author)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar autor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
    request: Request,
    context: any
) {
  try {
      let params = context?.params
      if (params && typeof (params as any).then === 'function') {
        params = await params
      }

      await prisma.author.delete({
        where: { id: params.id },
      })

    return NextResponse.json({ 
      message: 'Autor eliminado' 
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error al eliminar autor' },
      { status: 500 }
    )
  }
}