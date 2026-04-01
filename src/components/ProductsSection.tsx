import { useReveal } from "@/hooks/useReveal";
import eggsImg from "@/assets/eggs.jpg";
import fishImg from "@/assets/fish.jpg";
import chickenImg from "@/assets/chicken.jpg";
import cleaningImg from "@/assets/cleaning.jpg";

const WHATSAPP_BASE = "https://wa.me/22300000000?text=";

const products = [
  {
    category: "Œufs",
    emoji: "🥚",
    items: [
      { name: "Plateau d'œufs frais (30 pièces)", price: "2 500 FCFA", image: eggsImg },
    ],
  },
  {
    category: "Poisson",
    emoji: "🐟",
    items: [
      { name: "Poisson frais / congelé", price: "Sur demande", image: fishImg },
    ],
  },
  {
    category: "Viande & Poulets",
    emoji: "🍖",
    items: [
      { name: "Poulet entier frais", price: "3 500 FCFA", image: chickenImg },
    ],
  },
  {
    category: "Produits ménagers",
    emoji: "🧼",
    items: [
      { name: "Savon, Eau de javel, Détergents", price: "À partir de 500 FCFA", image: cleaningImg },
    ],
  },
];

const ProductsSection = () => {
  const sectionRef = useReveal();

  return (
    <section id="produits" className="py-24 lg:py-32 bg-background" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Catalogue
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Nos Produits
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Des produits de qualité, frais et disponibles pour vous à Bamako.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((cat, catIdx) =>
            cat.items.map((item) => (
              <div
                key={item.name}
                className={`reveal reveal-delay-${catIdx + 1} group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 card-shine`}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground px-3 py-1.5 rounded-full border border-border">
                      {cat.emoji} {cat.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 lg:p-6">
                  <h3 className="font-bold text-foreground text-base leading-snug">{item.name}</h3>
                  <p className="text-primary font-extrabold text-xl mt-2">{item.price}</p>
                  <a
                    href={`${WHATSAPP_BASE}Bonjour%2C%20je%20voudrais%20commander%20%3A%20${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Commander
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
