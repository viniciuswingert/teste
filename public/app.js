// ---------- Dados das opções ----------

const ROSTOS = {
  oval: {
    d: "M100 34 C146 34 162 86 160 136 C157 192 130 228 100 228 C70 228 43 192 40 136 C38 86 54 34 100 34 Z",
    dica: "Testa um pouco mais larga que o queixo, contorno suave",
  },
  redondo: {
    d: "M100 44 C152 44 168 92 168 138 C168 190 138 222 100 222 C62 222 32 190 32 138 C32 92 48 44 100 44 Z",
    dica: "Altura e largura parecidas, bochechas cheias",
  },
  quadrado: {
    d: "M100 38 C130 38 152 40 156 48 C160 90 162 140 160 172 C158 206 136 222 100 222 C64 222 42 206 40 172 C38 140 40 90 44 48 C48 40 70 38 100 38 Z",
    dica: "Testa e mandíbula na mesma largura, maxilar marcado",
  },
  retangular: {
    d: "M100 26 C128 26 146 28 150 36 C153 90 154 150 152 186 C150 222 130 238 100 238 C70 238 50 222 48 186 C46 150 47 90 50 36 C54 28 72 26 100 26 Z",
    dica: "Mais comprido que largo, laterais retas",
  },
  "triângulo invertido": {
    d: "M100 36 C140 36 166 40 168 56 C168 108 150 156 132 192 C122 214 112 230 100 230 C88 230 78 214 68 192 C50 156 32 108 32 56 C34 40 60 36 100 36 Z",
    dica: "Testa larga, maxilar estreito, queixo fino",
  },
  "coração": {
    d: "M100 52 C116 34 156 32 162 64 C166 112 150 158 132 192 C122 214 112 232 100 232 C88 232 78 214 68 192 C50 158 34 112 38 64 C44 32 84 34 100 52 Z",
    dica: "Testa larga com bico no centro, queixo pontudo",
  },
};

const CABELOS = {
  liso: "Fios retos, sem volume de onda",
  ondulado: "Forma um “S” leve",
  cacheado: "Cachos definidos em espiral",
  crespo: "Fios bem enrolados, muito volume",
};

const PELES = [
  ["muito clara", "#f6dccb"],
  ["clara", "#ecc4a4"],
  ["clara média", "#dfaa83"],
  ["média (parda clara)", "#c68c62"],
  ["morena", "#a8714a"],
  ["morena escura", "#8a5636"],
  ["escura", "#6b3f26"],
  ["retinta", "#46281a"],
];

const CORES_CABELO = [
  ["preto", "#16110e"],
  ["castanho escuro", "#3b2417"],
  ["castanho claro", "#7a4f2e"],
  ["loiro escuro", "#a78046"],
  ["loiro claro", "#e0c27f"],
  ["ruivo", "#a8461f"],
  ["grisalho", "#9a9590"],
  ["branco", "#e8e4dc"],
];

const CORES_OLHOS = [
  ["castanho escuro", "#2e1c12"],
  ["castanho claro", "#6b4423"],
  ["mel", "#a8752f"],
  ["verde", "#5f8150"],
  ["azul", "#4f7fae"],
  ["cinza", "#8d9399"],
];

const OBJETIVOS = [
  ["👔", "Passar mais autoridade no trabalho"],
  ["🤝", "Parecer mais acessível e simpático"],
  ["⚡", "Transmitir dinamismo e criatividade"],
  ["🎩", "Ter um visual elegante e sofisticado"],
  ["✨", "Parecer mais jovem e moderno"],
  ["💬", "Passar confiança em entrevistas e reuniões"],
];

const FRASES_ESPERA = [
  "Medindo as linhas do rosto…",
  "Lendo o contraste entre pele, cabelo e olhos…",
  "Ligando as formas ao seu objetivo…",
  "Escolhendo o corte que equilibra o rosto…",
  "Testando armações de óculos…",
  "Montando a sua paleta de cores…",
];

// ---------- Estado ----------

const estado = {
  passo: "inicio",
  historico: [],
  foto: null, // { base64, tipo, url }
  formatoRosto: "",
  tipoCabelo: "",
  tomPele: "",
  corCabelo: "",
  corOlhos: "",
  estilo: "barba e maquiagem",
  iaLigada: false, // sem chave da API o site roda no modo demonstração
};

// ---------- Utilidades ----------

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const painel = $("#painel");
const svgNS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") for (const [p, val] of Object.entries(v)) n.style.setProperty(p, val);
    else n.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null) n.append(f instanceof Node ? f : document.createTextNode(f));
  return n;
}

function miniRosto(d) {
  const s = document.createElementNS(svgNS, "svg");
  s.setAttribute("viewBox", "20 15 160 235");
  s.setAttribute("class", "mini-rosto");
  s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(svgNS, "path");
  p.setAttribute("d", d);
  s.append(p);
  return s;
}

// ---------- Espelho ----------

function atualizarEspelho() {
  const rosto = $("#rosto");
  rosto.setAttribute("d", ROSTOS[estado.formatoRosto || "oval"].d);

  const pele = PELES.find(([n]) => n === estado.tomPele)?.[1];
  document.documentElement.style.setProperty("--pele", pele ?? "#d9b49a");

  const corCabelo = CORES_CABELO.find(([n]) => n === estado.corCabelo)?.[1];
  document.documentElement.style.setProperty("--cabelo", corCabelo ?? "#3a2f29");

  const corOlho = CORES_OLHOS.find(([n]) => n === estado.corOlhos)?.[1];
  document.documentElement.style.setProperty("--olho", corOlho ?? "#4a3426");

  $("#cabelo-textura").setAttribute("fill", estado.tipoCabelo ? `url(#tx-${estado.tipoCabelo})` : "transparent");

  const temFoto = Boolean(estado.foto);
  $("#foto-espelho").setAttribute("visibility", temFoto ? "visible" : "hidden");
  $("#foto-espelho").setAttribute("href", temFoto ? estado.foto.url : "");
  $("#desenho").style.opacity = temFoto ? 0 : 1;
  $("#espelho").classList.toggle("vazio", !temFoto && !estado.formatoRosto);

  atualizarTrilha();
}

function atualizarTrilha() {
  const itens = estado.foto
    ? [["Foto", "enviada"]]
    : [
        ["Rosto", estado.formatoRosto],
        ["Cabelo", estado.tipoCabelo],
        ["Pele", estado.tomPele],
        ["Fios", estado.corCabelo],
        ["Olhos", estado.corOlhos],
      ];
  const trilha = $("#trilha");
  trilha.replaceChildren(
    ...itens.map(([rotulo, valor]) =>
      el("li", { class: valor ? "ok" : "" }, el("span", { class: "trilha-rotulo" }, rotulo), el("span", { class: "trilha-valor" }, valor || "—")),
    ),
  );
}

function desenharLinhasGuia(tipo) {
  const g = $("#linhas-guia");
  g.replaceChildren();
  const formas = {
    retas: ["M40 100 L160 100", "M44 150 L156 150", "M52 200 L148 200", "M100 40 L100 225"],
    curvas: ["M40 100 Q100 70 160 100", "M38 150 Q100 185 162 150", "M60 205 Q100 232 140 205"],
    inclinadas: ["M40 80 L160 120", "M40 190 L160 140", "M60 60 L140 225"],
  };
  (formas[tipo] ?? []).forEach((d, i) => {
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", d);
    p.style.animationDelay = `${i * 0.25}s`;
    g.append(p);
  });
}

// ---------- Navegação ----------

function ir(passo, { registrar = true } = {}) {
  if (registrar && estado.passo !== passo) estado.historico.push(estado.passo);
  estado.passo = passo;
  render();
}

function voltar() {
  const anterior = estado.historico.pop();
  if (!anterior) return;
  if (anterior === "inicio") limparPerfil();
  estado.passo = anterior;
  render();
}

function limparPerfil() {
  if (estado.foto) URL.revokeObjectURL(estado.foto.url);
  Object.assign(estado, { foto: null, formatoRosto: "", tipoCabelo: "", tomPele: "", corCabelo: "", corOlhos: "" });
  $("#linhas-guia").replaceChildren();
  atualizarEspelho();
}

function escolher(campo, valor, proximo) {
  estado[campo] = valor;
  atualizarEspelho();
  // Pequena pausa para a pessoa ver o espelho mudar antes de avançar.
  setTimeout(() => ir(proximo), 380);
}

function cabecalho(numero, total, titulo, sub) {
  return el(
    "div",
    { class: "cabecalho" },
    el(
      "div",
      { class: "cabecalho-linha" },
      estado.historico.length ? el("button", { class: "voltar", type: "button", onclick: voltar, "aria-label": "Voltar" }, "← voltar") : null,
      numero ? el("span", { class: "contador" }, `${numero} de ${total}`) : null,
    ),
    el("h1", {}, titulo),
    sub ? el("p", { class: "sub" }, sub) : null,
  );
}

// ---------- Telas ----------

const TELAS = {
  inicio() {
    return [
      el(
        "div",
        { class: "cabecalho" },
        el("p", { class: "selo" }, "Visagismo · Consultoria de imagem"),
        el("h1", { class: "titulo-grande" }, "Seu rosto conta uma história.", el("br"), el("em", {}, "Vamos escolher como ela é contada.")),
        el("p", { class: "sub" }, "Em menos de um minuto você recebe o corte, a barba, os óculos e as cores que combinam com o seu rosto e com o que você quer transmitir."),
      ),
      el(
        "div",
        { class: "grade grade-2" },
        estado.iaLigada
          ? el(
              "button",
              { class: "cartao grande", type: "button", "data-atalho": "1", onclick: () => $("#arquivo-foto").click() },
              el("span", { class: "cartao-icone" }, "📷"),
              el("strong", {}, "Enviar uma foto"),
              el("span", { class: "cartao-dica" }, "A IA lê o seu rosto sozinha. Só 2 cliques."),
            )
          : el(
              "div",
              { class: "cartao grande desligado", "aria-disabled": "true" },
              el("span", { class: "cartao-icone" }, "📷"),
              el("strong", {}, "Análise por foto"),
              el("span", { class: "cartao-dica" }, "Em breve, quando a IA for ligada."),
            ),
        el(
          "button",
          { class: "cartao grande", type: "button", "data-atalho": "2", onclick: () => ir("rosto") },
          el("span", { class: "cartao-icone" }, "✍️"),
          el("strong", {}, "Descrever meu rosto"),
          el("span", { class: "cartao-dica" }, "Sem foto. Você toca nas opções e o espelho se monta."),
        ),
      ),
    ];
  },

  rosto() {
    return [
      cabecalho(1, 5, "Qual formato lembra mais o seu rosto?", "Olhe o contorno do queixo até a testa. Ao tocar, o espelho muda."),
      el(
        "div",
        { class: "grade grade-3" },
        Object.entries(ROSTOS).map(([nome, { d, dica }], i) =>
          el(
            "button",
            { class: `cartao${estado.formatoRosto === nome ? " marcado" : ""}`, type: "button", "data-atalho": String(i + 1), onclick: () => escolher("formatoRosto", nome, "cabelo") },
            miniRosto(d),
            el("strong", {}, nome[0].toUpperCase() + nome.slice(1)),
            el("span", { class: "cartao-dica" }, dica),
          ),
        ),
      ),
    ];
  },

  cabelo() {
    return [
      cabecalho(2, 5, "E o seu cabelo, como é?"),
      el(
        "div",
        { class: "grade grade-4" },
        Object.entries(CABELOS).map(([nome, dica], i) =>
          el(
            "button",
            { class: `cartao${estado.tipoCabelo === nome ? " marcado" : ""}`, type: "button", "data-atalho": String(i + 1), onclick: () => escolher("tipoCabelo", nome, "pele") },
            el("span", { class: `textura textura-${nome}`, "aria-hidden": "true" }),
            el("strong", {}, nome[0].toUpperCase() + nome.slice(1)),
            el("span", { class: "cartao-dica" }, dica),
          ),
        ),
      ),
    ];
  },

  pele() {
    return [
      cabecalho(3, 5, "Toque no tom mais próximo da sua pele."),
      el(
        "div",
        { class: "amostras grandes" },
        PELES.map(([nome, hex], i) =>
          el(
            "button",
            { class: `amostra${estado.tomPele === nome ? " marcado" : ""}`, type: "button", "data-atalho": String(i + 1), style: { "--c": hex }, onclick: () => escolher("tomPele", nome, "contraste") },
            el("span", { class: "bola" }),
            el("span", { class: "amostra-nome" }, nome),
          ),
        ),
      ),
    ];
  },

  contraste() {
    const tentarAvancar = () => {
      if (estado.corCabelo && estado.corOlhos) setTimeout(() => ir("objetivo"), 380);
    };
    const grupo = (titulo, lista, campo) =>
      el(
        "div",
        { class: "grupo" },
        el("h2", {}, titulo),
        el(
          "div",
          { class: "amostras" },
          lista.map(([nome, hex]) =>
            el(
              "button",
              {
                class: `amostra${estado[campo] === nome ? " marcado" : ""}`,
                type: "button",
                style: { "--c": hex },
                onclick: (e) => {
                  estado[campo] = nome;
                  e.currentTarget.parentElement.querySelectorAll(".amostra").forEach((b) => b.classList.toggle("marcado", b === e.currentTarget));
                  atualizarEspelho();
                  tentarAvancar();
                },
              },
              el("span", { class: "bola" }),
              el("span", { class: "amostra-nome" }, nome),
            ),
          ),
        ),
      );
    return [
      cabecalho(4, 5, "Agora as cores dos fios e dos olhos.", "Isso mostra o seu contraste pessoal, que define a sua paleta de cores."),
      grupo("Cor do cabelo", CORES_CABELO, "corCabelo"),
      grupo("Cor dos olhos", CORES_OLHOS, "corOlhos"),
    ];
  },

  objetivo() {
    const campo = el("textarea", { id: "objetivo-livre", rows: "2", maxlength: "500", placeholder: "Ou escreva do seu jeito… (Enter para enviar)" });
    campo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (campo.value.trim()) enviar(campo.value.trim());
      }
    });

    const opcoesEstilo = [
      ["barba", "Barba"],
      ["maquiagem", "Maquiagem"],
      ["barba e maquiagem", "Os dois"],
    ];
    const estilo = el(
      "div",
      { class: "alternador", role: "radiogroup", "aria-label": "Incluir dicas de" },
      el("span", { class: "alternador-rotulo" }, "Dicas de:"),
      opcoesEstilo.map(([valor, rotulo]) =>
        el(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": String(estado.estilo === valor),
            class: estado.estilo === valor ? "ativo" : "",
            onclick: (e) => {
              estado.estilo = valor;
              e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => {
                const ativo = b === e.currentTarget;
                b.classList.toggle("ativo", ativo);
                b.setAttribute("aria-checked", String(ativo));
              });
            },
          },
          rotulo,
        ),
      ),
    );

    return [
      cabecalho(estado.foto ? 2 : 5, estado.foto ? 2 : 5, "O que você quer transmitir?", "Toque em uma opção e a consultoria começa na hora."),
      estilo,
      el(
        "div",
        { class: "grade grade-2 objetivos" },
        OBJETIVOS.map(([icone, texto], i) =>
          el(
            "button",
            { class: "cartao linha", type: "button", "data-atalho": String(i + 1), onclick: () => enviar(texto) },
            el("span", { class: "cartao-icone pequeno" }, icone),
            el("strong", {}, texto),
          ),
        ),
      ),
      el("div", { class: "livre" }, campo, el("button", { class: "botao", type: "button", onclick: () => campo.value.trim() && enviar(campo.value.trim()) }, "Analisar →")),
    ];
  },

  carregando() {
    const frase = el("p", { class: "frase-espera" }, FRASES_ESPERA[0]);
    let i = 0;
    const timer = setInterval(() => {
      if (!frase.isConnected) return clearInterval(timer);
      i = (i + 1) % FRASES_ESPERA.length;
      frase.classList.remove("entra");
      void frase.offsetWidth;
      frase.textContent = FRASES_ESPERA[i];
      frase.classList.add("entra");
    }, 2600);
    return [
      el(
        "div",
        { class: "espera" },
        el("div", { class: "tesoura", "aria-hidden": "true" }, "✂"),
        el("h1", {}, "Analisando o seu rosto"),
        frase,
        el("p", { class: "sub" }, "Isso leva cerca de meio minuto."),
      ),
    ];
  },

  erro() {
    return [
      el(
        "div",
        { class: "espera" },
        el("div", { class: "cartao-icone" }, "⚠️"),
        el("h1", {}, "Não deu certo desta vez"),
        el("p", { class: "sub" }, estado.mensagemErro),
        el("button", { class: "botao", type: "button", onclick: () => enviar(estado.ultimoObjetivo) }, "Tentar de novo"),
        el("button", { class: "botao fantasma", type: "button", onclick: () => ir("objetivo", { registrar: false }) }, "Mudar o objetivo"),
      ),
    ];
  },

  resultado() {
    return renderResultado(estado.resultado);
  },
};

function render() {
  painel.classList.remove("entra");
  void painel.offsetWidth;
  painel.replaceChildren(...TELAS[estado.passo]());
  painel.classList.add("entra");
  painel.dataset.passo = estado.passo;
  document.body.dataset.passo = estado.passo;
  const foco = painel.querySelector("h1");
  if (foco && estado.historico.length) {
    foco.setAttribute("tabindex", "-1");
    foco.focus({ preventScroll: true });
  }
  if (window.innerWidth < 900 && estado.historico.length) painel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Foto ----------

async function prepararFoto(arquivo) {
  // Reduz a foto para no máximo 1024px: envia mais rápido e gasta menos.
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.86));
  const base64 = await new Promise((ok) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result).split(",")[1]);
    leitor.readAsDataURL(blob);
  });
  return { base64, tipo: "image/jpeg", url: URL.createObjectURL(blob) };
}

$("#arquivo-foto").addEventListener("change", async (e) => {
  const arquivo = e.target.files?.[0];
  e.target.value = "";
  if (!arquivo) return;
  try {
    limparPerfil();
    estado.foto = await prepararFoto(arquivo);
    atualizarEspelho();
    ir("objetivo");
  } catch {
    alert("Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.");
  }
});

// ---------- Envio ----------

async function enviar(objetivo) {
  estado.ultimoObjetivo = objetivo;
  ir("carregando", { registrar: false });
  document.body.classList.add("analisando");

  const corpo = {
    objetivo,
    estilo: estado.estilo,
    formatoRosto: estado.formatoRosto,
    tipoCabelo: estado.tipoCabelo,
    tomPele: estado.tomPele,
    corCabelo: estado.corCabelo,
    corOlhos: estado.corOlhos,
    hexPele: PELES.find(([n]) => n === estado.tomPele)?.[1],
    foto: estado.foto ? { base64: estado.foto.base64, tipo: estado.foto.tipo } : null,
  };

  try {
    const resp = await fetch("/api/consultoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(dados.erro || "O servidor não respondeu como esperado.");
    estado.resultado = dados;
    if (!estado.foto) {
      estado.formatoRosto = dados.diagnostico.formato_rosto in ROSTOS ? dados.diagnostico.formato_rosto : estado.formatoRosto;
      atualizarEspelho();
    }
    desenharLinhasGuia(dados.diagnostico.linhas_predominantes);
    ir("resultado", { registrar: false });
  } catch (erro) {
    estado.mensagemErro = erro.message || "Verifique a sua conexão e tente de novo.";
    ir("erro", { registrar: false });
  } finally {
    document.body.classList.remove("analisando");
  }
}

// ---------- Resultado ----------

const ROTULO_LINHAS = {
  retas: "Linhas retas · força e autoridade",
  curvas: "Linhas curvas · acessibilidade e suavidade",
  inclinadas: "Linhas inclinadas · dinamismo",
};

function blocoItens(titulo, icone, itens) {
  if (!itens?.length) return null;
  return el(
    "article",
    { class: "bloco" },
    el("h3", {}, el("span", { class: "bloco-icone", "aria-hidden": "true" }, icone), titulo),
    el(
      "ul",
      { class: "itens" },
      itens.map((it) => el("li", {}, el("strong", {}, it.recomendacao), el("p", {}, it.justificativa))),
    ),
  );
}

function blocoCores(titulo, cores, classe = "") {
  if (!cores?.length) return null;
  const hexValido = (h) => (/^#[0-9a-f]{6}$/i.test(h) ? h : "#888888");
  return el(
    "div",
    { class: `cores ${classe}` },
    el("h4", {}, titulo),
    el(
      "ul",
      { class: "cores-lista" },
      cores.map((c) =>
        el(
          "li",
          {},
          el("span", { class: "cor-bola", style: { background: hexValido(c.hex) }, "aria-hidden": "true" }),
          el("div", {}, el("strong", {}, c.nome), el("p", {}, c.justificativa)),
        ),
      ),
    ),
  );
}

function renderResultado(r) {
  const d = r.diagnostico;
  const rostoTitulo = el("h3", {}, el("span", { class: "bloco-icone", "aria-hidden": "true" }, "👓"), "Rosto e acessórios");
  const sub = (titulo, itens) =>
    itens?.length
      ? el(
          "div",
          { class: "subbloco" },
          el("h4", {}, titulo),
          el("ul", { class: "itens" }, itens.map((it) => el("li", {}, el("strong", {}, it.recomendacao), el("p", {}, it.justificativa)))),
        )
      : null;
  const tituloBarba = estado.estilo === "barba" ? "Barba" : estado.estilo === "maquiagem" ? "Maquiagem" : "Barba ou maquiagem";

  return [
    el(
      "div",
      { class: "cabecalho" },
      el("p", { class: "selo" }, r.modo === "regras" ? "Sua consultoria · modo demonstração" : "Sua consultoria · análise por IA"),
      el("h1", {}, "Diagnóstico"),
    ),
    el(
      "article",
      { class: "bloco destaque" },
      el(
        "div",
        { class: "etiquetas" },
        el("span", { class: "etiqueta" }, `Rosto ${d.formato_rosto}`),
        el("span", { class: "etiqueta" }, ROTULO_LINHAS[d.linhas_predominantes] ?? d.linhas_predominantes),
        el("span", { class: "etiqueta" }, `Contraste ${d.contraste_pessoal}`),
      ),
      el("p", { class: "resumo" }, d.resumo),
    ),
    blocoItens("Cabelo", "✂️", r.cabelo),
    el(
      "article",
      { class: "bloco" },
      rostoTitulo,
      sub("Óculos", r.rosto_acessorios.oculos),
      sub("Sobrancelha", r.rosto_acessorios.sobrancelha),
      sub(tituloBarba, r.rosto_acessorios.barba_ou_maquiagem),
    ),
    el(
      "article",
      { class: "bloco" },
      el("h3", {}, el("span", { class: "bloco-icone", "aria-hidden": "true" }, "🎨"), "Cores perto do rosto"),
      el("div", { class: "faixa-paleta", "aria-hidden": "true" }, (r.cores.paleta ?? []).map((c) => el("span", { style: { background: /^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#888" } }))),
      blocoCores("Use", r.cores.paleta),
      blocoCores("Evite", r.cores.evitar, "evitar"),
    ),
    el(
      "div",
      { class: "acoes" },
      el("button", { class: "botao", type: "button", onclick: () => window.print() }, "Imprimir / salvar PDF"),
      el(
        "button",
        {
          class: "botao fantasma",
          type: "button",
          onclick: () => {
            estado.historico = [];
            limparPerfil();
            ir("inicio", { registrar: false });
          },
        },
        "Nova consulta",
      ),
    ),
  ];
}

// ---------- Atalhos de teclado: números escolhem a opção ----------

document.addEventListener("keydown", (e) => {
  if (e.target.matches("textarea, input") || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-9]$/.test(e.key)) painel.querySelector(`[data-atalho="${e.key}"]`)?.click();
  if (e.key === "Backspace" || e.key === "Escape") voltar();
});

// ---------- Início ----------

atualizarEspelho();
render();

// Descobre se a IA está ligada; se estiver, libera a análise por foto.
fetch("/api/modo")
  .then((r) => r.json())
  .then(({ ia }) => {
    estado.iaLigada = Boolean(ia);
    if (estado.iaLigada && estado.passo === "inicio") render();
  })
  .catch(() => {});
