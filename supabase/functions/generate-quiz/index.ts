import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { content, questionCount, difficulty } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in Supabase secrets')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

        const prompt = `
      Você é um especialista em educação criando provas.
      Crie um questionário baseado EXCLUSIVAMENTE no texto fornecido abaixo.
      
      Requisitos:
      - ${questionCount} questões de múltipla escolha.
      - Dificuldade: ${difficulty === 'medium' ? 'Média (foco em compreensão)' : 'Difícil (foco em análise e aplicação)'}.
      - Idioma: Português Brasileiro (pt-BR).
      - Cada questão deve ter 5 alternativas (A, B, C, D, E).
      - Apenas UMA alternativa correta.
      - Formato de saída: JSON puro (array de objetos).

      Estrutura do JSON:
      [
        {
          "title": "Enunciado da questão...",
          "alternatives": [
            {"text": "Alternativa 1...", "is_correct": false},
            {"text": "Alternativa Correta...", "is_correct": true},
            ...
          ]
        }
      ]

      CONTEÚDO PARA BASEAR AS QUESTÕES:
      ${content.substring(0, 15000)}
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Parse to ensure valid JSON before returning
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const questions = JSON.parse(jsonStr)

        return new Response(
            JSON.stringify(questions),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
