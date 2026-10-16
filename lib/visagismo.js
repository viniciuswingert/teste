import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_VISAGISMO } from "./prompt.js";
import { ErroDeEntrada } from "./erros.js";

// O prompt original vem primeiro, sem alterações. O complemento abaixo só diz
// como entregar a resposta para o site conseguir desenhá-la.
const SISTEMA = `${PROMPT_VISAGISMO}

5. Formato de entrega (para o site)
- Responda somente no formato JSON pedido, em português do Brasil.
- Cada recomendação deve vir com a sua justificativa técnica, ligando a escolha às linhas e formas do rosto e ao objetivo da pessoa.
- Em "cores", informe cada tom com um código hexadecimal (#RRGGBB) que represente bem a cor.
- Se uma foto for enviada, use-a para a análise. Se a foto não mostrar um rosto com clareza, baseie-se nos dados escritos e diga isso no diagnóstico.
- Na parte de barba ou maquiagem, siga a preferência informada pela pessoa.`;

const item = {
  type: "object",
  properties: {
    recomendacao: { type: "string" },
    justificativa: { type: "string" },
  },
  required: ["recomendacao", "justificativa"],
  additionalProperties: false,
};

const cor = {
  type: "object",
  properties: {
    nome: { type: "string" },
    hex: { type: "string" },
    justificativa: { type: "string" },
  },
  required: ["nome", "hex", "justificativa"],
  additionalProperties: false,
};

const lista = (schema) => ({ type: "array", items: schema });

const SCHEMA = {
  type: "object",
  properties: {
    diagnostico: {
      type: "object",
      properties: {
        formato_rosto: {
          type: "string",
          enum: ["oval", "quadrado", "redondo", "retangular", "triângulo invertido", "coração"],
        },
        linhas_predominantes: { type: "string", enum: ["retas", "curvas", "inclinadas"] },
        contraste_pessoal: { type: "string", enum: ["baixo", "médio", "alto"] },
        resumo: { type: "string" },
      },
      required: ["formato_rosto", "linhas_predominantes", "contraste_pessoal", "resumo"],
      additionalProperties: false,
    },
    cabelo: lista(item),
    rosto_acessorios: {
      type: "object",
      properties: {
        oculos: lista(item),
        sobrancelha: lista(item),
        barba_ou_maquiagem: lista(item),
      },
      required: ["oculos", "sobrancelha", "barba_ou_maquiagem"],
      additionalProperties: false,
    },
    cores: {
      type: "object",
      properties: {
        paleta: lista(cor),
        evitar: lista(cor),
      },
      required: ["paleta", "evitar"],
      additionalProperties: false,
    },
  },
  required: ["diagnostico", "cabelo", "rosto_acessorios", "cores"],
  additionalProperties: false,
};

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_IMAGEM = 4_000_000; // caracteres em base64 (~3 MB)

export { ErroDeEntrada };

const texto = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function montarPedido(dados) {
  const foto = dados.foto;
  const temFoto = foto && typeof foto.base64 === "string" && foto.base64.length > 0;

  if (temFoto) {
    if (!TIPOS_IMAGEM.includes(foto.tipo)) throw new ErroDeEntrada("Formato de foto não suportado.");
    if (foto.base64.length > LIMITE_IMAGEM) throw new ErroDeEntrada("A foto é grande demais.");
  }

  const objetivo = texto(dados.objetivo, 500);
  if (!objetivo) throw new ErroDeEntrada("Conte qual imagem você quer transmitir.");
  if (!temFoto && !texto(dados.formatoRosto)) throw new ErroDeEntrada("Escolha o formato do rosto ou envie uma foto.");

  const linhas = [
    "Dados da pessoa:",
    `- Formato do rosto: ${texto(dados.formatoRosto) || "não informado (analise pela foto)"}`,
    `- Tipo de cabelo: ${texto(dados.tipoCabelo) || "não informado (analise pela foto)"}`,
    `- Cor do cabelo: ${texto(dados.corCabelo) || "não informada (analise pela foto)"}`,
    `- Tom de pele: ${texto(dados.tomPele) || "não informado (analise pela foto)"}`,
    `- Cor dos olhos: ${texto(dados.corOlhos) || "não informada (analise pela foto)"}`,
    `- Preferência para a parte de rosto: ${texto(dados.estilo) || "barba e maquiagem"}`,
    "",
    `Objetivo de imagem: ${objetivo}`,
  ].join("\n");

  const conteudo = [];
  if (temFoto) {
    conteudo.push({ type: "image", source: { type: "base64", media_type: foto.tipo, data: foto.base64 } });
  }
  conteudo.push({ type: "text", text: linhas });
  return conteudo;
}

let client;

export async function gerarConsultoria(dados) {
  const conteudo = montarPedido(dados ?? {});
  client ??= new Anthropic();

  const resposta = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: SISTEMA,
    messages: [{ role: "user", content: conteudo }],
  });

  if (resposta.stop_reason === "refusal") {
    throw new Error("A análise não pôde ser feita para este pedido. Tente com outros dados ou outra foto.");
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new Error("A resposta ficou longa demais. Tente de novo.");
  }

  const blocoTexto = resposta.content.filter((b) => b.type === "text").at(-1);
  if (!blocoTexto) throw new Error("A consultoria voltou vazia. Tente de novo.");
  return JSON.parse(blocoTexto.text);
}
