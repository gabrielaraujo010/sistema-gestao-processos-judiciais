"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Processo {
  id: number;
  numero: string;
  vara: string;
  partesEnvolvidas: string;
  tipoPericia: string;
  prazos: string;
  status: string;
  createdAt: string;
}

const statusColors = {
  EM_ANDAMENTO: "bg-blue-100 text-blue-800",
  AGUARDANDO: "bg-yellow-100 text-yellow-800",
  CONCLUIDO: "bg-green-100 text-green-800",
};

const statusLabels = {
  EM_ANDAMENTO: "Em Andamento",
  AGUARDANDO: "Aguardando",
  CONCLUIDO: "Concluído",
};

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/processos");
      if (!response.ok) {
        throw new Error("Erro ao carregar processos");
      }
      const data = await response.json();
      setProcessos(data);
    } catch (err) {
      setError("Erro ao carregar processos. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando processos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Processos Judiciais
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os processos judiciais em um só lugar
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/processos/importar">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>Importar Dados</span>
            </Button>
          </Link>
          <Link href="/processos/novo">
            <Button className="flex items-center space-x-2">
              <span>Novo Processo</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={fetchProcessos}
              variant="outline"
              className="mt-3"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Processos</span>
            <Badge variant="secondary">
              {processos.length} processo{processos.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum processo cadastrado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece cadastrando seu primeiro processo ou importando dados.
              </p>
              <div className="flex justify-center space-x-3">
                <Link href="/processos/novo">
                  <Button>Cadastrar Primeiro Processo</Button>
                </Link>
                <Link href="/processos/importar">
                  <Button variant="outline">Importar Dados</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Vara</TableHead>
                    <TableHead>Partes Envolvidas</TableHead>
                    <TableHead>Tipo de Perícia</TableHead>
                    <TableHead>Prazos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((processo) => (
                    <TableRow key={processo.id}>
                      <TableCell className="font-medium">
                        {processo.numero}
                      </TableCell>
                      <TableCell>{processo.vara}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {processo.partesEnvolvidas}
                      </TableCell>
                      <TableCell>{processo.tipoPericia}</TableCell>
                      <TableCell>{formatDate(processo.prazos)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[processo.status as keyof typeof statusColors]
                          }
                        >
                          {statusLabels[processo.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(processo.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
