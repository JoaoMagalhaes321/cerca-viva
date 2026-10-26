// Lembrete do Jardim Zen: uma notificação local, todo dia na hora escolhida, para lembrar de regar.
// Só funciona de verdade dentro do app Android (plugin de notificações do Capacitor); no navegador a
// opção aparece desligada com um aviso. Aqui ficam as regras (hora, textos, registro) sem o plugin,
// para dar para testar; quem fala com o plugin é `agendarNoAparelho`/`cancelarNoAparelho`.

export const CHAVE_LEMBRETE = 'pvz_lembrete_zen_v1';
/** Id fixo da notificação (para cancelar/reagendar sempre a mesma). */
export const ID_NOTIFICACAO = 4242;
export const HORA_PADRAO = 19;
export const MINUTO_PADRAO = 0;

export interface Lembrete {
  ligado: boolean;
  hora: number;
  minuto: number;
}

export const TEXTOS = [
  { titulo: '🪴 Hora de regar o Jardim Zen', corpo: 'Suas plantas estão com sede. Regue hoje e ganhe sol extra na próxima batalha.' },
  { titulo: '💧 O jardim pede água', corpo: 'Um minuto de rega agora vale +25☀️ amanhã. Os zumbis não descansam.' },
  { titulo: '🌱 Cerca Viva: regou hoje?', corpo: 'O Lírio Prisma está murchando de saudade. Passa lá no Jardim Zen.' }
];

export function lembreteVazio(): Lembrete {
  return { ligado: false, hora: HORA_PADRAO, minuto: MINUTO_PADRAO };
}

export function lerLembrete(armazenamento: Pick<Storage, 'getItem'> = localStorage): Lembrete {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE_LEMBRETE) || 'null');
    if (!r || typeof r !== 'object') return lembreteVazio();
    const hora = Number.isInteger(r.hora) && r.hora >= 0 && r.hora <= 23 ? r.hora : HORA_PADRAO;
    const minuto = Number.isInteger(r.minuto) && r.minuto >= 0 && r.minuto <= 59 ? r.minuto : MINUTO_PADRAO;
    return { ligado: !!r.ligado, hora, minuto };
  } catch {
    return lembreteVazio();
  }
}

export function salvarLembrete(l: Lembrete, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE_LEMBRETE, JSON.stringify(l));
  } catch {
    /* sem armazenamento */
  }
}

/** "19:00" ↔ {hora, minuto}. */
export function lerHorario(texto: string): { hora: number; minuto: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const hora = Number(m[1]);
  const minuto = Number(m[2]);
  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return null;
  return { hora, minuto };
}

export function formatarHorario(l: Pick<Lembrete, 'hora' | 'minuto'>): string {
  return `${String(l.hora).padStart(2, '0')}:${String(l.minuto).padStart(2, '0')}`;
}

/** Texto do dia: varia com a data, para a notificação não ser sempre igual. */
export function textoDoDia(data: Date = new Date()): { titulo: string; corpo: string } {
  const n = data.getFullYear() * 366 + data.getMonth() * 31 + data.getDate();
  return TEXTOS[n % TEXTOS.length];
}

/** Próximo disparo a partir de `agora` (hoje, se a hora ainda não passou; senão amanhã). */
export function proximoDisparo(l: Pick<Lembrete, 'hora' | 'minuto'>, agora: Date = new Date()): Date {
  const d = new Date(agora);
  d.setHours(l.hora, l.minuto, 0, 0);
  if (d.getTime() <= agora.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/** Dentro do app (Capacitor) as notificações locais funcionam; no navegador, não. */
export function dentroDoApp(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

// ---------- Plugin (só no aparelho) ----------

type PluginNotificacoes = {
  requestPermissions(): Promise<{ display: string }>;
  schedule(o: { notifications: unknown[] }): Promise<unknown>;
  cancel(o: { notifications: { id: number }[] }): Promise<unknown>;
};

async function plugin(): Promise<PluginNotificacoes | null> {
  if (!dentroDoApp()) return null;
  try {
    const mod = await import('@capacitor/local-notifications');
    return mod.LocalNotifications as unknown as PluginNotificacoes;
  } catch {
    return null;
  }
}

/** Agenda a notificação diária. Devolve 'ok', 'negado' (sem permissão) ou 'indisponivel' (navegador). */
export async function agendarNoAparelho(l: Lembrete): Promise<'ok' | 'negado' | 'indisponivel'> {
  const p = await plugin();
  if (!p) return 'indisponivel';
  const perm = await p.requestPermissions();
  if (perm.display !== 'granted') return 'negado';
  const t = textoDoDia();
  await p.cancel({ notifications: [{ id: ID_NOTIFICACAO }] });
  await p.schedule({
    notifications: [
      {
        id: ID_NOTIFICACAO,
        title: t.titulo,
        body: t.corpo,
        schedule: { on: { hour: l.hora, minute: l.minuto } },
        extra: { abrir: 'zen' }
      }
    ]
  });
  return 'ok';
}

/** Toque na notificação: chama `aoTocar` (abre o Jardim Zen). */
export async function aoTocarNaNotificacao(aoTocar: () => void): Promise<void> {
  if (!dentroDoApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.addListener('localNotificationActionPerformed', () => aoTocar());
  } catch {
    /* sem plugin */
  }
}

export async function cancelarNoAparelho(): Promise<void> {
  const p = await plugin();
  if (!p) return;
  await p.cancel({ notifications: [{ id: ID_NOTIFICACAO }] });
}
