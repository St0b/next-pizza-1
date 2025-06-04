import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function middleware() {
  // Сбрасываем соединение после каждого запроса
  await prisma.$disconnect()
  return NextResponse.next()
}