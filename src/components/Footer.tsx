import { ShoppingBag } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag size={16} className="text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold text-primary-foreground">
              Lamine<span className="text-primary">Market</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#accueil" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Accueil</a>
            <a href="#produits" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Produits</a>
            <a href="#avantages" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Avantages</a>
            <a href="#contact" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Contact</a>
          </div>

          <p className="text-primary-foreground/40 text-sm">
            © {new Date().getFullYear()} Lamine Market · Bamako, Mali 🇲🇱
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
