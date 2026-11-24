import { useState } from 'react';

type SpecialtyCategory = 'todas' | 'saude-mental' | 'amizades-exclusao' | 'trabalho';

interface SpecialtyItem {
  number: string;
  category: Exclude<SpecialtyCategory, 'todas'>;
  categoryLabel: string;
  title: string;
  summary: string;
  outcome: string;
  featured?: boolean;
}

const CATEGORIES: { id: SpecialtyCategory; label: string }[] = [
  { id: 'todas', label: 'Todas as frentes' },
  { id: 'saude-mental', label: 'Saúde Mental' },
  { id: 'amizades-exclusao', label: 'Exclusão e Amizades' },
  { id: 'trabalho', label: 'Trabalho e Propósito' },
];

const SPECIALTIES: SpecialtyItem[] = [
  {
    number: '01.',
    category: 'saude-mental',
    categoryLabel: 'Saúde Mental e Esperança',
    title: 'Tristeza profunda, vazio e reconstrução de motivos para viver',
    summary:
      'Acolhimento cuidadoso para momentos em que o cansaço emocional tira a vontade de seguir. Caminhamos passo a passo para aliviar a dor, fortalecer sua saúde mental e resgatar sentidos reais para a sua vida.',
    outcome: 'Escuta clínica acolhedora · Plano de cuidado contínuo',
    featured: true,
  },
  {
    number: '02.',
    category: 'amizades-exclusao',
    categoryLabel: 'Pertencimento e Acolhimento',
    title: 'Exclusão social, solidão e feridas de rejeição',
    summary:
      'Um espaço seguro para elaborar a dor de se sentir deixado de lado, isolado ou incompreendido em grupos, ambientes escolares, familiares ou comunitários.',
    outcome: 'Fortalecimento da autoestima e senso de valor próprio',
  },
  {
    number: '03.',
    category: 'amizades-exclusao',
    categoryLabel: 'Relações Interpessoais',
    title: 'Amizades, confiança e construção de vínculos saudáveis',
    summary:
      'Apoio para quem enfrenta dificuldade em fazer ou manter amizades, lida com decepções afetivas ou precisa aprender a colocar limites sem medo de ficar só.',
    outcome: 'Comunicação assertiva e relações mais genuínas',
  },
  {
    number: '04.',
    category: 'trabalho',
    categoryLabel: 'Trabalho e Saúde Ocupacional',
    title: 'Pressão no trabalho, burnout e ambientes desgastantes',
    summary:
      'Cuidado psicológico para sobrecarga profissional, medo de falhar, conflitos ou exclusão no trabalho e desgaste emocional que invade a vida pessoal.',
    outcome: 'Prevenção do esgotamento e limites saudáveis',
    featured: true,
  },
  {
    number: '05.',
    category: 'saude-mental',
    categoryLabel: 'Regulação Emocional',
    title: 'Ansiedade, crises de angústia e cuidado preventivo da saúde mental',
    summary:
      'Ferramentas da Terapia Cognitivo-Comportamental para acalmar pensamentos acelerados, melhorar a qualidade do descanso e criar uma rotina emocionalmente sustentável.',
    outcome: 'Terapia Cognitivo-Comportamental (TCC) · Sessões de 50 min',
    featured: true,
  },
  {
    number: '06.',
    category: 'trabalho',
    categoryLabel: 'Vocação, Fé e Recomeços',
    title: 'Desemprego, transições de carreira e propósito com fé',
    summary:
      'Acompanhamento em momentos de incerteza profissional, perdas ou recomeços, integrando quando você desejar os seus valores e sua espiritualidade como fonte de força.',
    outcome: 'Direção prática com respeito à sua história e fé',
  },
];

interface ApproachSectionProps {
  onSelectTopic: (topicTitle: string) => void;
}

export function ApproachSection({ onSelectTopic }: ApproachSectionProps) {
  const [activeCategory, setActiveCategory] = useState<SpecialtyCategory>('todas');

  const visibleItems =
    activeCategory === 'todas'
      ? SPECIALTIES
      : SPECIALTIES.filter((item) => item.category === activeCategory);

  const gridClass =
    activeCategory === 'todas'
      ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
      : 'grid grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <section id="abordagem" className="py-16 md:py-24 border-b border-stone-200/80">
      <div className="max-w-[1200px] mx-auto px-6 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-medium text-[#525854]">
              Cuidado integral
            </p>
            <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
              Saúde mental, vínculos e propósito caminhando juntos.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-5 text-base text-[#525854] leading-[1.7]">
            <p>
              Nossa saúde emocional é diretamente atravessada pelo que vivemos no trabalho, nas amizades, nos momentos de exclusão e nas nossas convicções mais profundas. Na clínica, utilizamos a <strong className="font-semibold text-[#1C1F1D]">Terapia Cognitivo-Comportamental (TCC)</strong> integrada à <strong className="font-semibold text-[#1C1F1D]">Terapia de Aceitação e Compromisso (ACT)</strong>.
            </p>
            <p>
              Mais do que aliviar crises pontuais, construímos juntos caminhos reais para fortalecer sua mente, curar feridas relacionais e devolver esperança ao seu cotidiano.
            </p>
          </div>
        </div>

        <div id="especialidades" className="space-y-8 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-2xl md:text-[28px] font-normal text-[#1C1F1D] tracking-[-0.01em]">
                Temas e frentes de acolhimento
              </h3>
              <p className="text-sm text-[#525854]">
                Filtre por tema para ver como trabalhamos saúde mental, exclusão, amizades e trabalho.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filtrar especialidades clínicas"
              className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EFEFEA] rounded-lg border border-stone-200/80"
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                      isActive
                        ? 'bg-white text-[#1C1F1D] shadow-xs'
                        : 'text-[#525854] hover:text-[#1C1F1D]'
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={gridClass}>
            {visibleItems.map((item) => {
              const spanClass =
                activeCategory === 'todas' && item.featured
                  ? 'md:col-span-2'
                  : 'md:col-span-1';

              return (
                <article
                  key={item.number}
                  className={`${spanClass} bg-white border border-stone-200 rounded-xl p-7 md:p-8 flex flex-col justify-between gap-6 transition-colors duration-150 hover:border-stone-300`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-[#525854]">
                      <span className="font-semibold text-[#1F4E43] tabular-nums">
                        {item.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.categoryLabel}</span>
                    </div>

                    <h4 className="font-display text-xl md:text-2xl font-normal text-[#1C1F1D] leading-[1.25] [text-wrap:balance]">
                      {item.title}
                    </h4>

                    <p className="text-[15px] text-[#525854] leading-[1.65]">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-[#525854]">
                      {item.outcome}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectTopic(item.title)}
                      className="text-xs font-semibold text-[#1F4E43] hover:text-[#173B32] underline underline-offset-4 decoration-[#1F4E43]/40 hover:decoration-[#1F4E43] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] rounded-sm"
                    >
                      Conversar sobre isso
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
