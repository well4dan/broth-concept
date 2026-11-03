/**
 * Store Engine, Catalogo, Sacola, Frete, Conta, Pedidos e ERP - Broth Concept
 * Persistencia em localStorage com sincronizacao em tempo real via BroadcastChannel.
 */

import { onlyDigits, uid } from './core.js';

const STORAGE_KEY = 'broth_concept_state_v3';
const CHANNEL_NAME = 'broth_concept_channel_v3';

const SEED_DATA = {
  settings: {
    storeName: 'Broth Concept',
    tagline: 'Moda by Creative BROTHers',
    razaoSocial: 'Broth Concept Atelier e Confeccao Ltda.',
    cnpj: '48.712.904/0001-63',
    ie: '908.44120-18',
    address: 'R. Ibipora, 720 - Aurora, Londrina - PR, 86060-510',
    space: '@casacriou',
    whatsapp: '5543988341414',
    whatsappLabel: '+55 (43) 98834-1414',
    email: 'atelier@brothconcept.com.br',
    instagram: 'https://www.instagram.com/brothconcept/',
    hours: 'Seg a Sex, 10h as 18h | Sab, 10h as 14h (atelier com hora marcada)',
    freeShippingMin: 900,
    pixDiscount: 5,
    maxInstallments: 10,
    minInstallment: 80,
    cashbackPercent: 5,
    originCep: '86060510',
    adminPinHash: 'c2719b62c903791bdefc5a6a99df04d4339de491bbd2a07910035337a9a76a45'
  },
  categories: [
    {
      slug: 'palco',
      name: 'Palco & Glam',
      lead: 'Figurinos para shows, turnes e clipes. Pecas que reagem a luz e sustentam o movimento.',
      image: '/assets/img/campanha/cat-palco.webp',
      subs: [
        { slug: 'tops', name: 'Tops & Bodies' },
        { slug: 'casacos', name: 'Casacos Estruturados' },
        { slug: 'coletes', name: 'Coletes' }
      ]
    },
    {
      slug: 'alfaiataria',
      name: 'Alfaiataria',
      lead: 'Cortes precisos sem genero. Wide-leg, pantalonas, coletes e correntes.',
      image: '/assets/img/campanha/cat-alfaiataria.webp',
      subs: [
        { slug: 'conjuntos', name: 'Conjuntos' },
        { slug: 'calcas', name: 'Calcas & Pantalonas' },
        { slug: 'looks', name: 'Looks Completos' }
      ]
    },
    {
      slug: 'renda-e-mesh',
      name: 'Renda & Mesh',
      lead: 'Guipure, transparencias e malhas metalicas para noites intensas.',
      image: '/assets/img/campanha/cat-renda.webp',
      subs: [
        { slug: 'camisas', name: 'Camisas' },
        { slug: 'croppeds', name: 'Croppeds & Jaquetas' }
      ]
    },
    {
      slug: 'sob-medida',
      name: 'Sob Medida',
      lead: 'Pecas unicas criadas a partir das suas medidas, da sua turne ou do seu clipe.',
      image: '/assets/img/campanha/sob-medida.webp',
      subs: [
        { slug: 'figurinos', name: 'Figurinos de Palco' },
        { slug: 'editorial', name: 'Clipes & Editoriais' }
      ]
    }
  ],
  products: [
    {
      id: 'p1', sku: 'BC-001', slug: 'top-drapeado-rubi-glam',
      name: 'Top Drapeado Rubi Glam', line: 'Broth Stage',
      category: 'palco', subcategory: 'tops',
      price: 340, promoPrice: 289,
      colors: [{ name: 'Rubi', hex: '#8E1B2A' }, { name: 'Noir', hex: '#141414' }],
      sizes: ['PP', 'P', 'M', 'G'],
      stock: { PP: 2, P: 4, M: 3, G: 1 },
      short: 'Gola alta drapeada em cetim rubi, estruturada para colares pesados de palco.',
      description: 'Top sem mangas em cetim encorpado com gola alta drapeada a mao. A modelagem sustenta colares e correntes pesadas sem deformar e acompanha o corpo em movimento sob a luz de refletor.',
      specs: {
        Composicao: 'Cetim de poliester 96%, elastano 4%',
        Forro: 'Malha dry-fit preta respiravel',
        Modelagem: 'Ajustada no busto, gola alta drapeada',
        Fechamento: 'Ziper invisivel destacavel nas costas',
        Cuidados: 'Lavagem a seco ou a mao em agua fria',
        Origem: 'Desenhado e costurado em Londrina - PR',
        Prazo: 'Pronta-entrega (ou 7 dias uteis sob medida)'
      },
      badge: 'Stage', featured: true, sold: 41, createdAt: '2026-09-14',
      bundleWith: 'p5'
    },
    {
      id: 'p2', sku: 'BC-002', slug: 'casaco-estruturado-ilhoses-noir',
      name: 'Casaco Estruturado Ilhoses Noir', line: 'Broth Stage',
      category: 'palco', subcategory: 'casacos',
      price: 690, promoPrice: 590,
      colors: [{ name: 'Noir', hex: '#121212' }, { name: 'Bordo', hex: '#4A1420' }],
      sizes: ['P', 'M', 'G', 'GG'],
      stock: { P: 1, M: 2, G: 2, GG: 1 },
      short: 'Lapelas amplas com ilhoses metalicos e punhos contrastantes em veludo.',
      description: 'Casaco arquitetonico em sarja pesada com lapelas largas aplicadas com ilhoses prateados, ombros estruturados e punhos em veludo bordo. Peca-assinatura da linha Stage, pensada para abertura de show.',
      specs: {
        Composicao: 'Sarja de algodao 100% e punhos em veludo',
        Forro: 'Cetim de toque frio preto',
        Modelagem: 'Oversized com ombro estruturado de alfaiataria',
        Fechamento: 'Transpassado com colchetes internos de metal',
        Aviamentos: 'Ilhoses de latao niquelado antioxidante',
        Cuidados: 'Somente lavagem a seco especializada',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Assinatura', featured: true, sold: 27, createdAt: '2026-08-02',
      bundleWith: 'p3'
    },
    {
      id: 'p3', sku: 'BC-003', slug: 'colete-escama-metalica-stage',
      name: 'Colete Escama Metalica Stage', line: 'Broth Stage',
      category: 'palco', subcategory: 'coletes',
      price: 420, promoPrice: null,
      colors: [{ name: 'Grafite', hex: '#2A2D33' }, { name: 'Prata Escuro', hex: '#545961' }],
      sizes: ['PP', 'P', 'M', 'G'],
      stock: { PP: 1, P: 2, M: 2, G: 1 },
      short: 'Textura geometrica em escama que reflete a luz de palco. Serie limitada.',
      description: 'Colete sem mangas em tecido com textura geometrica de escama metalizada e choker de fivelas dupla inclusa. Reflete luz em angulos diferentes a cada movimento.',
      specs: {
        Composicao: 'Poliester metalizado com base de malha flexivel',
        Forro: 'Malha preta respiravel',
        Modelagem: 'Reta, cava americana anatomica',
        Fechamento: 'Botoes de pressao frontais ocultos',
        Acessorio: 'Choker de couro sintetico com fivelas (incluso)',
        Cuidados: 'Lavar a mao, secar na sombra',
        Edicao: 'Serie numerada de 20 pecas'
      },
      badge: 'Serie limitada', featured: false, sold: 18, createdAt: '2026-10-10',
      bundleWith: 'p2'
    },
    {
      id: 'p4', sku: 'BC-004', slug: 'conjunto-alfaiataria-wide-leg-off-white',
      name: 'Conjunto Alfaiataria Wide-Leg Off-White', line: 'Broth Mainline',
      category: 'alfaiataria', subcategory: 'conjuntos',
      price: 640, promoPrice: 560,
      colors: [{ name: 'Off-white & Noir', hex: '#E8E2D4' }, { name: 'Verde Musgo & Noir', hex: '#283825' }],
      sizes: ['PP', 'P', 'M', 'G', 'GG'],
      stock: { PP: 2, P: 5, M: 6, G: 3, GG: 2 },
      short: 'Colete de decote profundo e calca wide-leg de cintura alta em sarja.',
      description: 'Colete de alfaiataria preto com decote em V profundo e calca wide-leg de cintura alta em sarja off-white. Acompanha lenco acetinado verde-oliva. O conjunto mais requisitado do atelier.',
      specs: {
        Composicao: 'Colete em gabardine e calca em sarja 98% algodao',
        Modelagem: 'Calca wide-leg de cintura alta com pregas frontais',
        Fechamento: 'Botoes forrados e ziper frontal reforçado',
        Acessorio: 'Lenco em cetim verde-oliva incluso',
        Cuidados: 'Lavar a seco ou a mao',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Mais vendido', featured: true, sold: 63, createdAt: '2026-07-20',
      bundleWith: 'p8'
    },
    {
      id: 'p5', sku: 'BC-005', slug: 'look-pantalona-correntes-douradas',
      name: 'Look Pantalona & Correntes Douradas', line: 'Broth Mainline',
      category: 'alfaiataria', subcategory: 'looks',
      price: 720, promoPrice: 648,
      colors: [{ name: 'Noir & Ouro', hex: '#0F0F0F' }],
      sizes: ['P', 'M', 'G'],
      stock: { P: 2, M: 3, G: 2 },
      short: 'Jaqueta cropped, body chain e pantalona fluida com cinto duplo de elos.',
      description: 'Jaqueta cropped estruturada em sarja preta, body chain dourado e pantalona de cintura alta com cinto duplo de elos dourados. Look completo para tapete vermelho, premiacoes e palco.',
      specs: {
        Composicao: 'Sarja de algodao peletizado e correntes em metal banhado',
        Modelagem: 'Jaqueta cropped, pantalona fluida de cintura alta',
        Itens: 'Jaqueta, pantalona, body chain e cinto de elos',
        Fechamento: 'Botoes metalicos personalizados',
        Cuidados: 'Destacar correntes pelos mosquetoes antes de lavar',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Look completo', featured: true, sold: 35, createdAt: '2026-09-01',
      bundleWith: 'p1'
    },
    {
      id: 'p6', sku: 'BC-006', slug: 'calca-patchwork-desconstruida-halter',
      name: 'Calca Patchwork Desconstruida & Halter', line: 'Broth Mainline',
      category: 'alfaiataria', subcategory: 'calcas',
      price: 580, promoPrice: null,
      colors: [{ name: 'Indigo & Noir', hex: '#1E2A44' }],
      sizes: ['PP', 'P', 'M', 'G'],
      stock: { PP: 1, P: 3, M: 2, G: 1 },
      short: 'Recortes de denim com costuras aparentes e top frente unica plissado.',
      description: 'Calca wide-leg em recortes de denim indigo e preto com costuras aparentes e cos assimetrico, acompanhada de top frente unica plissado com gola alta e colar de perolas.',
      specs: {
        Composicao: 'Denim 100% algodao de upcycling e top em crepe plissado',
        Modelagem: 'Wide-leg arquitetonica, cos assimetrico',
        Fechamento: 'Ziper YKK e botao metalico',
        Diferencial: 'Cada peca possui disposicao de recortes exclusiva',
        Cuidados: 'Lavar do avesso em agua fria',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Peca unica', featured: false, sold: 22, createdAt: '2026-10-18',
      bundleWith: 'p8'
    },
    {
      id: 'p7', sku: 'BC-007', slug: 'camisa-renda-guipure-pantacourt',
      name: 'Camisa Renda Guipure & Pantacourt', line: 'Broth Mainline',
      category: 'renda-e-mesh', subcategory: 'camisas',
      price: 610, promoPrice: 530,
      colors: [{ name: 'Noir & Caramelo', hex: '#9A7246' }],
      sizes: ['P', 'M', 'G', 'GG'],
      stock: { P: 2, M: 3, G: 2, GG: 1 },
      short: 'Guipure floral translucida com pantacourt caramelo de cintura alta.',
      description: 'Camisa de manga longa em renda guipure floral preta translucida, harness de couro ecologico e pantacourt de cintura alta em linho caramelo com faixa de cetim.',
      specs: {
        Composicao: 'Renda guipure de algodao e pantacourt em linho misto',
        Modelagem: 'Camisa relaxada, pantacourt ampla com pregas',
        Itens: 'Camisa guipure, pantacourt e faixa de cetim',
        Fechamento: 'Botoes forrados em cetim',
        Cuidados: 'Lavar a mao, nao torcer, secar na horizontal',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Editorial', featured: true, sold: 31, createdAt: '2026-08-25',
      bundleWith: 'p4'
    },
    {
      id: 'p8', sku: 'BC-008', slug: 'camisa-renda-floral-noir',
      name: 'Camisa Renda Floral Noir', line: 'Broth Mainline',
      category: 'renda-e-mesh', subcategory: 'camisas',
      price: 360, promoPrice: null,
      colors: [{ name: 'Noir', hex: '#101010' }, { name: 'Esmeralda Escuro', hex: '#183020' }],
      sizes: ['PP', 'P', 'M', 'G', 'GG'],
      stock: { PP: 3, P: 4, M: 5, G: 3, GG: 2 },
      short: 'Renda floral encorpada, colarinho estruturado e botoes acetinados.',
      description: 'Camisa de manga curta em renda floral preta encorpada, colarinho classico entretelado e botoes acetinados. Transita entre a alfaiataria diurna e composicoes de palco.',
      specs: {
        Composicao: 'Renda de algodao 70% e poliamida 30%',
        Modelagem: 'Reta sem genero, manga curta ampla',
        Fechamento: 'Botoes acetinados frontais',
        Cuidados: 'Lavar a mao em agua fria',
        Origem: 'Desenhado e costurado em Londrina - PR'
      },
      badge: 'Pronta-entrega', featured: false, sold: 48, createdAt: '2026-06-30',
      bundleWith: 'p4'
    },
    {
      id: 'p9', sku: 'BC-009', slug: 'cropped-mesh-metalico-bomber',
      name: 'Cropped Mesh Metalico & Bomber', line: 'Broth Atelier',
      category: 'sob-medida', subcategory: 'figurinos',
      price: 670, promoPrice: 589,
      colors: [{ name: 'Ouro Velho', hex: '#8C7340' }, { name: 'Noir', hex: '#121212' }],
      sizes: ['P', 'M', 'G'],
      stock: { P: 1, M: 2, G: 1 },
      short: 'Mesh translucido com reflexos metalicos e bomber em fios dourados.',
      description: 'Regata cropped em malha mesh translucida com reflexos metalicos e jaqueta bomber texturizada em fios pretos e dourados. Confeccionada sob medida para cada artista.',
      specs: {
        Composicao: 'Mesh de poliamida metalizada e bomber em jacquard lurex',
        Forro: 'Cetim preto (jaqueta bomber)',
        Modelagem: 'Cropped ajustado, bomber estruturada',
        Fechamento: 'Ziper metalico dourado de duplo cursor',
        Cuidados: 'Lavagem a seco',
        Prazo: '10 a 15 dias uteis (inclui conferencia de medidas por video)'
      },
      badge: 'Sob encomenda', featured: true, sold: 14, createdAt: '2026-10-28',
      bundleWith: 'p5'
    }
  ],
  reviews: [
    { id: 'r1', productId: 'p4', name: 'Rafa M.', city: 'Curitiba - PR', rating: 5, title: 'Caimento impecavel', text: 'A calca veste com perfeicao. Usei em uma premiacao e todos perguntaram qual atelier assinou o look.', size: 'M', date: '2026-10-12', verified: true, approved: true },
    { id: 'r2', productId: 'p4', name: 'Duda L.', city: 'Londrina - PR', rating: 5, title: 'Atendimento no atelier', text: 'Fiz a prova presencial na Casa Criou e ajustaram a barra na hora. Sarja muito encorpada.', size: 'P', date: '2026-09-28', verified: true, approved: true },
    { id: 'r3', productId: 'p2', name: 'Theo S.', city: 'Sao Paulo - SP', rating: 5, title: 'Figurino de palco real', text: 'Usei em tres shows seguidos da turne. Os ilhoses nao soltam e o casaco mantem a linha de ombro.', size: 'G', date: '2026-10-05', verified: true, approved: true },
    { id: 'r4', productId: 'p1', name: 'Bia N.', city: 'Maringa - PR', rating: 5, title: 'Rubi profundo na luz', text: 'A cor rubi responde muito bem ao refletor. O drapeado da gola sustenta colar pesado sem ceder.', size: 'M', date: '2026-10-20', verified: true, approved: true },
    { id: 'r5', productId: 'p7', name: 'Lui C.', city: 'Rio de Janeiro - RJ', rating: 5, title: 'Guipure densa e macia', text: 'Renda encorpada, acabamento de costura limpa. O pantacourt em linho equilibra a transparencia.', size: 'M', date: '2026-09-15', verified: true, approved: true },
    { id: 'r6', productId: 'p5', name: 'Nico A.', city: 'Belo Horizonte - MG', rating: 5, title: 'Gravacao de videoclipe', text: 'Chegou no prazo em embalagem protetora e as correntes tem peso real em cena.', size: 'P', date: '2026-10-02', verified: true, approved: true },
    { id: 'r7', productId: 'p8', name: 'Gabe R.', city: 'Florianopolis - SC', rating: 4, title: 'Versatil com alfaiataria', text: 'Combino com calca wide-leg preta. A renda tem toque macio na pele.', size: 'G', date: '2026-08-19', verified: true, approved: true },
    { id: 'r8', productId: 'p9', name: 'Kai P.', city: 'Londrina - PR', rating: 5, title: 'Feita nas minhas medidas', text: 'Enviei as medidas e validamos por chamada de video. A bomber serviu com precisao.', size: 'M', date: '2026-10-30', verified: true, approved: true }
  ],
  questions: [
    { id: 'q1', productId: 'p4', name: 'Ana V.', question: 'A calca vem com barra pronta ou margem para ajuste?', answer: 'Enviamos com barra padrão para estatura de ate 1,78 m e bainha interna de 4 cm, ou ja ajustada na sua medida exata sem custo adicional.', date: '2026-10-01', approved: true },
    { id: 'q2', productId: 'p2', name: 'Leo M.', question: 'Consigo encomendar o casaco com punhos em verde-floresta?', answer: 'Sim. Pela modalidade Sob Medida produzimos com punhos em veludo verde-floresta, bordo ou preto em ate 10 dias uteis.', date: '2026-09-20', approved: true },
    { id: 'q3', productId: 'p1', name: 'Joana C.', question: 'O tecido esquenta muito sob iluminacao de palco?', answer: 'O forro interno utiliza malha dry-fit respiravel que absorve umidade e mantem o conforto termico durante o show.', date: '2026-10-11', approved: true }
  ],
  posts: [
    {
      slug: 'como-escolher-figurino-de-palco',
      title: 'Como escolher um figurino de palco que sustenta o show inteiro',
      excerpt: 'Tecido, luz, transpiracao e movimento: os criterios do atelier antes de cortar uma peca para turne.',
      image: '/assets/img/campanha/journal-02.webp',
      date: '2026-10-22',
      category: 'Palco & Backstage',
      readTime: '4 min de leitura',
      body: [
        'Um figurino de palco passa por exigencias fisicas que nenhuma roupa casual enfrenta. Sao duas horas sob refletores, mudancas bruscas de movimento, microfones transmissores presos ao cos e trocas de 40 segundos no escuro da coxia.',
        'Na Broth Concept iniciamos pela engenharia textil. Cetins de alta gramatura, sarjas peletizadas e rendas guipure mantem a arquitetura da peca no video 4K sem perder a mobilidade.',
        'Na modelagem, desenhamos cavas anatomicas e aplicamos forros respiraveis. Ziperes destacaveis e correntes com mosquetoes permitem desmontar ou adaptar o look entre atos do mesmo show.'
      ]
    },
    {
      slug: 'guia-de-medidas-sob-medida',
      title: 'Guia pratico para enviar suas medidas ao atelier',
      excerpt: 'Com uma fita metrica e dez minutos voce registra tudo o que precisamos para cortar sua peca sob medida.',
      image: '/assets/img/campanha/journal-03.webp',
      date: '2026-10-08',
      category: 'Atelier Sob Medida',
      readTime: '3 min de leitura',
      body: [
        'Nossa modelagem e livre de rotulos de genero: trabalhamos com a anatomia real de cada corpo. Para tirar suas medidas em casa, utilize uma fita metrica flexivel e mantenha a postura relaxada.',
        'Meça o torax ou busto na linha mais projetada, a cintura na altura onde deseja assentar o cos da calca e o quadril no ponto de maior circunferencia.',
        'Ao fechar um pedido com opcao Sob Medida, nossa equipe agenda uma breve conferencia por video no WhatsApp antes do corte final.'
      ]
    },
    {
      slug: 'renda-guipure-cuidados',
      title: 'Renda guipure e metais de palco: manual de conservacao',
      excerpt: 'Como higienizar, guardar e preservar pecas com textura em relevo, ilhoses e correntes banhadas.',
      image: '/assets/img/campanha/journal-01.webp',
      date: '2026-09-26',
      category: 'Materiais & Cuidado',
      readTime: '3 min de leitura',
      body: [
        'Diferente das rendas aplicadas sobre tule fino, a guipure possui estrutura autoportante formada por bordados em relevo. Isso garante presenca visual sob luz direta e alta durabilidade.',
        'Antes de lavar qualquer peca da linha Broth Stage, destaque as correntes removiveis. Higienize a mao com agua fria e sabao neutro, sem torcer.',
        'Seque sempre na horizontal sobre toalha seca, longe do sol direto, e guarde em cabides acolchoados ou papel de seda livre de acido.'
      ]
    }
  ],
  coupons: [
    { code: 'BROTH10', type: 'percent', value: 10, minOrder: 0, description: '10% off na primeira compra (Boas-vindas)', active: true },
    { code: 'PRIDE20', type: 'percent', value: 20, minOrder: 900, description: '20% off em pedidos acima de R$ 900', active: true },
    { code: 'PALCO100', type: 'fixed', value: 100, minOrder: 1100, description: 'R$ 100 off em figurinos acima de R$ 1.100', active: true }
  ],
  banners: {
    topBar: {
      active: true,
      text: 'Frete gratis acima de R$ 900 | 5% off imediato no Pix | Ate 10x sem juros | Cupom: BROTH10'
    },
    heroSlides: [
      {
        id: 's1',
        eyebrow: 'Colecao Ato II - Londrina',
        title: 'Alta costura autoral para quem domina o palco.',
        text: 'Figurinos esculturais, alfaiataria sem genero e pecas em guipure criadas a mao para cantores, performers e mentes livres.',
        cta: 'Explorar Colecao',
        image: '/assets/img/campanha/hero-01.webp',
        captionTitle: 'Look Assinatura Ato II',
        captionSub: 'Velluto Botânico & Alfaiataria Desconstruida'
      },
      {
        id: 's2',
        eyebrow: 'Linha Broth Stage',
        title: 'Desenhada para reagir a luz do refletor.',
        text: 'Casacos estruturados com ilhoses, malhas metalicas e drapeados testados para sustentar duas horas de show.',
        cta: 'Ver Linha Palco',
        image: '/assets/img/campanha/hero-02.webp',
        captionTitle: 'Backstage & Turne',
        captionSub: 'Acabamento resistente e troca rapida'
      },
      {
        id: 's3',
        eyebrow: 'Atelier Casa Criou',
        title: 'Do croqui exclusivo a prova sob medida.',
        text: 'Atendimento individual no atelier em Londrina ou consultoria por video com envio segurado para todo o Brasil.',
        cta: 'Conhecer Sob Medida',
        image: '/assets/img/campanha/hero-03.webp',
        captionTitle: 'Atelier Broth Concept',
        captionSub: 'R. Ibipora, 720 - Londrina, PR'
      }
    ],
    promo: {
      active: true,
      eyebrow: 'Condicao Especial de Temporada',
      title: '20% de desconto em composicoes acima de R$ 900',
      text: 'Utilize o codigo PRIDE20 na sacola. Valido para pecas de pronta-entrega e encomendas sob medida.',
      coupon: 'PRIDE20',
      image: '/assets/img/campanha/cat-renda.webp'
    }
  },
  orders: [
    {
      id: 'PED-2026-8841',
      trackingCode: 'BR884190234BC',
      createdAt: '2026-10-29T14:22:00-03:00',
      status: 'Em transito',
      nfeKey: '4126 1048 7129 0400 0163 5500 1000 0088 4119 2837 4102',
      nfeNumber: '000.884',
      customer: {
        name: 'Theo Santoro',
        email: 'theo.santoro@artista.com.br',
        phone: '(11) 99412-8830',
        cpf: '381.902.448-12',
        cep: '01414-001',
        city: 'Sao Paulo - SP',
        address: 'Rua Bela Cintra, 1420 - Consolacao'
      },
      paymentMethod: 'Pix (5% off)',
      shippingMethod: 'Correios SEDEX Com Seguro',
      shippingCost: 0,
      subtotal: 1150,
      discount: 57.5,
      total: 1092.5,
      cashbackEarned: 54.63,
      items: [
        { productId: 'p2', sku: 'BC-002', name: 'Casaco Estruturado Ilhoses Noir', size: 'G', color: 'Noir', qty: 1, price: 590 },
        { productId: 'p4', sku: 'BC-004', name: 'Conjunto Alfaiataria Wide-Leg Off-White', size: 'M', color: 'Off-white & Noir', qty: 1, price: 560 }
      ],
      timeline: [
        { date: '29/10/2026 14:22', title: 'Pedido confirmado e pagamento aprovado via Pix', done: true },
        { date: '29/10/2026 17:40', title: 'Conferencia de costura, passadoria a vapor e emissao de NF-e', done: true },
        { date: '30/10/2026 10:15', title: 'Coletado em Londrina - PR (Unidade Correios SEDEX)', done: true },
        { date: '01/11/2026 08:30', title: 'Em transito para Centro de Distribuicao Sao Paulo - SP', done: true },
        { date: 'Previsao 03/11', title: 'Saida para entrega ao destinatario', done: false }
      ]
    }
  ],
  tickets: [
    {
      id: 'CH-4012',
      name: 'Theo Santoro',
      email: 'theo.santoro@artista.com.br',
      subject: 'Ajuste de manga para proximo show',
      status: 'Respondido pelo Atelier',
      createdAt: '2026-10-30T11:10:00-03:00',
      reply: 'Olá Theo! Registramos +1,5 cm no comprimento de punho da sua ficha técnica no atelier.'
    }
  ]
};

const listeners = new Set();
let channel = null;
try {
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', () => {
      state = loadState();
      notify(false);
    });
  }
} catch (_) {
  channel = null;
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    state = loadState();
    notify(false);
  }
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      settings: { ...SEED_DATA.settings, ...(parsed.settings || {}) }
    };
  } catch (_) {
    return createInitialState();
  }
}

function createInitialState() {
  return {
    settings: structuredClone(SEED_DATA.settings),
    categories: structuredClone(SEED_DATA.categories),
    products: structuredClone(SEED_DATA.products),
    reviews: structuredClone(SEED_DATA.reviews),
    questions: structuredClone(SEED_DATA.questions),
    posts: structuredClone(SEED_DATA.posts),
    coupons: structuredClone(SEED_DATA.coupons),
    banners: structuredClone(SEED_DATA.banners),
    orders: structuredClone(SEED_DATA.orders),
    tickets: structuredClone(SEED_DATA.tickets),
    cart: [],
    couponCode: '',
    shippingQuote: null,
    wishlist: ['p2', 'p4'],
    recentlyViewed: ['p4', 'p2', 'p1'],
    customer: null,
    cookieConsent: false,
    newsletterSubscribers: []
  };
}

let state = loadState();

function saveState(broadcast = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* quota fallback */
  }
  notify(broadcast);
}

function notify(broadcast = true) {
  if (broadcast && channel) {
    try {
      channel.postMessage({ updatedAt: Date.now() });
    } catch (_) {
      /* ignore */
    }
  }
  for (const fn of listeners) {
    try {
      fn(state);
    } catch (_) {
      /* ignore listener errors */
    }
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function resetDemoState() {
  state = createInitialState();
  saveState(true);
}

/*Analytics & Marketing DataLayer Simulation (GA4 / Meta Pixel)*/
export function trackEvent(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ecommerce: payload,
    timestamp: new Date().toISOString()
  });
}

/* Products & Catalog */
export function getProducts() {
  return state.products;
}

export function getProductById(idOrSlug) {
  return state.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug || p.sku === idOrSlug) || null;
}

export function getEffectivePrice(product) {
  if (!product) return 0;
  return product.promoPrice && Number(product.promoPrice) < Number(product.price)
    ? Number(product.promoPrice)
    : Number(product.price);
}

export function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.customImages) && product.customImages.length) {
    return product.customImages;
  }
  const code = String(product.sku || 'BC-001').toLowerCase();
  return [
    `/assets/img/produtos/${code}-1.webp`,
    `/assets/img/produtos/${code}-2.webp`,
    `/assets/img/produtos/${code}-3.webp`
  ];
}

export function getProductRating(productId) {
  const revs = state.reviews.filter((r) => r.productId === productId && r.approved !== false);
  if (!revs.length) return { average: 4.9, count: 6 };
  const sum = revs.reduce((acc, r) => acc + Number(r.rating || 5), 0);
  return { average: sum / revs.length, count: revs.length };
}

export function getProductStockTotal(product) {
  if (!product || !product.stock) return 0;
  return Object.values(product.stock).reduce((acc, v) => acc + Number(v || 0), 0);
}

/* Recently Viewed & Wishlist */
export function markViewed(productId) {
  if (!productId) return;
  const list = [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 6);
  state.recentlyViewed = list;
  saveState(false);
}

export function getRecentlyViewed(excludeId = null) {
  return state.recentlyViewed
    .filter((id) => id !== excludeId)
    .map((id) => getProductById(id))
    .filter(Boolean);
}

export function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId);
  let added = false;
  if (idx >= 0) {
    state.wishlist.splice(idx, 1);
  } else {
    state.wishlist.unshift(productId);
    added = true;
  }
  saveState(true);
  trackEvent('add_to_wishlist', { productId, added });
  return added;
}

export function isWishlisted(productId) {
  return state.wishlist.includes(productId);
}

/* Shopping Bag & Coupons */
export function addToCart({ productId, size = 'M', color = '', qty = 1, customMeasure = '' }) {
  const product = getProductById(productId);
  if (!product) return { ok: false, message: 'Peca nao encontrada.' };
  const selectedColor = color || (product.colors?.[0]?.name || 'Padrao');
  const key = `${product.id}__${size}__${selectedColor}__${customMeasure}`;
  const existing = state.cart.find((item) => item.key === key);
  if (existing) {
    existing.qty = Math.min(10, existing.qty + Number(qty || 1));
  } else {
    state.cart.push({
      key,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: getEffectivePrice(product),
      originalPrice: product.price,
      size,
      color: selectedColor,
      customMeasure,
      qty: Number(qty || 1),
      image: getProductImages(product)[0]
    });
  }
  saveState(true);
  trackEvent('add_to_cart', { sku: product.sku, name: product.name, price: getEffectivePrice(product), size });
  return { ok: true, product };
}

export function updateCartQty(key, delta) {
  const item = state.cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((i) => i.key !== key);
  }
  saveState(true);
}

export function removeFromCart(key) {
  state.cart = state.cart.filter((i) => i.key !== key);
  saveState(true);
}

export function applyCoupon(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    state.couponCode = '';
    saveState(true);
    return { ok: true, message: 'Cupom removido.' };
  }
  const found = state.coupons.find((c) => c.code.toUpperCase() === code && c.active);
  if (!found) {
    return { ok: false, message: 'Cupom invalido ou expirado.' };
  }
  const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  if (subtotal < Number(found.minOrder || 0)) {
    return { ok: false, message: `Este cupom requer pedido minimo de R$ ${found.minOrder}.` };
  }
  state.couponCode = found.code;
  saveState(true);
  return { ok: true, message: `Cupom ${found.code} aplicado: ${found.description}` };
}

export function getCartSummary(paymentType = 'pix') {
  const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const count = state.cart.reduce((acc, item) => acc + item.qty, 0);
  let couponDiscount = 0;
  let activeCoupon = null;

  if (state.couponCode) {
    const c = state.coupons.find((x) => x.code === state.couponCode && x.active);
    if (c && subtotal >= Number(c.minOrder || 0)) {
      activeCoupon = c;
      couponDiscount = c.type === 'percent' ? (subtotal * Number(c.value)) / 100 : Number(c.value);
    }
  }

  const afterCoupon = Math.max(0, subtotal - couponDiscount);
  const freeShippingMin = Number(state.settings.freeShippingMin || 900);
  const qualifiesFreeShipping = afterCoupon >= freeShippingMin && count > 0;
  const rawShipping = state.shippingQuote ? Number(state.shippingQuote.price || 0) : 0;
  const shipping = qualifiesFreeShipping && state.shippingQuote?.code !== 'EXPRESS_AIR' ? 0 : rawShipping;

  const pixPercent = Number(state.settings.pixDiscount || 5);
  const pixDiscount = paymentType === 'pix' ? (afterCoupon * pixPercent) / 100 : 0;
  const total = Math.max(0, afterCoupon - pixDiscount + shipping);
  const cashback = (total * Number(state.settings.cashbackPercent || 5)) / 100;
  const freeShippingRemaining = Math.max(0, freeShippingMin - afterCoupon);

  return {
    count,
    subtotal,
    couponDiscount,
    activeCoupon,
    shipping,
    qualifiesFreeShipping,
    freeShippingMin,
    freeShippingRemaining,
    pixDiscount,
    total,
    cashback
  };
}

/* Real-time Freight Calculator & ViaCEP Integration */
const CEP_FALLBACKS = {
  '86': { city: 'Londrina', uf: 'PR', neighborhood: 'Gleba Palhano / Aurora', street: 'Av. Ayrton Senna da Silva', region: 'local' },
  '87': { city: 'Maringa', uf: 'PR', neighborhood: 'Zona 01', street: 'Av. Brasil', region: 'pr' },
  '80': { city: 'Curitiba', uf: 'PR', neighborhood: 'Batel', street: 'Av. do Batel', region: 'pr' },
  '01': { city: 'Sao Paulo', uf: 'SP', neighborhood: 'Jardins / Consolacao', street: 'Rua Oscar Freire', region: 'se' },
  '20': { city: 'Rio de Janeiro', uf: 'RJ', neighborhood: 'Ipanema / Centro', street: 'Rua Visconde de Piraja', region: 'se' },
  '30': { city: 'Belo Horizonte', uf: 'MG', neighborhood: 'Savassi', street: 'Rua Pernambuco', region: 'se' },
  '88': { city: 'Florianopolis', uf: 'SC', neighborhood: 'Centro', street: 'Av. Beira Mar Norte', region: 'sul' },
  '90': { city: 'Porto Alegre', uf: 'RS', neighborhood: 'Moinhos de Vento', street: 'Rua Padre Chagas', region: 'sul' },
  '70': { city: 'Brasilia', uf: 'DF', neighborhood: 'Asa Sul', street: 'CLS 405', region: 'co' }
};

export async function lookupCep(rawCep) {
  const digits = onlyDigits(rawCep);
  if (digits.length !== 8) {
    return { ok: false, message: 'Informe um CEP valido com 8 digitos.' };
  }
  const prefix = digits.slice(0, 2);
  const fallback = CEP_FALLBACKS[prefix] || {
    city: 'Sao Paulo',
    uf: 'SP',
    neighborhood: 'Centro',
    street: 'Endereco identificado por CEP',
    region: 'nacional'
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2400);
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          ok: true,
          cep: digits,
          street: data.logradouro || fallback.street,
          neighborhood: data.bairro || fallback.neighborhood,
          city: data.localidade || fallback.city,
          uf: data.uf || fallback.uf
        };
      }
    }
  } catch (_) {
    /* usa fallback deterministico */
  }

  return {
    ok: true,
    cep: digits,
    street: fallback.street,
    neighborhood: fallback.neighborhood,
    city: fallback.city,
    uf: fallback.uf
  };
}

export function calculateFreightOptions(rawCep, subtotal = 0) {
  const digits = onlyDigits(rawCep);
  if (digits.length !== 8) return [];
  const prefix = digits.slice(0, 2);
  const freeMin = Number(state.settings.freeShippingMin || 900);
  const isFree = subtotal >= freeMin;

  let basePac = 28.9;
  let baseSedex = 48.0;
  let pacDays = '5 a 7 dias uteis';
  let sedexDays = '2 a 3 dias uteis';
  let regionLabel = 'Sudeste / Sul';

  if (prefix === '86') {
    basePac = 16.0;
    baseSedex = 24.0;
    pacDays = '1 a 2 dias uteis';
    sedexDays = 'Mesmo dia (Mensageiro Atelier)';
    regionLabel = 'Londrina e Regiao';
  } else if (['80', '81', '82', '83', '84', '85', '87'].includes(prefix)) {
    basePac = 22.9;
    baseSedex = 36.5;
    pacDays = '3 a 4 dias uteis';
    sedexDays = '1 a 2 dias uteis';
    regionLabel = 'Parana';
  } else if (Number(prefix) >= 40 && Number(prefix) <= 69) {
    basePac = 38.9;
    baseSedex = 68.0;
    pacDays = '7 a 10 dias uteis';
    sedexDays = '3 a 5 dias uteis';
    regionLabel = 'Nordeste / Norte';
  }

  return [
    {
      code: 'PAC',
      carrier: 'Correios PAC Segurado',
      region: regionLabel,
      days: pacDays,
      price: isFree ? 0 : basePac
    },
    {
      code: 'SEDEX',
      carrier: 'Correios SEDEX Couture',
      region: regionLabel,
      days: sedexDays,
      price: isFree ? 0 : baseSedex
    },
    {
      code: 'JADLOG',
      carrier: 'Jadlog Expresso Porta-Terno',
      region: regionLabel,
      days: '2 a 4 dias uteis (Embalagem Cabide)',
      price: isFree ? 19.9 : baseSedex + 12
    },
    {
      code: 'ATELIER',
      carrier: 'Retirada no Atelier Londrina (@casacriou)',
      region: 'R. Ibipora, 720 - Aurora',
      days: 'Pronto em ate 24h uteis (Com prova opcional)',
      price: 0
    }
  ];
}

export function selectShippingQuote(quote) {
  state.shippingQuote = quote;
  saveState(true);
}

/* Reviews & Q&A */
export function addReview({ productId, name, city, rating, size, title, text }) {
  const rev = {
    id: uid('rev'),
    productId,
    name: String(name || 'Cliente Broth').trim(),
    city: String(city || 'Brasil').trim(),
    rating: Math.min(5, Math.max(1, Number(rating || 5))),
    size: size || 'M',
    title: String(title || 'Excelente peca').trim(),
    text: String(text || '').trim(),
    date: new Date().toISOString().slice(0, 10),
    verified: true,
    approved: true
  };
  state.reviews.unshift(rev);
  saveState(true);
  return rev;
}

export function addQuestion({ productId, name, question }) {
  const q = {
    id: uid('q'),
    productId,
    name: String(name || 'Visitante').trim(),
    question: String(question || '').trim(),
    answer: 'Recebemos sua pergunta no atelier! Para pronta-entrega enviamos em ate 24h uteis e também ajustamos medidas sem custo adicional.',
    date: new Date().toISOString().slice(0, 10),
    approved: true
  };
  state.questions.unshift(q);
  saveState(true);
  return q;
}

/* Customer Account */
export function loginCustomer({ email, name, provider = 'Email' }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const displayName = name || cleanEmail.split('@')[0] || 'Cliente Broth';
  state.customer = {
    id: uid('usr'),
    name: displayName,
    email: cleanEmail || 'cliente@brothconcept.com.br',
    provider,
    cashbackBalance: state.customer?.cashbackBalance || 65.0,
    savedAddress: state.customer?.savedAddress || {
      cep: '86060-510',
      street: 'R. Ibipora, 720',
      neighborhood: 'Aurora',
      city: 'Londrina',
      uf: 'PR'
    },
    savedCards: state.customer?.savedCards || [
      { brand: 'Mastercard', last4: '8842', holder: displayName.toUpperCase(), exp: '09/29' }
    ]
  };
  saveState(true);
  return state.customer;
}

export function logoutCustomer() {
  state.customer = null;
  saveState(true);
}

/* Order Creation, Tracking & ERP NF-e */
export function createOrder({ customerData, paymentMethod, shippingQuote }) {
  const summary = getCartSummary(paymentMethod === 'pix' ? 'pix' : 'card');
  const num = Math.floor(1000 + Math.random() * 8999);
  const orderId = `PED-2026-${num}`;
  const trackingCode = `BR${num}94021BC`;
  const nfeNum = `000.${num}`;
  const nfeKey = `4126 1148 7129 0400 0163 5500 1000 00${num} 1928 3741 09`;

  const payLabels = {
    pix: 'Pix com 5% de desconto imediato',
    card: 'Cartao de Credito (Gateway PCI-DSS)',
    boleto: 'Boleto Bancario Registrado',
    wallet: 'Carteira Digital (Apple Pay / Google Pay)'
  };

  const order = {
    id: orderId,
    trackingCode,
    createdAt: new Date().toISOString(),
    status: paymentMethod === 'boleto' ? 'Aguardando compensacao' : 'Em preparacao no atelier',
    nfeNumber: nfeNum,
    nfeKey,
    customer: customerData,
    paymentMethod: payLabels[paymentMethod] || paymentMethod,
    shippingMethod: shippingQuote?.carrier || 'Correios SEDEX Couture',
    shippingCost: summary.shipping,
    subtotal: summary.subtotal,
    discount: summary.couponDiscount + summary.pixDiscount,
    total: summary.total,
    cashbackEarned: summary.cashback,
    items: state.cart.map((i) => ({ ...i })),
    timeline: [
      { date: 'Agora', title: `Pedido ${orderId} recebido com seguranca SSL/PCI`, done: true },
      { date: 'Processado', title: `Pagamento via ${payLabels[paymentMethod] || paymentMethod} validado`, done: paymentMethod !== 'boleto' },
      { date: 'Em andamento', title: 'Separacao da peca, conferencia de costura e emissao de NF-e', done: false },
      { date: 'Proximo passo', title: `Expedicao via ${shippingQuote?.carrier || 'Transportadora'} (${trackingCode})`, done: false }
    ]
  };

  // Decrement stock & increment sold count
  for (const item of state.cart) {
    const prod = getProductById(item.productId);
    if (prod) {
      prod.sold = Number(prod.sold || 0) + Number(item.qty || 1);
      if (prod.stock && prod.stock[item.size] !== undefined) {
        prod.stock[item.size] = Math.max(0, Number(prod.stock[item.size]) - Number(item.qty || 1));
      }
    }
  }

  state.orders.unshift(order);
  if (state.customer) {
    state.customer.cashbackBalance = Number(state.customer.cashbackBalance || 0) + summary.cashback;
  }
  state.cart = [];
  state.couponCode = '';
  saveState(true);
  trackEvent('purchase', { transaction_id: orderId, value: summary.total, currency: 'BRL' });
  return order;
}

export function findOrder(query) {
  const q = String(query || '').trim().toUpperCase();
  if (!q) return state.orders[0] || null;
  return (
    state.orders.find(
      (o) =>
        o.id.toUpperCase() === q ||
        o.trackingCode.toUpperCase() === q ||
        (o.customer?.email && o.customer.email.toUpperCase() === q)
    ) || null
  );
}

/* Support Tickets & Newsletter */
export function createSupportTicket({ name, email, subject, message }) {
  const ticket = {
    id: `CH-${Math.floor(1000 + Math.random() * 8999)}`,
    name,
    email,
    subject,
    message,
    status: 'Em analise pelo Concierge',
    createdAt: new Date().toISOString(),
    reply: 'Protocolo registrado. Nossa equipe responde em ate 2 horas uteis pelo WhatsApp ou e-mail.'
  };
  state.tickets.unshift(ticket);
  saveState(true);
  return ticket;
}

export function subscribeNewsletter(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || !clean.includes('@')) return { ok: false, message: 'Informe um e-mail valido.' };
  if (!state.newsletterSubscribers.includes(clean)) {
    state.newsletterSubscribers.push(clean);
  }
  saveState(true);
  return { ok: true, coupon: 'BROTH10' };
}

export function acceptCookies() {
  state.cookieConsent = true;
  saveState(false);
}

/* Admin / ERP Mutations */
export function upsertProduct(productData) {
  const idx = state.products.findIndex((p) => p.id === productData.id || p.sku === productData.sku);
  if (idx >= 0) {
    state.products[idx] = { ...state.products[idx], ...productData };
  } else {
    state.products.unshift({
      ...productData,
      id: productData.id || uid('p'),
      createdAt: new Date().toISOString().slice(0, 10),
      sold: Number(productData.sold || 0)
    });
  }
  saveState(true);
}

export function deleteProduct(productId) {
  state.products = state.products.filter((p) => p.id !== productId);
  saveState(true);
}

export function upsertCoupon(couponData) {
  const code = String(couponData.code || '').trim().toUpperCase();
  const idx = state.coupons.findIndex((c) => c.code === code);
  if (idx >= 0) {
    state.coupons[idx] = { ...state.coupons[idx], ...couponData, code };
  } else {
    state.coupons.push({ ...couponData, code, active: true });
  }
  saveState(true);
}

export function toggleCouponStatus(code) {
  const c = state.coupons.find((x) => x.code === code);
  if (c) {
    c.active = !c.active;
    saveState(true);
  }
}

export function updateBanners(bannerPatch) {
  state.banners = {
    ...state.banners,
    ...bannerPatch
  };
  saveState(true);
}

export function advanceOrderStatus(orderId, nextStatus) {
  const ord = state.orders.find((o) => o.id === orderId);
  if (!ord) return;
  ord.status = nextStatus;
  ord.timeline.push({
    date: new Date().toLocaleDateString('pt-BR'),
    title: `Status atualizado pelo ERP: ${nextStatus}`,
    done: true
  });
  saveState(true);
}
