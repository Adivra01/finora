import heroImg from "@/assets/hero-market.jpg";
import { useParallax } from "@/hooks/useParallax";
import { ArrowDown } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/22300000000?text=Bonjour%20Lamine%20Market%2C%20je%20souhaite%20passer%20une%20commande";

const HeroSection = () => {
  const offset = useParallax(0.4);

  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax background */}
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${offset}px) scale(1.1)` }}
      >
        <img
          src={heroImg}
          alt="Produits frais du marché - poulets, œufs, poissons et produits ménagers"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-5 py-2 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-whatsapp animate-pulse" />
          <span className="text-sm font-medium text-primary-foreground/90">Livraison disponible à Bamako</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-primary-foreground leading-[1.1] mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}>
          Vos produits frais
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
            livrés chez vous
          </span>
        </h1>

        <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-fade-in-up leading-relaxed"
           style={{ animationDelay: "0.2s" }}>
          Œufs, poissons, poulets, viande et produits ménagers — qualité garantie, prix accessibles, livraison rapide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <a
            href="#produits"
            className="bg-primary-foreground text-foreground px-8 py-4 rounded-full font-semibold text-base hover:shadow-2xl hover:shadow-primary-foreground/20 transition-all hover:-translate-y-0.5"
          >
            Découvrir nos produits
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp text-whatsapp-foreground px-8 py-4 rounded-full font-semibold text-base hover:shadow-2xl hover:shadow-whatsapp/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander maintenant
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <a href="#produits" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/50 animate-bounce">
        <ArrowDown size={24} />
      </a>
    </section>
  );
};

export default HeroSection;
