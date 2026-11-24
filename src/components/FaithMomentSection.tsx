import { useState } from 'react';
import { PhoneCall } from 'lucide-react';

type MoodMoment = 'forca' | 'exclusao' | 'ansiedade' | 'recomeco' | 'paz';

interface DevotionalEntry {
  id: MoodMoment;
  tabLabel: string;
  verseText: string;
  verseReference: string;
  reflectionTitle: string;
  reflectionBody: string;
  prayer: string;
}

const DEVOTIONAL_ENTRIES: DevotionalEntry[] = [
  {
    id: 'forca',
    tabLabel: 'Quando faltar força',
    verseText:
      '“Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.”',
    verseReference: 'Salmos 34:18',
    reflectionTitle: 'Você não precisa carregar tudo sozinho hoje.',
    reflectionBody:
      'Mesmo nos dias em que a dor parece maior do que a vontade de continuar, a sua vida tem valor único. Buscar ajuda psicológica e descansar em Deus não é sinal de fraqueza — é um passo corajoso de cuidado e preservação da sua história.',
    prayer:
      'Senhor, nos momentos em que o cansaço pesa e não vejo saída sozinho, segura a minha mão, renova o meu fôlego e coloca ao meu lado pessoas que me ajudem a seguir com esperança.',
  },
  {
    id: 'exclusao',
    tabLabel: 'Quando se sentir excluído',
    verseText:
      '“Ainda que me deixem, o Senhor me acolherá.”',
    verseReference: 'Salmos 27:10',
    reflectionTitle: 'A rejeição dos outros não define o seu valor.',
    reflectionBody:
      'Sentir-se deixado de lado em amizades, grupos ou no trabalho machuca profundamente. Mas o olhar humano limitado não mede quem você é. Você merece vínculos verdadeiros onde possa ser ouvido com respeito e pertencimento.',
    prayer:
      'Deus, cura as feridas da rejeição e da solidão em mim. Ajuda-me a enxergar o meu valor com bondade e aproxima da minha caminhada amizades sinceras e saudáveis.',
  },
  {
    id: 'ansiedade',
    tabLabel: 'Em meio à ansiedade',
    verseText:
      '“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo.”',
    verseReference: 'Isaías 41:10',
    reflectionTitle: 'Respire devagar: este momento difícil vai passar.',
    reflectionBody:
      'A ansiedade tenta convencer a mente de que tudo precisa ser resolvido agora. Permita-se voltar para o presente, soltar os ombros e lembrar que cada dia traz a sua própria medida de graça e clareza.',
    prayer:
      'Deus de paz, acalma os meus pensamentos acelerados, aquieta o meu coração e dá-me serenidade para dar apenas um passo de cada vez hoje.',
  },
  {
    id: 'recomeco',
    tabLabel: 'Para recomeçar',
    verseText:
      '“Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.”',
    verseReference: 'Jeremias 29:11',
    reflectionTitle: 'A sua história ainda tem capítulos de reconstrução.',
    reflectionBody:
      'Feridas antigas e frustrações não definem o seu futuro. Com apoio clínico e acolhimento espiritual, é possível transformar o sofrimento em aprendizado, resgatar sonhos e descobrir novos motivos para viver.',
    prayer:
      'Pai, ajuda-me a olhar para frente com esperança. Cura as marcas do que doeu até aqui e abre diante de mim um caminho de propósito, dignidade e recomeço.',
  },
  {
    id: 'paz',
    tabLabel: 'Descanso na alma',
    verseText:
      '“Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.”',
    verseReference: 'Mateus 11:28',
    reflectionTitle: 'Um convite para pausar sem culpa.',
    reflectionBody:
      'Você não precisa provar o seu valor pelo quanto aguenta em silêncio. Tire alguns minutos agora para respirar fundo, acolher o que sente com sinceridade e receber descanso para a sua mente.',
    prayer:
      'Senhor Jesus, entrego a Ti o peso que tenho carregado em silêncio. Concede descanso à minha alma, lucidez para cuidar da minha saúde e alegria nas pequenas coisas do dia.',
  },
];

interface FaithMomentSectionProps {
  onBookClick: () => void;
}

export function FaithMomentSection({ onBookClick }: FaithMomentSectionProps) {
  const [selectedMoment, setSelectedMoment] = useState<MoodMoment>('forca');

  const current =
    DEVOTIONAL_ENTRIES.find((entry) => entry.id === selectedMoment) ??
    DEVOTIONAL_ENTRIES[0];

  return (
    <section
      id="momento-com-deus"
      className="py-16 md:py-24 bg-[#EFEFEA] border-b border-stone-200/80"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-6 space-y-3">
            <p className="text-xs font-medium text-[#525854]">
              Espiritualidade, propósito e esperança
            </p>
            <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
              Um momento com Deus para renovar suas forças.
            </h2>
          </div>

          <div className="lg:col-span-6">
            <p className="text-[15px] text-[#525854] leading-[1.7]">
              Cuidar da saúde mental e fortalecer a fé podem caminhar juntos. Escolha como o seu coração está hoje para ler uma palavra de conforto, refletir com calma e fazer uma breve oração.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div
            role="tablist"
            aria-label="Escolha uma reflexão para o seu momento"
            className="flex flex-wrap items-center gap-2"
          >
            {DEVOTIONAL_ENTRIES.map((entry) => {
              const isActive = entry.id === selectedMoment;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedMoment(entry.id)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                    isActive
                      ? 'bg-[#1F4E43] border-[#1F4E43] text-white'
                      : 'bg-white border-stone-200 text-[#525854] hover:text-[#1C1F1D] hover:border-stone-300'
                  }`}
                >
                  {entry.tabLabel}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-7 md:p-10 flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-xs font-medium text-[#1F4E43]">
                  Palavra para hoje · {current.verseReference}
                </p>
                <blockquote className="font-display text-2xl md:text-[28px] font-normal text-[#1C1F1D] leading-[1.35] [text-wrap:balance]">
                  {current.verseText}
                </blockquote>
              </div>

              <div className="pt-6 border-t border-stone-200/80 space-y-2">
                <h3 className="text-base font-semibold text-[#1C1F1D]">
                  {current.reflectionTitle}
                </h3>
                <p className="text-[15px] text-[#525854] leading-[1.7]">
                  {current.reflectionBody}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#1F4E43] text-white rounded-xl p-7 md:p-10 flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-xs font-medium text-white/80 tracking-[0.01em]">
                  Oração e pausa de respiração
                </p>
                <p className="font-display text-xl md:text-[22px] font-normal leading-[1.45] text-white tracking-[0.01em]">
                  “{current.prayer}”
                </p>
              </div>

              <div className="pt-6 border-t border-white/15 space-y-4">
                <p className="text-xs text-white/85 leading-[1.6]">
                  Se você está passando por um momento de dor profunda e precisa conversar com alguém agora, você não está sozinho.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onBookClick}
                    className="px-4 py-2.5 text-xs font-semibold text-[#1C1F1D] bg-white hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Conversar com Dra. Gabriella
                  </button>

                  <a
                    href="tel:188"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white border border-white/30 hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Apoio gratuito 24h · CVV 188</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
