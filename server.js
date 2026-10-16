// Servidor local: entrega a pasta public/ e a rota /api/consultoria.
// Na Vercel este arquivo não é usado; lá a pasta api/ vira a rota sozinha.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));

// Lê o arquivo .env (CHAVE=valor) sem precisar de biblioteca extra.
const arquivoEnv = path.join(raiz, ".env");
if (fs.existsSync(arquivoEnv)) {
  for (const linha of fs.readFileSync(arquivoEnv, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Cada arquivo da pasta api/ vira uma rota, igual acontece na Vercel.
const ROTAS = {
  "/api/consultoria": (await import("./api/consultoria.js")).default,
  "/api/modo": (await import("./api/modo.js")).default,
};

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function lerCorpo(req, limite = 8_000_000) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const partes = [];
    req.on("data", (p) => {
      tamanho += p.length;
      if (tamanho > limite) {
        reject(new Error("Pedido grande demais."));
        req.destroy();
      } else partes.push(p);
    });
    req.on("end", () => resolve(Buffer.concat(partes).toString("utf8")));
    req.on("error", reject);
  });
}

// Imita o res.status().json() da Vercel para a mesma rota funcionar aqui.
function adaptarResposta(res) {
  res.status = (codigo) => ((res.statusCode = codigo), res);
  res.json = (dados) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(dados));
  };
  return res;
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  const rota = ROTAS[url.pathname];
  if (rota) {
    adaptarResposta(res);
    try {
      const corpo = req.method === "POST" ? await lerCorpo(req) : "";
      req.body = corpo ? JSON.parse(corpo) : {};
    } catch {
      return res.status(400).json({ erro: "Pedido inválido." });
    }
    return rota(req, res);
  }

  const publico = path.join(raiz, "public");
  const alvo = path.normalize(path.join(publico, url.pathname === "/" ? "index.html" : url.pathname));
  if (!alvo.startsWith(publico) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
    res.statusCode = 404;
    return res.end("Não encontrado");
  }
  res.setHeader("Content-Type", TIPOS[path.extname(alvo)] ?? "application/octet-stream");
  fs.createReadStream(alvo).pipe(res);
});

const porta = Number(process.env.PORT) || 3000;
servidor.listen(porta, () => {
  console.log(`Site rodando em http://localhost:${porta}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "Modo IA: as consultas são feitas pelo Claude."
      : "Modo demonstração: sem chave da API, o site usa as regras prontas (grátis).",
  );
});
