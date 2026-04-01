import heroImg from "@/assets/hero-market.jpg";

const WHATSAPP_URL = "https://wa.me/22300000000?text=Bonjour%20Lamine%20Market%2C%20je%20souhaite%20passer%20une%20commande";

const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroImg}
        alt="Produits frais du marché - poulets, œufs, poissons et produits ménagers"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 text-center px-4 max-w-3xl animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight mb-4">
          Vos produits frais et essentiels livrés rapidement
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
          Œufs, poissons, poulets, viande et produits ménagers — qualité garantie à Bamako.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#produits"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Voir les produits
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp text-whatsapp-foreground px-8 py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            📲 Commander maintenant
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
