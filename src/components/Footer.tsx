export function Footer() {
  return (
    <footer className="bg-[#EFEFEA] border-t border-stone-200 py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-2">
            <p className="font-display text-lg font-medium text-[#1C1F1D]">
              Dra. Gabriella
            </p>
            <p className="text-sm text-[#525854] tabular-nums">
              Psicóloga Clínica · CRP 06/148920
            </p>
            <p className="text-sm text-[#525854]">
              Alameda Lorena, 800, cj. 42 · Jardins, São Paulo
            </p>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <p className="font-medium text-[#1C1F1D]">Navegação</p>
            <ul className="space-y-1.5 text-[#525854]">
              <li>
                <a href="#abordagem" className="hover:text-[#1C1F1D] transition-colors">
                  Abordagem
                </a>
              </li>
              <li>
                <a href="#conversar-agora" className="hover:text-[#1C1F1D] transition-colors">
                  Conversar agora
                </a>
              </li>
              <li>
                <a href="#pacientes" className="hover:text-[#1C1F1D] transition-colors">
                  Pacientes para atender
                </a>
              </li>
              <li>
                <a href="#momento-com-deus" className="hover:text-[#1C1F1D] transition-colors">
                  Momento com Deus
                </a>
              </li>
              <li>
                <a href="#sobre" className="hover:text-[#1C1F1D] transition-colors">
                  Sobre a psicóloga
                </a>
              </li>
              <li>
                <a href="#duvidas" className="hover:text-[#1C1F1D] transition-colors">
                  Dúvidas frequentes
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2 text-sm">
            <p className="font-medium text-[#1C1F1D]">Atenção e emergência</p>
            <p className="text-[#525854] leading-[1.6]">
              Este site não oferece atendimento imediato de urgência ou emergência psiquiátrica. Em situações de crise emocional aguda, entre em contato com o Centro de Valorização da Vida (CVV) ligando gratuitamente para o número <strong className="font-semibold text-[#1C1F1D] tabular-nums">188</strong> (24 horas) ou procure o pronto-socorro mais próximo.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#525854]">
          <p className="tabular-nums">
            © 2026 Dra. Gabriella Psicologia Clínica. Todos os direitos reservados.
          </p>
          <p>
            Atendimento ético conforme o Código de Ética Profissional do Psicólogo (CFP).
          </p>
        </div>
      </div>
    </footer>
  );
}
