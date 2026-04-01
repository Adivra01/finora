import eggsImg from "@/assets/eggs.jpg";
import fishImg from "@/assets/fish.jpg";
import chickenImg from "@/assets/chicken.jpg";
import cleaningImg from "@/assets/cleaning.jpg";

const WHATSAPP_BASE = "https://wa.me/22300000000?text=";

const products = [
  {
    category: "🥚 Œufs",
    items: [
      { name: "Plateau d'œufs frais (30 pièces)", price: "2 500 FCFA", image: eggsImg },
    ],
  },
  {
    category: "🐟 Poisson",
    items: [
      { name: "Poisson frais / congelé", price: "Sur demande", image: fishImg },
    ],
  },
  {
    category: "🍖 Viande & Poulets",
    items: [
      { name: "Poulet entier frais", price: "3 500 FCFA", image: chickenImg },
    ],
  },
  {
    category: "🧼 Produits ménagers",
    items: [
      { name: "Savon, Eau de javel, Détergents", price: "À partir de 500 FCFA", image: cleaningImg },
    ],
  },
];

const ProductsSection = () => {
  return (
    <section id="produits" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">Nos Produits</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Des produits de qualité, frais et disponibles pour vous à Bamako.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((cat) =>
            cat.items.map((item) => (
              <div key={item.name} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-accent-foreground bg-accent px-2.5 py-1 rounded-full">
                    {cat.category}
                  </span>
                  <h3 className="mt-3 font-bold text-foreground">{item.name}</h3>
                  <p className="text-primary font-extrabold text-lg mt-1">{item.price}</p>
                  <a
                    href={`${WHATSAPP_BASE}Bonjour%2C%20je%20voudrais%20commander%20%3A%20${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center bg-whatsapp text-whatsapp-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Commander sur WhatsApp
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
