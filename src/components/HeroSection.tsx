import { ArrowDownRight } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onChatClick: () => void;
}

const PRACTICE_HIGHLIGHTS = [
  {
    value: '50 min',
    label: 'Duração da sessão',
  },
  {
    value: 'CRP 06/148920',
    label: 'Registro profissional ativo',
  },
  {
    value: 'Presencial e Online',
    label: 'Jardins, São Paulo · Todo o Brasil',
  },
  {
    value: 'Seg a Sex, 8h–20h',
    label: 'Horários regulares de atendimento',
  },
];

export function HeroSection({ onChatClick }: HeroSectionProps) {
  return (
    <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200/80">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div className="space-y-6">
              <p className="text-xs md:text-sm font-medium text-[#525854] tracking-normal">
                <span>Psicologia Clínica e Acolhimento</span>
                <span aria-hidden="true" className="mx-2 text-stone-400">·</span>
                <span className="tabular-nums">CRP 06/148920</span>
                <span aria-hidden="true" className="mx-2 text-stone-400">·</span>
                <span>Presencial e Online</span>
              </p>

              <h1
                className="font-display font-normal text-[#1C1F1D] tracking-[-0.02em] leading-[1.12] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
              >
                Cuidado que acolhe a dor e ajuda você a reencontrar motivos para viver.
              </h1>

              <p className="text-base md:text-[17px] text-[#525854] leading-[1.65] max-w-xl">
                Com a Dra. Gabriella, você encontra um espaço ético e acolhedor para cuidar da saúde mental, elaborar dores de exclusão, fortalecer amizades, lidar com pressões do trabalho e reencontrar propósito com fé.
              </p>
            </div>

            <div className="pt-8 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={onChatClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F8F6]"
              >
                <span>Conversar agora</span>
                <ArrowDownRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>

              <a
                href="#pacientes"
                className="text-sm font-medium text-[#1C1F1D] hover:text-[#1F4E43] underline underline-offset-4 decoration-stone-300 hover:decoration-[#1F4E43] transition-colors duration-150 whitespace-nowrap shrink-0 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] rounded-sm"
              >
                Ver pacientes para atender
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] lg:min-h-[460px] rounded-xl overflow-hidden border border-stone-200 bg-[#EFEFEA]">
              <ResilientImage
                src="/src/assets/images/hero_clinic_space_1795525156913.jpg"
                alt="Consultório de psicologia clínica iluminado com luz natural, poltronas em linho claro e plantas ao lado da janela"
                fallbackLabel="Consultório de Psicologia · Jardins, São Paulo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16 pt-8 border-t border-stone-200/80 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {PRACTICE_HIGHLIGHTS.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="font-display text-lg md:text-xl font-medium text-[#1C1F1D] tabular-nums">
                {item.value}
              </p>
              <p className="text-xs md:text-sm text-[#525854]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
