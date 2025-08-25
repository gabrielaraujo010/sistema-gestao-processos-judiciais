"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
  numero: string;
  vara: string;
  partesEnvolvidas: string;
  tipoPericia: string;
  prazos: string;
  status: string;
}

export default function NovoProcesso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    numero: "",
    vara: "",
    partesEnvolvidas: "",
    tipoPericia: "",
    prazos: "",
    status: "EM_ANDAMENTO",
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar mensagens de erro/sucesso quando o usuário começar a digitar
    if (error) setError("");
    if (success) setSuccess("");
  };

  const validateForm = (): boolean => {
    if (!formData.numero.trim()) {
      setError("O número do processo é obrigatório.");
      return false;
    }
    if (!formData.vara.trim()) {
      setError("A vara é obrigatória.");
      return false;
    }
    if (!formData.partesEnvolvidas.trim()) {
      setError("As partes envolvidas são obrigatórias.");
      return false;
    }
    if (!formData.tipoPericia.trim()) {
      setError("O tipo de perícia é obrigatório.");
      return false;
    }
    if (!formData.prazos) {
      setError("A data de prazo é obrigatória.");
      return false;
    }

    // Validar se a data não é no passado
    const prazoDate = new Date(formData.prazos);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (prazoDate < today) {
      setError("A data de prazo não pode ser no passado.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/processos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao cadastrar processo");
      }

      setSuccess("Processo cadastrado com sucesso!");
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/processos");
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar processo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Processo</h1>
          <p className="mt-2 text-gray-600">
            Cadastre um novo processo judicial no sistema
          </p>
        </div>
        <Link href="/processos">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Processo</CardTitle>
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

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero">Número do Processo *</Label>
                <Input
                  id="numero"
                  type="text"
                  placeholder="Ex: 1234567-89.2023.8.26.0001"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vara">Vara *</Label>
                <Input
                  id="vara"
                  type="text"
                  placeholder="Ex: 1ª Vara Cível"
                  value={formData.vara}
                  onChange={(e) => handleChange("vara", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partesEnvolvidas">Partes Envolvidas *</Label>
              <Textarea
                id="partesEnvolvidas"
                placeholder="Ex: João Silva vs. Maria Santos"
                value={formData.partesEnvolvidas}
                onChange={(e) => handleChange("partesEnvolvidas", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tipoPericia">Tipo de Perícia *</Label>
                <Input
                  id="tipoPericia"
                  type="text"
                  placeholder="Ex: Contábil, Médica, Técnica"
                  value={formData.tipoPericia}
                  onChange={(e) => handleChange("tipoPericia", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazos">Data de Prazo *</Label>
                <Input
                  id="prazos"
                  type="date"
                  value={formData.prazos}
                  onChange={(e) => handleChange("prazos", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Link href="/processos">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar Processo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
