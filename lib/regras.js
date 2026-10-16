// Modo demonstração: aplica as regras do prompt de visagismo sem usar IA.
// Devolve exatamente o mesmo formato de resposta que o Claude devolve.

import { ErroDeEntrada } from "./erros.js";

// ---------- Tabelas de referência ----------

// Linhas predominantes de cada formato de rosto.
const LINHAS_DO_ROSTO = {
  oval: "curvas",
  redondo: "curvas",
  quadrado: "retas",
  retangular: "retas",
  "triângulo invertido": "inclinadas",
  "coração": "inclinadas",
};

// Claridade de 0 (escuro) a 10 (claro), usada para medir o contraste pessoal.
const CLARIDADE_PELE = {
  "muito clara": 9.5, clara: 8.5, "clara média": 7.5, "média (parda clara)": 6.5,
  morena: 5.5, "morena escura": 4.5, escura: 3, retinta: 1.5,
};
const CLARIDADE_CABELO = {
  preto: 0.5, "castanho escuro": 1.5, "castanho claro": 4, "loiro escuro": 5.5,
  "loiro claro": 8, ruivo: 4.5, grisalho: 6.5, branco: 9.5,
};
const CLARIDADE_OLHOS = {
  "castanho escuro": 1, "castanho claro": 3, mel: 4.5, verde: 5, azul: 6, cinza: 6.5,
};

// Objetivos e a linha que cada um pede, segundo a psicologia da imagem do prompt.
const OBJETIVOS = {
  autoridade: { linha: "retas", palavras: ["autoridade", "líder", "lider", "respeito", "poder", "chefe", "firme", "sério", "serio"], frase: "autoridade" },
  acessivel: { linha: "curvas", palavras: ["acessível", "acessivel", "simpát", "simpat", "amig", "próximo", "proximo", "leve", "suave", "gentil"], frase: "acessibilidade e simpatia" },
  dinamismo: { linha: "inclinadas", palavras: ["dinam", "criativ", "ousad", "energia", "inovador", "moderno e criativo"], frase: "dinamismo e criatividade" },
  elegancia: { linha: "retas", palavras: ["elegan", "sofistic", "clássic", "classic", "refinad", "chique"], frase: "elegância e sofisticação" },
  jovem: { linha: "inclinadas", palavras: ["jovem", "jovial", "modern", "atual", "descontra"], frase: "jovialidade e modernidade" },
  confianca: { linha: "retas", palavras: ["confian", "credib", "entrevista", "reuni", "profission", "segur"], frase: "confiança e credibilidade" },
};

const SIGNIFICADO_LINHA = {
  retas: "força e autoridade",
  curvas: "acessibilidade e suavidade",
  inclinadas: "dinamismo",
};

// ---------- Leitura dos dados ----------

function identificarObjetivo(texto) {
  const t = texto.toLowerCase();
  let melhor = null;
  let pontos = 0;
  for (const [chave, obj] of Object.entries(OBJETIVOS)) {
    const p = obj.palavras.filter((w) => t.includes(w)).length;
    if (p > pontos) [melhor, pontos] = [chave, p];
  }
  return melhor ?? "confianca";
}

function medirContraste(pele, cabelo, olhos) {
  const p = CLARIDADE_PELE[pele];
  const diferencas = [CLARIDADE_CABELO[cabelo], CLARIDADE_OLHOS[olhos]]
    .filter((v) => v !== undefined)
    .map((v) => Math.abs(p - v));
  const maior = Math.max(...diferencas);
  if (maior >= 6) return "alto";
  if (maior >= 3) return "médio";
  return "baixo";
}

const item = (recomendacao, justificativa) => ({ recomendacao, justificativa });

// ---------- Cabelo ----------

const CABELO_POR_ROSTO = {
  oval: item(
    "Corte de comprimento médio, com volume distribuído de forma equilibrada",
    "O rosto oval já tem proporções equilibradas, então o corte não precisa compensar nada: o foco fica em reforçar a mensagem que você quer passar.",
  ),
  redondo: item(
    "Laterais mais curtas e volume concentrado no topo",
    "O rosto redondo é dominado por curvas e tem largura parecida com a altura. Tirar volume das laterais e subir o volume para o topo cria uma linha vertical que alonga o rosto.",
  ),
  quadrado: item(
    "Topo com camadas e movimento, laterais sem volume rente à mandíbula",
    "O maxilar marcado do rosto quadrado já traz linhas retas fortes. Camadas no topo desviam o olhar para cima e evitam que o corte fique \"duro\" demais ao repetir os ângulos da mandíbula.",
  ),
  retangular: item(
    "Pouca altura no topo e um pouco mais de volume nas laterais",
    "O rosto retangular é comprido e tem laterais retas. Evitar altura no topo e dar volume lateral faz o rosto parecer mais largo e menos alongado.",
  ),
  "triângulo invertido": item(
    "Topo baixo, sem volume na altura das têmporas, com comprimento ou volume perto do maxilar",
    "A testa larga e o queixo fino formam linhas inclinadas que convergem para baixo. Diminuir o volume em cima e levar volume para a parte de baixo equilibra a largura entre testa e queixo.",
  ),
  "coração": item(
    "Franja leve ou mecha lateral sobre a testa, com volume na altura do queixo",
    "A testa larga com bico no centro e o queixo pontudo criam linhas inclinadas. A franja suaviza a largura da testa e o volume embaixo compensa o queixo estreito.",
  ),
};

const ACABAMENTO_POR_LINHA = {
  retas: item(
    "Acabamento alinhado: risca lateral bem marcada, contornos limpos e pouca bagunça nos fios",
    "Linhas retas e definidas no cabelo transmitem força e autoridade, como pede o seu objetivo.",
  ),
  curvas: item(
    "Acabamento solto: pontas texturizadas, camadas arredondadas e movimento natural",
    "Formas curvas e macias no cabelo transmitem acessibilidade e suavidade, aproximando você das pessoas.",
  ),
  inclinadas: item(
    "Acabamento com direção: topete ou franja assimétrica, risca diagonal ou degradê marcado",
    "Linhas inclinadas e assimetria dão sensação de movimento, transmitindo o dinamismo que você busca.",
  ),
};

const TEXTURA = {
  liso: item(
    "Use pomada ou cera de efeito seco para dar corpo aos fios lisos",
    "O fio liso tende a assentar e perder a forma do corte. Um produto de fixação leve mantém a linha planejada ao longo do dia.",
  ),
  ondulado: item(
    "Valorize a onda natural com creme leve, sem alisar",
    "As ondas já criam curvas suaves. Bem definidas, elas dão movimento sem precisar de muito volume extra.",
  ),
  cacheado: item(
    "Mantenha o volume dos cachos controlado, com definição feita fio a fio",
    "Os cachos acrescentam curvas e volume. Controlar onde o volume fica (topo ou laterais) é o que mantém o equilíbrio do formato do rosto.",
  ),
  crespo: item(
    "Aposte em formas desenhadas, com contorno bem definido e degradê nas laterais",
    "O fio crespo permite esculpir formas com precisão. O desenho do contorno é o que leva a linha do seu objetivo para o visual.",
  ),
};

// ---------- Óculos ----------

const OCULOS_POR_ROSTO = {
  oval: ["Armação retangular de cantos suaves ou modelo clubmaster", "O rosto oval aceita quase todos os formatos, então a armação pode ser escolhida pelo objetivo."],
  redondo: ["Armação retangular ou quadrada", "Os ângulos da armação contrastam com as curvas do rosto redondo, trazendo estrutura e alongando a face."],
  quadrado: ["Armação redonda ou oval", "As curvas da armação suavizam os ângulos da mandíbula e equilibram as linhas retas fortes do rosto quadrado."],
  retangular: ["Armação grande com hastes mais altas e boa altura de lente (aviador ou quadrada larga)", "Uma armação mais alta ocupa o centro do rosto e reduz a sensação de comprimento do rosto retangular."],
  "triângulo invertido": ["Armação mais larga embaixo ou sem aro na parte de cima (meio-aro invertido, gatinho suave, aviador)", "Levar peso visual para a parte de baixo da armação compensa a testa larga e o queixo fino."],
  "coração": ["Armação leve, de aro fino, redonda ou oval", "Armações leves não pesam na parte de cima do rosto, que já é mais larga, e as curvas equilibram o queixo pontudo."],
};

const ESPESSURA_POR_CONTRASTE = {
  alto: ["Aro grosso e cor escura, como preto ou tartaruga escuro", "Com contraste pessoal alto, o rosto sustenta armações marcantes, que acompanham a força natural das suas cores."],
  médio: ["Aro de espessura média, em tartaruga, grafite ou azul-marinho", "O contraste médio pede armações com presença, mas sem pesar nem apagar o rosto."],
  baixo: ["Aro fino, em metal dourado, bronze ou acetato translúcido", "Com contraste pessoal baixo, armações grossas e escuras dominariam o rosto. Aros finos e tons próximos da sua cor mantêm a harmonia."],
};

const OCULOS_POR_LINHA = {
  retas: "Prefira versões de cantos retos dessa armação para reforçar a autoridade.",
  curvas: "Prefira versões de cantos arredondados dessa armação para reforçar a acessibilidade.",
  inclinadas: "Prefira versões com a parte de cima levemente puxada para fora (estilo gatinho ou aviador) para reforçar o dinamismo.",
};

// ---------- Sobrancelha ----------

const SOBRANCELHA_POR_ROSTO = {
  oval: "Mantenha o desenho natural, só limpando os fios fora da linha",
  redondo: "Arco mais alto e levemente anguloso",
  quadrado: "Arco suave e arredondado",
  retangular: "Desenho mais reto e horizontal",
  "triângulo invertido": "Arco suave, sem pontas muito altas",
  "coração": "Arco baixo e arredondado",
};

const SOBRANCELHA_JUSTIFICATIVA = {
  oval: "O rosto oval já é equilibrado, então a sobrancelha natural preserva essa harmonia.",
  redondo: "Um arco alto e anguloso cria linhas verticais e ângulos que alongam o rosto redondo.",
  quadrado: "O arco curvo suaviza a moldura de linhas retas do rosto quadrado.",
  retangular: "A linha horizontal \"corta\" o comprimento do rosto retangular, deixando-o mais proporcional.",
  "triângulo invertido": "Arcos altos aumentariam a largura da testa. O arco suave não chama atenção para a parte de cima.",
  "coração": "O arco baixo e arredondado equilibra a largura da testa e suaviza as linhas inclinadas.",
};

const SOBRANCELHA_POR_LINHA = {
  retas: ["Mantenha os fios bem alinhados e o desenho definido", "Contornos nítidos e alinhados reforçam a leitura de firmeza e autoridade."],
  curvas: ["Deixe os fios com aparência natural, sem contorno rígido", "Um desenho mais macio deixa a expressão aberta e acessível."],
  inclinadas: ["Puxe levemente a cauda da sobrancelha para cima", "A cauda ascendente cria uma linha inclinada que deixa a expressão mais dinâmica."],
};

// ---------- Barba ----------

const BARBA_POR_ROSTO = {
  oval: ["Barba de comprimento curto a médio, acompanhando o contorno natural", "No rosto oval a barba não precisa corrigir o formato, apenas acompanhar o contorno já equilibrado."],
  redondo: ["Laterais curtas e mais comprimento no queixo (estilo cavanhaque estendido ou barba em \"V\")", "Mais volume no queixo e pouco nas laterais cria uma linha vertical que alonga o rosto redondo."],
  quadrado: ["Barba que arredonda o queixo, sem volume nos cantos da mandíbula", "Arredondar a base da barba suaviza os ângulos fortes do maxilar quadrado."],
  retangular: ["Laterais mais cheias e queixo curto", "Volume nas laterais alarga o rosto; manter o queixo curto evita alongar ainda mais o rosto retangular."],
  "triângulo invertido": ["Barba cheia no queixo e ao longo do maxilar", "O volume na parte de baixo compensa o queixo fino e equilibra a testa larga."],
  "coração": ["Barba média e cheia na parte de baixo do rosto", "Dar peso visual ao queixo pontudo equilibra a largura da testa."],
};

const BARBA_POR_LINHA = {
  retas: ["Contornos marcados com navalha: linha da bochecha e do pescoço retas", "Linhas retas e bem definidas na barba reforçam autoridade e firmeza."],
  curvas: ["Contornos naturais e arredondados, com a barba macia e bem hidratada", "Bordas suaves e arredondadas deixam a imagem mais acessível e próxima."],
  inclinadas: ["Desenho com degradê das costeletas para a barba e linha da bochecha levemente diagonal", "A transição em degradê e a linha diagonal trazem movimento e dinamismo."],
};

// ---------- Maquiagem ----------

const MAQUIAGEM_POR_ROSTO = {
  oval: ["Iluminador no alto das maçãs e contorno bem leve", "O rosto oval é equilibrado: basta valorizar os pontos altos, sem corrigir o formato."],
  redondo: ["Contorno suave nas laterais do rosto, abaixo das maçãs, em direção vertical", "A sombra lateral reduz a largura e cria linhas verticais que alongam o rosto redondo."],
  quadrado: ["Contorno suave nos cantos da mandíbula e blush arredondado nas maçãs", "Sombrear os cantos do maxilar suaviza as linhas retas, e o blush redondo traz curvas."],
  retangular: ["Contorno no alto da testa e na ponta do queixo, blush na horizontal", "Sombrear em cima e embaixo encurta o rosto; o blush horizontal dá largura."],
  "triângulo invertido": ["Contorno nas laterais da testa e iluminador no queixo", "Diminuir a testa e iluminar o queixo equilibra a parte de cima com a de baixo."],
  "coração": ["Contorno nas têmporas e iluminador no centro do queixo", "Suavizar a parte larga da testa e dar luz ao queixo equilibra as linhas inclinadas."],
};

const MAQUIAGEM_POR_LINHA = {
  retas: ["Delineado reto e fino, batom em tom fechado com contorno definido", "Traços retos e bem desenhados transmitem autoridade e segurança."],
  curvas: ["Olhos esfumados em tons quentes e batom de acabamento cremoso", "Traços esfumados e arredondados suavizam a expressão e transmitem acessibilidade."],
  inclinadas: ["Delineado gatinho, puxado para cima", "A linha inclinada no olhar traz movimento e dinamismo à expressão."],
};

const MAQUIAGEM_POR_CONTRASTE = {
  alto: "Cores intensas de batom e delineado preto funcionam bem, pois acompanham o seu contraste alto.",
  médio: "Prefira intensidade média: batom em tons de frutas vermelhas, rosados ou terrosos e delineado marrom ou grafite.",
  baixo: "Prefira tons próximos da sua cor natural: nude, pêssego e marrom suave, evitando preto e batons muito escuros.",
};

// ---------- Cores ----------

// A primeira cor de cada lista explica a regra do contraste; as outras, o seu papel.
const PALETA_POR_CONTRASTE = {
  alto: [
    ["Azul-marinho profundo", "#1b2a4a", "Seu contraste pessoal é alto (grande diferença entre pele, cabelo e olhos). Cores intensas, como este marinho, acompanham essa força natural."],
    ["Branco puro", "#fafafa", "Combinado com tons escuros, repete perto do rosto o mesmo claro-escuro que já existe nas suas cores."],
    ["Vinho", "#5e1a2a", "Um tom profundo e quente que dá presença sem perder a sobriedade."],
    ["Verde-esmeralda", "#0f6b4f", "Cor saturada que o contraste alto sustenta bem, sem apagar o rosto."],
  ],
  médio: [
    ["Azul petróleo", "#1f5662", "Seu contraste pessoal é médio. Tons de profundidade média, como este, ficam em harmonia sem apagar nem pesar o rosto."],
    ["Verde-oliva", "#5b6131", "Um neutro com cor, fácil de combinar e na mesma intensidade das suas cores naturais."],
    ["Bordô", "#6d2333", "Dá profundidade perto do rosto sem o contraste extremo do preto."],
    ["Off-white", "#efe9dc", "Um claro mais suave que o branco puro, na medida do seu contraste."],
  ],
  baixo: [
    ["Caramelo", "#b07a45", "Seu contraste pessoal é baixo (as cores do rosto são próximas entre si). Tons suaves e próximos, como este, mantêm a harmonia e não \"engolem\" o rosto."],
    ["Azul acinzentado", "#7d8fa3", "Um azul apagado que traz cor sem criar um contraste forte demais."],
    ["Verde sálvia", "#9aab8e", "Tom suave e natural, na mesma intensidade das suas cores."],
    ["Areia", "#d6c6a8", "Um claro quente e delicado, alternativa ao branco para usar perto do rosto."],
  ],
};

const ACENTO_POR_OBJETIVO = {
  autoridade: ["Cinza-chumbo", "#3a3d42", "Tons escuros e neutros perto do rosto são lidos como seriedade e autoridade."],
  acessivel: ["Azul-claro", "#9cc3e0", "Tons claros e frios perto do rosto transmitem calma e deixam a pessoa mais acessível."],
  dinamismo: ["Laranja queimado", "#c4602b", "Uma cor quente e vibrante perto do rosto chama atenção e transmite energia e dinamismo."],
  elegancia: ["Camelo", "#a8804f", "O camelo é um clássico do vestuário sofisticado e cria um visual elegante sem esforço."],
  jovem: ["Verde-água", "#5fb3a6", "Cores frescas e vivas perto do rosto passam uma imagem mais jovem e moderna."],
  confianca: ["Azul médio", "#2f5d8c", "O azul é associado à confiança e à credibilidade, ideal para entrevistas e reuniões."],
};

const EVITAR_POR_CONTRASTE = {
  alto: [["Tons pastel muito apagados", "#e6dfe8", "Com contraste alto, cores muito apagadas perto do rosto ficam \"lavadas\" e tiram a força do seu visual."]],
  médio: [["Cores neon", "#d4ff1f", "Cores fluorescentes competem com o rosto em quem tem contraste médio e chamam mais atenção que você."]],
  baixo: [["Preto puro com branco óptico", "#0a0a0a", "Com contraste baixo, a combinação preto e branco é forte demais e domina o rosto."]],
};

// ---------- Montagem ----------

export function gerarPorRegras(dados = {}) {
  const formato = String(dados.formatoRosto ?? "").trim();
  if (!LINHAS_DO_ROSTO[formato]) {
    throw new ErroDeEntrada(
      dados.foto?.base64
        ? "A análise por foto precisa da IA ligada. Por enquanto, descreva o rosto tocando nas opções."
        : "Escolha o formato do rosto.",
    );
  }
  const pele = String(dados.tomPele ?? "");
  const cabelo = String(dados.corCabelo ?? "");
  const olhos = String(dados.corOlhos ?? "");
  const tipoCabelo = String(dados.tipoCabelo ?? "");
  if (!(pele in CLARIDADE_PELE) || !(cabelo in CLARIDADE_CABELO) || !(olhos in CLARIDADE_OLHOS) || !(tipoCabelo in TEXTURA)) {
    throw new ErroDeEntrada("Faltou escolher alguma das opções. Volte e confira as etapas.");
  }

  const objetivoTexto = String(dados.objetivo ?? "").trim();
  const chaveObjetivo = identificarObjetivo(objetivoTexto);
  const objetivo = OBJETIVOS[chaveObjetivo];
  const linhaRosto = LINHAS_DO_ROSTO[formato];
  const linhaObjetivo = objetivo.linha;
  const contraste = medirContraste(pele, cabelo, olhos);
  const estilo = String(dados.estilo ?? "barba e maquiagem");

  const relacao =
    linhaRosto === linhaObjetivo
      ? `As linhas ${linhaRosto} do seu rosto já transmitem ${SIGNIFICADO_LINHA[linhaRosto]}, o que joga a favor do seu objetivo. As recomendações reforçam essa leitura.`
      : `As linhas ${linhaRosto} do seu rosto transmitem naturalmente ${SIGNIFICADO_LINHA[linhaRosto]}. Para chegar a ${objetivo.frase}, as recomendações acrescentam linhas ${linhaObjetivo} no cabelo, nos acessórios e no desenho do rosto.`;

  const resumo =
    `Rosto ${formato}, com linhas predominantemente ${linhaRosto}. ` +
    `Pele ${pele}, cabelo ${cabelo} e olhos em tom ${olhos} formam um contraste pessoal ${contraste}. ` +
    relacao;

  // Rosto e acessórios
  const [oculosModelo, oculosMotivo] = OCULOS_POR_ROSTO[formato];
  const [espessura, espessuraMotivo] = ESPESSURA_POR_CONTRASTE[contraste];
  const oculos = [
    item(oculosModelo, `${oculosMotivo} ${OCULOS_POR_LINHA[linhaObjetivo]}`),
    item(espessura, espessuraMotivo),
  ];

  const sobrancelha = [
    item(SOBRANCELHA_POR_ROSTO[formato], SOBRANCELHA_JUSTIFICATIVA[formato]),
    item(...SOBRANCELHA_POR_LINHA[linhaObjetivo]),
  ];

  const barbaOuMaquiagem = [];
  if (estilo.includes("barba")) {
    barbaOuMaquiagem.push(item(...BARBA_POR_ROSTO[formato]));
    barbaOuMaquiagem.push(item(...BARBA_POR_LINHA[linhaObjetivo]));
  }
  if (estilo.includes("maquiagem")) {
    barbaOuMaquiagem.push(item(...MAQUIAGEM_POR_ROSTO[formato]));
    const [traco, tracoMotivo] = MAQUIAGEM_POR_LINHA[linhaObjetivo];
    barbaOuMaquiagem.push(item(traco, `${tracoMotivo} ${MAQUIAGEM_POR_CONTRASTE[contraste]}`));
  }

  // Cores
  const [acentoNome, acentoHex, acentoMotivo] = ACENTO_POR_OBJETIVO[chaveObjetivo];
  const paleta = [
    ...PALETA_POR_CONTRASTE[contraste].map(([nome, hex, justificativa]) => ({ nome, hex, justificativa })),
    { nome: acentoNome, hex: acentoHex, justificativa: acentoMotivo },
  ];
  const evitar = [
    ...EVITAR_POR_CONTRASTE[contraste].map(([nome, hex, justificativa]) => ({ nome, hex, justificativa })),
    {
      nome: "Tons iguais ao da sua pele",
      hex: dados.hexPele && /^#[0-9a-f]{6}$/i.test(dados.hexPele) ? dados.hexPele : "#c69a74",
      justificativa: "Roupas da mesma cor da pele, perto do rosto, apagam o contorno e deixam a imagem sem definição.",
    },
  ];

  return {
    diagnostico: { formato_rosto: formato, linhas_predominantes: linhaRosto, contraste_pessoal: contraste, resumo },
    cabelo: [CABELO_POR_ROSTO[formato], ACABAMENTO_POR_LINHA[linhaObjetivo], TEXTURA[tipoCabelo]],
    rosto_acessorios: { oculos, sobrancelha, barba_ou_maquiagem: barbaOuMaquiagem },
    cores: { paleta, evitar },
  };
}
