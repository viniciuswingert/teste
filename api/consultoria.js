import Anthropic from "@anthropic-ai/sdk";
import { gerarConsultoria, ErroDeEntrada } from "../lib/visagismo.js";
import { gerarPorRegras } from "../lib/regras.js";

// Rota POST /api/consultoria — funciona tanto na Vercel quanto no server.js local.
// Com a chave ANTHROPIC_API_KEY configurada, a análise é feita pelo Claude.
// Sem a chave, o site usa o modo demonstração (regras prontas, sem custo).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ erro: "Use POST." });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(200).json({ ...gerarPorRegras(req.body), modo: "regras" });
    }
    const resultado = await gerarConsultoria(req.body);
    return res.status(200).json({ ...resultado, modo: "ia" });
  } catch (erro) {
    if (erro instanceof ErroDeEntrada) {
      return res.status(400).json({ erro: erro.message });
    }
    if (erro instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ erro: "A chave da API do Claude está faltando ou é inválida. Confira o arquivo .env." });
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ erro: "Muitos pedidos ao mesmo tempo. Espere alguns segundos e tente de novo." });
    }
    if (erro instanceof Anthropic.APIError) {
      console.error("Erro da API do Claude:", erro.status, erro.message);
      return res.status(502).json({ erro: "O serviço de análise não respondeu agora. Tente de novo em instantes." });
    }
    if (erro instanceof Error && /API key|apiKey|authToken/i.test(erro.message)) {
      return res.status(500).json({ erro: "A chave da API do Claude não foi configurada. Confira o arquivo .env." });
    }
    console.error(erro);
    return res.status(500).json({ erro: erro instanceof Error ? erro.message : "Erro inesperado." });
  }
}
