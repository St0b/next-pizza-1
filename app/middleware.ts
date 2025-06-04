import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function middleware() {
  // Сбрасываем соединение после каждого запроса
  await prisma.$disconnect()
  return NextResponse.next()
}