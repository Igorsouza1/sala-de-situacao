
import { useState, useEffect } from 'react';

// O hook recebe o ID da ação que queremos buscar.
export const useAcoesImages = (acaoId: string | undefined | null) => {
  // O estado agora vive DENTRO do hook.
  const [imagens, setImagens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se não houver ID, não fazemos nada.
    if (!acaoId) {
      setImagens([]);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/acoes/${acaoId}`);
        const responseData = await res.json();

        // >>> AQUI ESTÁ A CONEXÃO COM NOSSA NOVA API <<<
        if (responseData.success) {
          // Extrai as URLs do campo 'data' da nossa resposta padronizada.
          const urls = Array.isArray(responseData.data) 
            ? responseData.data.map((img: any) => img.url) 
            : [];
          setImagens(urls);
        } else {
          // Se a API retornar um erro, nós o capturamos.
          setError(responseData.error?.message || 'Erro desconhecido');
          setImagens([]);
        }

      } catch (e) {
        console.error("Falha na chamada da API:", e);
        setError("Não foi possível conectar à API.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

  }, [acaoId]); // O hook só roda novamente se o ID da ação mudar.

  // O hook retorna o estado para o componente usar.
  return { imagens, loading, error };
};