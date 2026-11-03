# Script de Vídeo para Google Flow (Veo) - Broth Concept

## 1. Objetivo e Uso
- **Onde entra:** Vídeo de ambientação da Hero / Seção Manifesto e Reels de lançamento do site no Instagram `@brothconcept`.
- **Duração total:** 16 segundos (2 cenas de 8 segundos encadeadas em loop perfeito).
- **Configuração no site:** `muted playsinline loop preload="metadata"`, poster `img/hero-desktop.webp`, pausado automaticamente quando `prefers-reduced-motion: reduce` estiver ativo.

## 2. Bíblia Visual e Movimento de Câmera
- **Paleta:** Verde-obsidiana botânico (`#111710`), cinza-platina de estúdio, preto profundo, reflexos metálicos dourados e prateados.
- **Câmera padrão:** Lente anamórfica 50mm, movimento lento e contínuo (*slow cinematic dolly-in* e *subtle orbital pan*), profundidade de campo rasa (`f/2.0`), 24 fps.

## 3. Imagens Necessárias (Ingredientes / Frames de Referência)
| ID | Tipo no Google Flow | Arquivo de Origem | Proporção |
|---|---|---|---|
| `FRAME-01` | Frame Inicial (Cena 1) e Frame Final (Cena 2 - Loop) | `img/peca-bc-005.jpg` | 16:9 / 3:4 |
| `FRAME-02` | Frame de Transição (Fim Cena 1 / Início Cena 2) | `img/peca-bc-007.jpg` | 16:9 / 3:4 |
| `ING-LOGO` | Ingrediente de Marca (Assinatura final para Reels) | `logo/hd/broth-concept-selo-botanico-2048x2048.png` | 1:1 |

---

## 4. Roteiro de Cenas (Prompts para Google Flow)

### Cena 01 - A Estrutura e o Metal (0s a 8s)
- **Modo no Flow:** Frames to Video (`FRAME-01` -> `FRAME-02`)
- **Duração:** 8 segundos
- **Câmera:** Slow dolly-in com leve inclinação vertical acompanhando o brilho da corrente dourada na cintura.

```text
Slow-motion high-fashion studio editorial film, androgynous model wearing a structured black cropped jacket, fine gold body chain, and black wide-leg trousers with heavy double gold chain belt. Soft directional studio lighting creates subtle specular highlights on the gold links and fabric weave as the model breathes and shifts posture with poise. Slow cinematic dolly-in on 50mm lens, shallow depth of field, luxury fashion house campaign aesthetic.
```

```text
Negative prompt: fast movements, camera shake, text overlays, morphing face, distorted fingers, extra limbs, flicker.
```

### Cena 02 - Transparência em Renda Guipure e Retorno em Loop (8s a 16s)
- **Modo no Flow:** Frames to Video (`FRAME-02` -> `FRAME-01` para loop infinito)
- **Duração:** 8 segundos
- **Câmera:** Orbital pan suave da lateral para o eixo frontal, destacando a transparência da renda guipure preta e o caimento da alfaiataria.

```text
Slow-motion luxury fashion lookbook video in a minimalist platinum-grey studio, model wearing a sheer black floral guipure lace shirt, black chest harness, and high-waisted camel tailored culottes. Gentle studio breeze moves the silk sash belt slightly while the camera performs a smooth slow orbital pan, returning smoothly to the opening shadow composition for a seamless loop.
```

```text
Negative prompt: abrupt cuts, text, watermark, unnatural walking, distorted lace pattern, low resolution.
```

## 5. Pós-Produção Recomendada
1. Unir as duas cenas e exportar sem trilha de áudio (`-an`) para uso no background web.
2. Comprimir para WebM (VP9) e MP4 (H.264) mantendo peso abaixo de 2,5 MB:
   `ffmpeg -i broth-flow-raw.mp4 -vcodec libx264 -crf 26 -preset slow -an -movflags +faststart -vf scale=1280:-2 video/hero-loop.mp4`
