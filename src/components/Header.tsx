import { useState } from "react";
import { Menu, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/22300000000?text=Bonjour%20Lamine%20Market%2C%20je%20souhaite%20passer%20une%20commande";

const Header = () => {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Accueil", href: "#accueil" },
    { label: "Produits", href: "#produits" },
    { label: "Avantages", href: "#avantages" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#accueil" className="text-xl font-extrabold tracking-tight text-primary">
          🛒 Lamine Market
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {item.label}
            </a>
          ))}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp text-whatsapp-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Commander
          </a>
        </nav>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground" aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden bg-card border-b border-border px-4 pb-4 flex flex-col gap-3">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-sm font-medium text-foreground/80 py-2">
              {item.label}
            </a>
          ))}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp text-whatsapp-foreground px-5 py-2.5 rounded-lg text-sm font-semibold text-center"
          >
            Commander
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
