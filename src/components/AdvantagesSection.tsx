import { Leaf, Truck, BadgeCent, MapPin } from "lucide-react";

const advantages = [
  { icon: Leaf, title: "Produits frais", desc: "Qualité garantie, fraîcheur au quotidien" },
  { icon: Truck, title: "Livraison rapide", desc: "Recevez vos commandes sans attendre" },
  { icon: BadgeCent, title: "Prix accessibles", desc: "Des tarifs adaptés à tous les budgets" },
  { icon: MapPin, title: "Disponibilité locale", desc: "Présents à Bamako et environs" },
];

const AdvantagesSection = () => {
  return (
    <section id="avantages" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((a) => (
            <div key={a.title} className="text-center p-6 rounded-xl bg-accent/50 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                <a.icon size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">{a.title}</h3>
              <p className="text-muted-foreground text-sm">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
