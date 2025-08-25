import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Status } from "@prisma/client";

export async function GET() {
  try {
    const processos = await prisma.processo.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(processos);
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { numero, vara, partesEnvolvidas, tipoPericia, prazos, status } = data;

    // Validação dos campos obrigatórios
    if (!numero || !vara || !partesEnvolvidas || !tipoPericia || !prazos) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos." }, 
        { status: 400 }
      );
    }

    // Verificar se o número do processo já existe
    const processoExistente = await prisma.processo.findUnique({
      where: { numero }
    });

    if (processoExistente) {
      return NextResponse.json(
        { error: "Já existe um processo com este número." }, 
        { status: 400 }
      );
    }

    // Validar status
    const statusValido = status && Object.values(Status).includes(status) 
      ? status 
      : Status.EM_ANDAMENTO;

    const novoProcesso = await prisma.processo.create({
      data: {
        numero,
        vara,
        partesEnvolvidas,
        tipoPericia,
        prazos: new Date(prazos),
        status: statusValido,
      },
    });

    return NextResponse.json(novoProcesso, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    return NextResponse.json(
      { error: "Erro ao criar o processo." }, 
      { status: 500 }
    );
  }
}
