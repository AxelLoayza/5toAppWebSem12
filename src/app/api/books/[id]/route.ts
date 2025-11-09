import {NextResponse }  from 'next/server'
import {prisma} from '@/lib/prisma'


export async function GET(
    request: Request,
    context: any
){
    try{
        let params = context?.params
        if (params && typeof (params as any).then === 'function') params = await params

        const book = await prisma.book.findUnique({
            where: {id: params.id},
            include: {
                author: true
            } ,
        });

        if(!book){
            return NextResponse.json(
                {error: 'Libro no encontrado'},
                {status: 404}
            );
        }
    return NextResponse.json(book);
    } catch (error) {
        return NextResponse.json(
            {error: 'Error al obtener el libro'},
            {status: 500}
        );
    }


}

export async function PUT(
    request: Request,
    context: any
){
    try{
        const body = await request.json();
        const {
            title,
            description, 
            isbn,
            publishedYear,
            genre,
            pages, 
            authorId
        } = body;

            if(title && title.length <3){
                return NextResponse.json(
                    {error: 'El título debe tener al menos 3 caracteres'},
                    {status: 400}
                );
            }
            if (pages && pages <1){
                return NextResponse.json(
                    {error: 'El número de páginas debe ser mayor a 0'},
                    {status: 400}
                );
            }
        

        if (authorId){
            const authorExists = await prisma.author.findUnique({
                where: {id: authorId},
            });
            if(!authorExists){
                return NextResponse.json(
                    {error: 'El autor no existe'},
                    {status: 400}
                );
            }
        }
        let params = context?.params
        if (params && typeof (params as any).then === 'function') params = await params

        const book = await prisma.book.update({
            where: {id: params.id},
            data: {
                title,
                description,
                isbn,
                publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
                genre,
                pages: pages ? parseInt(pages) : undefined,
                authorId,
            },
            include: {
                author: true,
            },
        });
        return NextResponse.json(book);
    } catch (error: any ) {
        if(error.code === 'P2025'){
            return NextResponse.json(
                {error: 'Libro no encontrado'},
                {status: 404}
            );
        }
        if (error.code === 'P2002'){
            return NextResponse.json(
                {error: 'El ISBN ya está registrado'},
                {status: 409}
            );
        }
        return NextResponse.json(
            {error: 'Error al actualizar el libro'},
            {status: 500}
        );
    }
}

export async function DELETE(
    request: Request,
    context: any
){
    try {
        let params = context?.params
        if (params && typeof (params as any).then === 'function') params = await params

        await prisma.book.delete({
            where: {id: params.id},
        });
        return NextResponse.json(
            {message: 'Libro eliminado'
        })
    } catch (error: any) {
        if (error.code === 'P2025'){
            return NextResponse.json(
                {error: 'Libro no encontrado'},
                {status: 404}
            );
        }
        return NextResponse.json(
            {error: 'Error al eliminar el libro'},
            {status: 500}
        );

    }
}