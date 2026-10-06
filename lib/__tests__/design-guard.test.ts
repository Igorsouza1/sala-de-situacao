/**
 * Guarda do design (DESIGN.md). Falha se o design antigo voltar ao código.
 *
 * 1) Proibido em qualquer arquivo (limite zero): modo escuro, tokens antigos, `hsl(var(--x))`, pulso em loop, fontes antigas e o nome
 *    "Sala de Situação" na interface.
 * 2) Em migração tela a tela (PRs de dashboard, mapa, admin e auth): classes de paleta do Tailwind (bg-gray-50, text-blue-600…) e cores hexadecimais.
 *    Cada arquivo tem um LIMITE em design-baseline.json, que só pode DESCER: aumentar falha, e diminuir também falha até o limite ser
 *    atualizado (assim o progresso fica registrado e ninguém volta atrás).
 *    Atualizar:  UPDATE_DESIGN_BASELINE=1 npx jest lib/__tests__/design-guard
 * 3) Erros MECÂNICOS que já custaram correções repetidas (DESIGN.md, "Leia primeiro" e casos reais): componente do navegador no lugar do
 *    do projeto (`<select>`, `type="color"`, `alert()`/`confirm()`) e a armadilha do Tailwind v4 (`transition-[…transform]` com
 *    `translate-`/`scale-` na mesma linha). Mesmo regime: limite por arquivo em design-mecanico-baseline.json, que só desce.
 *    O resto da auditoria (hierarquia, respiro, "faz pensar") não se mede por regex: fica na auditoria do DESIGN.md, seção 1.3.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const BASELINE_FILE = path.join(__dirname, "design-baseline.json");
const DIRS = ["app", "components", "hooks", "context"];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "__tests__" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = DIRS.flatMap((d) => (fs.existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : []));
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join("/");
const read = (f: string) => fs.readFileSync(f, "utf8");
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

const FORBIDDEN: Record<string, RegExp> = {
  "modo escuro (dark: ou .dark)": /(?<![\w-])dark:[\w[\]#/.()-]|\.dark\b(?!-)/g,
  "token antigo (brand-* ou pantaneiro-*)": /\b(?:bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|divide)-(?:brand|pantaneiro)-/g,
  "hsl(var(--x)) (os tokens agora são cores diretas: use var(--color-x))": /hsl\(var\(--/g,
  "pulso em loop (animate-pulse): use bg-shimmer no esqueleto, ou nenhum movimento": /animate-pulse/g,
  "fonte antiga (Inter, JetBrains, Noto, Playfair)": /\b(?:Playfair|Noto_Sans|Noto Sans|JetBrains|Inter\()/g,
  'nome antigo "Sala de Situação" (o nome é GEO PRISMA)': /Sala de Situa[cç][aã]o/g,
};

const PALETTE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g;
const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

describe("design: o que nunca pode voltar", () => {
  for (const [nome, re] of Object.entries(FORBIDDEN)) {
    it(`sem ${nome}`, () => {
      const achados = files.filter((f) => count(read(f), re) > 0).map((f) => `${rel(f)} (${count(read(f), re)})`);
      expect(achados).toEqual([]);
    });
  }
});

describe("design: migração tela a tela (limite que só desce)", () => {
  const atual: Record<string, { paleta: number; hex: number }> = {};
  for (const f of files) {
    if (f.endsWith("globals.css")) continue; // os tokens vivem aqui, por definição
    const t = read(f);
    const paleta = count(t, PALETTE);
    const hex = count(t, HEX);
    if (paleta || hex) atual[rel(f)] = { paleta, hex };
  }

  if (process.env.UPDATE_DESIGN_BASELINE) {
    it("atualiza o limite", () => {
      fs.writeFileSync(BASELINE_FILE, JSON.stringify(Object.fromEntries(Object.entries(atual).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
    });
    return;
  }

  const base: Record<string, { paleta: number; hex: number }> = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));

  it("nenhum arquivo ganhou classe de paleta ou cor hexadecimal", () => {
    const subiu: string[] = [];
    for (const [f, n] of Object.entries(atual)) {
      const b = base[f] ?? { paleta: 0, hex: 0 };
      if (n.paleta > b.paleta) subiu.push(`${f}: paleta ${b.paleta} → ${n.paleta} (use os tokens do DESIGN.md: text-foreground, bg-muted, text-crit…)`);
      if (n.hex > b.hex) subiu.push(`${f}: hex ${b.hex} → ${n.hex} (use var(--color-…) ou um token)`);
    }
    expect(subiu).toEqual([]);
  });

  it("o limite está atualizado (quem migrou, registra)", () => {
    const desceu: string[] = [];
    for (const [f, b] of Object.entries(base)) {
      const n = atual[f] ?? { paleta: 0, hex: 0 };
      if (n.paleta < b.paleta || n.hex < b.hex) desceu.push(`${f}: paleta ${b.paleta} → ${n.paleta}, hex ${b.hex} → ${n.hex}`);
    }
    expect(desceu).toEqual([]); // rode: UPDATE_DESIGN_BASELINE=1 npx jest lib/__tests__/design-guard
  });
});

// ── 3) erros mecânicos ─────────────────────────────────────────────────────────────────────────────────────────────────────────
type Mecanico = { selectNativo: number; corNativa: number; alertConfirm: number; transicaoV4: number };
const MECANICO_FILE = path.join(__dirname, "design-mecanico-baseline.json");
const SELECT_NATIVO = /<select[\s>]/g;
const COR_NATIVA = /type=["']color["']/g;
const ALERT_CONFIRM = /(?<![A-Za-z0-9_$.])(?:window\.)?(?:alert|confirm)\s*\(/g;

// No Tailwind v4, `translate-*` e `scale-*` usam as propriedades CSS `translate` e `scale`; uma lista `transition-[…,transform]` não as cobre
// e o movimento estala em vez de deslizar. Heurística por linha: lista com `transform` e sem `translate`/`scale`, na mesma linha de um utilitário translate-/scale-.
function transicaoV4(text: string): number {
  let n = 0;
  for (const line of text.split("\n")) {
    const m = line.match(/transition-\[([^\]]*)\]/);
    if (!m || !/transform/.test(m[1]) || /(?:translate|scale)/.test(m[1])) continue;
    if (/(?<![\w-])(?:[a-z-]+:)*-?(?:translate|scale)-/.test(line.replace(m[0], ""))) n++;
  }
  return n;
}

describe("design: erros mecânicos (limite que só desce)", () => {
  const atual: Record<string, Mecanico> = {};
  for (const f of files) {
    const t = read(f);
    const n: Mecanico = { selectNativo: count(t, SELECT_NATIVO), corNativa: count(t, COR_NATIVA), alertConfirm: count(t, ALERT_CONFIRM), transicaoV4: transicaoV4(t) };
    if (n.selectNativo || n.corNativa || n.alertConfirm || n.transicaoV4) atual[rel(f)] = n;
  }
  const ZERO: Mecanico = { selectNativo: 0, corNativa: 0, alertConfirm: 0, transicaoV4: 0 };
  const DICA: Record<keyof Mecanico, string> = {
    selectNativo: "<select> nativo abre com o visual do sistema: use o Select do projeto (components/ui/select)",
    corNativa: 'type="color" abre com o visual do sistema e sem movimento: use o OtherColor (components/map/ColorPicker)',
    alertConfirm: "alert()/confirm() travam a página e não seguem o design: use o aviso com desfazer ou o Dialog",
    transicaoV4: "transition-[…transform] não cobre translate-/scale- no Tailwind v4: use transition-transform ou liste translate e scale",
  };

  if (process.env.UPDATE_DESIGN_BASELINE) {
    it("atualiza o limite dos erros mecânicos", () => {
      fs.writeFileSync(MECANICO_FILE, JSON.stringify(Object.fromEntries(Object.entries(atual).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
    });
    return;
  }

  const base: Record<string, Mecanico> = JSON.parse(fs.readFileSync(MECANICO_FILE, "utf8"));

  it("nenhum arquivo ganhou um erro mecânico", () => {
    const subiu: string[] = [];
    for (const [f, n] of Object.entries(atual)) {
      const b = base[f] ?? ZERO;
      for (const k of Object.keys(ZERO) as (keyof Mecanico)[]) if (n[k] > b[k]) subiu.push(`${f}: ${k} ${b[k]} → ${n[k]} (${DICA[k]})`);
    }
    expect(subiu).toEqual([]);
  });

  it("o limite dos erros mecânicos está atualizado (quem corrigiu, registra)", () => {
    const desceu: string[] = [];
    for (const [f, b] of Object.entries(base)) {
      const n = atual[f] ?? ZERO;
      for (const k of Object.keys(ZERO) as (keyof Mecanico)[]) if (n[k] < b[k]) desceu.push(`${f}: ${k} ${b[k]} → ${n[k]}`);
    }
    expect(desceu).toEqual([]); // rode: UPDATE_DESIGN_BASELINE=1 npx jest lib/__tests__/design-guard
  });
});
