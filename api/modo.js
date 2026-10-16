// Rota GET /api/modo — diz ao site se a IA está ligada (existe chave) ou se usa as regras.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ia: Boolean(process.env.ANTHROPIC_API_KEY) });
}
