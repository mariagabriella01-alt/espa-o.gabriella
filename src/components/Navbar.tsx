import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onBookClick: () => void;
}

const NAV_LINKS = [
  { href: '#abordagem', label: 'Abordagem' },
  { href: '#momento-com-deus', label: 'Momento com Deus' },
  { href: '#conversar-agora', label: 'Conversar agora' },
  { href: '#pacientes', label: 'Pacientes' },
  { href: '#sobre', label: 'Sobre' },
];

export function Navbar({ onBookClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileNav = (href: string) => {
    setMobileOpen(false);
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F8F6]/95 backdrop-blur-sm border-b border-stone-200/80">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#"
          className="font-display text-lg font-medium tracking-tight text-[#1C1F1D] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] rounded-sm"
        >
          Dra. Gabriella
        </a>

        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#525854]"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#1C1F1D] underline-offset-4 hover:underline transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F8F6]"
          >
            Agendar consulta
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#1C1F1D] hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#F8F8F6] px-6 py-4 space-y-2">
          <nav aria-label="Navegação mobile" className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleMobileNav(item.href);
                }}
                className="py-2.5 text-base font-medium text-[#1C1F1D] hover:text-[#1F4E43] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBookClick();
              }}
              className="w-full py-3 px-5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] rounded-lg transition-colors cursor-pointer"
            >
              Agendar consulta
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
