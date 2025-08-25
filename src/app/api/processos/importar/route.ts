import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import { Status } from "@prisma/client";

interface ProcessoData {
  numero: string;
  vara: string;
  partesEnvolvidas: string;
  tipoPericia: string;
  prazos: string;
  status?: Status;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado." }, 
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let processosData: ProcessoData[] = [];

    if (file.type === "application/pdf") {
      // Processar PDF
      try {
        const data = await pdfParse(fileBuffer);
        const texto = data.text;
        
        // Exemplo de parsing simples - você pode ajustar conforme o formato do seu PDF
        // Assumindo que cada processo está em uma linha com formato:
        // "NUMERO|VARA|PARTES|TIPO_PERICIA|PRAZOS|STATUS"
        const linhas = texto.split('\n').filter((linha: string) => linha.trim());
        
        for (const linha of linhas) {
          const campos = linha.split('|');
          if (campos.length >= 5) {
            processosData.push({
              numero: campos[0]?.trim() || '',
              vara: campos[1]?.trim() || '',
              partesEnvolvidas: campos[2]?.trim() || '',
              tipoPericia: campos[3]?.trim() || '',
              prazos: campos[4]?.trim() || '',
              status: campos[5]?.trim() as Status || Status.EM_ANDAMENTO
            });
          }
        }
      } catch (pdfError) {
        return NextResponse.json(
          { error: "Erro ao processar arquivo PDF. Verifique o formato." }, 
          { status: 400 }
        );
      }
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    ) {
      // Processar Excel/Planilha
      try {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        processosData = jsonData.map((row: any) => ({
          numero: String(row.numero || row.Numero || row.NUMERO || '').trim(),
          vara: String(row.vara || row.Vara || row.VARA || '').trim(),
          partesEnvolvidas: String(row.partesEnvolvidas || row.partes || row.Partes || row.PARTES || '').trim(),
          tipoPericia: String(row.tipoPericia || row.tipo || row.Tipo || row.TIPO || '').trim(),
          prazos: String(row.prazos || row.Prazos || row.PRAZOS || '').trim(),
          status: (row.status || row.Status || row.STATUS || Status.EM_ANDAMENTO) as Status
        }));
      } catch (excelError) {
        return NextResponse.json(
          { error: "Erro ao processar planilha. Verifique o formato e as colunas." }, 
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use PDF ou Excel (.xlsx, .xls)." }, 
        { status: 400 }
      );
    }

    if (processosData.length === 0) {
      return NextResponse.json(
        { error: "Nenhum processo válido foi encontrado no arquivo." }, 
        { status: 400 }
      );
    }

    // Validar e inserir dados no banco
    const processosInseridos = [];
    const erros = [];

    for (let i = 0; i < processosData.length; i++) {
      const proc = processosData[i];
      
      // Validação básica
      if (!proc.numero || !proc.vara || !proc.partesEnvolvidas || !proc.tipoPericia || !proc.prazos) {
        erros.push(`Linha ${i + 1}: Campos obrigatórios em branco`);
        continue;
      }

      try {
        // Verificar se já existe
        const existente = await prisma.processo.findUnique({
          where: { numero: proc.numero }
        });

        if (existente) {
          erros.push(`Linha ${i + 1}: Processo ${proc.numero} já existe`);
          continue;
        }

        // Validar data
        const dataProcesso = new Date(proc.prazos);
        if (isNaN(dataProcesso.getTime())) {
          erros.push(`Linha ${i + 1}: Data inválida - ${proc.prazos}`);
          continue;
        }

        // Inserir no banco
        const novoProcesso = await prisma.processo.create({
          data: {
            numero: proc.numero,
            vara: proc.vara,
            partesEnvolvidas: proc.partesEnvolvidas,
            tipoPericia: proc.tipoPericia,
            prazos: dataProcesso,
            status: Object.values(Status).includes(proc.status!) ? proc.status! : Status.EM_ANDAMENTO,
          },
        });

        processosInseridos.push(novoProcesso);
      } catch (dbError) {
        erros.push(`Linha ${i + 1}: Erro ao inserir processo ${proc.numero}`);
      }
    }

    return NextResponse.json({
      message: `Importação concluída. ${processosInseridos.length} processos inseridos.`,
      processosInseridos: processosInseridos.length,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (error) {
    console.error('Erro na importação:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor durante a importação." }, 
      { status: 500 }
    );
  }
}
