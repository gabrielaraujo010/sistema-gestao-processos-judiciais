"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportResult {
  message: string;
  processosInseridos: number;
  erros?: string[];
}

export default function ImportarProcessos() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError("");
    setResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        handleFileChange(droppedFile);
      } else {
        setError("Tipo de arquivo não suportado. Use PDF ou Excel (.xlsx, .xls).");
      }
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    const validExtensions = [".pdf", ".xlsx", ".xls"];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Selecione um arquivo para importar.");
      return;
    }

    if (!isValidFileType(file)) {
      setError("Tipo de arquivo não suportado. Use PDF ou Excel (.xlsx, .xls).");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/processos/importar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na importação");
      }

      setResult(data);
      
      // Se a importação foi bem-sucedida, redirecionar após alguns segundos
      if (data.processosInseridos > 0) {
        setTimeout(() => {
          router.push("/processos");
        }, 5000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar arquivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importar Processos</h1>
          <p className="mt-2 text-gray-600">
            Importe processos em lote através de arquivos PDF ou planilhas Excel
          </p>
        </div>
        <Link href="/processos">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-600">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {result && (
                  <Alert className={`border-green-200 bg-green-50`}>
                    <AlertDescription className="text-green-600">
                      <div className="space-y-2">
                        <p className="font-medium">{result.message}</p>
                        <p>Processos inseridos: {result.processosInseridos}</p>
                        {result.erros && result.erros.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium text-yellow-700">Avisos:</p>
                            <ul className="list-disc list-inside text-sm text-yellow-600 mt-1">
                              {result.erros.slice(0, 5).map((erro, index) => (
                                <li key={index}>{erro}</li>
                              ))}
                              {result.erros.length > 5 && (
                                <li>... e mais {result.erros.length - 5} avisos</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {result.processosInseridos > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            Redirecionando para a lista de processos em 5 segundos...
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Label>Arquivo (PDF ou Excel)</Label>
                  
                  {/* Área de drag and drop */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="text-4xl">📁</div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Arraste e solte seu arquivo aqui
                        </p>
                        <p className="text-gray-600">ou</p>
                      </div>
                      <div>
                        <Input
                          type="file"
                          accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                          className="hidden"
                          id="file-input"
                        />
                        <Label htmlFor="file-input">
                          <Button type="button" variant="outline" asChild>
                            <span>Selecionar Arquivo</span>
                          </Button>
                        </Label>
                      </div>
                      {file && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-900">
                            Arquivo selecionado:
                          </p>
                          <p className="text-sm text-gray-600">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processando arquivo...</span>
                      <span>Aguarde</span>
                    </div>
                    <Progress value={undefined} className="w-full" />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Link href="/processos">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={!file || loading}>
                    {loading ? "Importando..." : "Importar Arquivo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formatos Suportados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">PDF</h4>
                <p className="text-sm text-gray-600">
                  Formato: NUMERO|VARA|PARTES|TIPO_PERICIA|PRAZOS|STATUS
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Excel (.xlsx, .xls)</h4>
                <p className="text-sm text-gray-600">
                  Colunas: numero, vara, partes, tipoPericia, prazos, status
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exemplo de Planilha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">numero</th>
                      <th className="text-left p-1">vara</th>
                      <th className="text-left p-1">partes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">123456</td>
                      <td className="p-1">1ª Vara</td>
                      <td className="p-1">A vs B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
