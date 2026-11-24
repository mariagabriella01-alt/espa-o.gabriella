import { useState } from 'react';
import { ResilientImage } from './ResilientImage';

type BioTab = 'formacao' | 'primeira-sessao';

export function AboutSection() {
  const [activeTab, setActiveTab] = useState<BioTab>('formacao');

  return (
    <section id="sobre" className="py-16 md:py-24 border-b border-stone-200/80">
      <div className="max-w-[1200px] mx-auto px-6 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[380px] lg:min-h-[520px] rounded-xl overflow-hidden border border-stone-200 bg-[#EFEFEA]">
              <ResilientImage
                src="/src/assets/images/psychologist_portrait_1795525158694.jpg"
                alt="Retrato da Dra. Gabriella, psicóloga clínica, em seu consultório com luz natural"
                fallbackLabel="Dra. Gabriella · CRP 06/148920"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between py-1 space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-medium text-[#525854]">
                <span>Sobre a psicóloga</span>
                <span aria-hidden="true" className="mx-2 text-stone-400">·</span>
                <span className="tabular-nums">9 anos de prática clínica</span>
              </p>

              <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
                Dra. Gabriella
              </h2>

              <p className="text-base text-[#525854] leading-[1.7]">
                Graduada e Mestre em Psicologia Clínica pela Universidade de São Paulo (USP), com especialização em Terapia Cognitivo-Comportamental e formação continuada em Terapia de Aceitação e Compromisso (ACT). Acredito que o cuidado psicológico une ciência, sensibilidade humana e respeito profundo à fé de cada pessoa — ajudando quem chega sem esperança a redescobrir sentido e motivos reais para viver.
              </p>
            </div>

            <div className="space-y-5">
              <div
                role="tablist"
                aria-label="Detalhes sobre formação e primeira sessão"
                className="inline-flex items-center gap-1 p-1 bg-[#EFEFEA] rounded-lg border border-stone-200/80"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'formacao'}
                  onClick={() => setActiveTab('formacao')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                    activeTab === 'formacao'
                      ? 'bg-white text-[#1C1F1D] shadow-xs'
                      : 'text-[#525854] hover:text-[#1C1F1D]'
                  }`}
                >
                  Formação e Percurso
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'primeira-sessao'}
                  onClick={() => setActiveTab('primeira-sessao')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                    activeTab === 'primeira-sessao'
                      ? 'bg-white text-[#1C1F1D] shadow-xs'
                      : 'text-[#525854] hover:text-[#1C1F1D]'
                  }`}
                >
                  Como é a primeira sessão
                </button>
              </div>

              {activeTab === 'formacao' ? (
                <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                  <dl className="divide-y divide-stone-200/70 text-sm">
                    <div className="pb-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="font-medium text-[#1C1F1D]">Mestrado em Psicologia Clínica</dt>
                      <dd className="text-[#525854] tabular-nums">Instituto de Psicologia · USP (2019)</dd>
                    </div>
                    <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="font-medium text-[#1C1F1D]">Especialização em TCC</dt>
                      <dd className="text-[#525854] tabular-nums">AMBAN · HC-FMUSP (2017)</dd>
                    </div>
                    <div className="pt-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="font-medium text-[#1C1F1D]">Atuação e Supervisão</dt>
                      <dd className="text-[#525854] tabular-nums">Consultório particular desde 2017</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3 text-sm text-[#525854] leading-[1.65]">
                  <p className="font-medium text-[#1C1F1D]">
                    Um encontro inicial para acolher sua demanda sem pressa.
                  </p>
                  <p>
                    Nos primeiros 50 minutos, conversamos sobre o que motivou sua busca pela terapia neste momento, seu contexto atual e suas expectativas. Você não precisa ter tudo organizado antes de chegar: construímos juntos um plano inicial de acompanhamento e tiramos todas as dúvidas práticas sobre frequência e horários.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-4">
          <div className="lg:col-span-7">
            <div className="aspect-video rounded-xl overflow-hidden border border-stone-200 bg-[#EFEFEA]">
              <ResilientImage
                src="/src/assets/images/office_detail_corner_1795525159030.jpg"
                alt="Sala de espera silenciosa do consultório nos Jardins com banco de madeira clara, vista para jardim e iluminação suave"
                fallbackLabel="Espaço de acolhimento · Alameda Lorena, Jardins"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium text-[#525854]">
              Consultório presencial e telepsicologia
            </p>
            <h3 className="font-display text-2xl md:text-[28px] font-normal text-[#1C1F1D] leading-[1.2] [text-wrap:balance]">
              Um ambiente pensado para preservar o silêncio e a confidencialidade.
            </h3>
            <p className="text-[15px] text-[#525854] leading-[1.7]">
              Localizado na Alameda Lorena, nos Jardins, o consultório conta com isolamento acústico, sala de espera privativa entre atendimentos e acesso facilitado pela estação Trianon-Masp. Para quem prefere ou mora fora de São Paulo, as sessões online acontecem em sala criptografada com a mesma regularidade clínica.
            </p>
            <div className="pt-2 border-t border-stone-200/80 text-sm text-[#1C1F1D] space-y-1">
              <p className="font-medium">Alameda Lorena, 800, cj. 42 · Jardins, São Paulo</p>
              <p className="text-[#525854] tabular-nums">Atendimento presencial e online · Seg a Sex, 8h às 20h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
