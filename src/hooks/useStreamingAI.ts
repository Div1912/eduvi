import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseStreamingAIOptions {
  onComplete?: (text: string) => void;
}

export function useStreamingAI(options?: UseStreamingAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    functionName: string,
    payload: Record<string, unknown>
  ) => {
    setIsLoading(true);
    setStreamedText('');
    setError(null);

    try {
      const response = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setStreamedText(fullText);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      options?.onComplete?.(fullText);
      return fullText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate';
      setError(errorMessage);
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait and try again.');
      } else if (errorMessage.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setStreamedText('');
    setError(null);
  }, []);

  return {
    generate,
    isLoading,
    streamedText,
    error,
    reset,
  };
}