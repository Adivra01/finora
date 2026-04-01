import { Leaf, Truck, BadgeCent, MapPin } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const advantages = [
  {
    icon: Leaf,
    title: "Produits frais",
    desc: "Sélectionnés avec soin chaque jour pour garantir une qualité irréprochable.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: Truck,
    title: "Livraison rapide",
    desc: "Recevez vos commandes rapidement, directement à votre porte à Bamako.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: BadgeCent,
    title: "Prix accessibles",
    desc: "Des tarifs compétitifs adaptés à tous les budgets, sans compromis sur la qualité.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: MapPin,
    title: "100% Local",
    desc: "Une entreprise locale qui comprend vos besoins et livre dans votre quartier.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
];

const AdvantagesSection = () => {
  const sectionRef = useReveal();

  return (
    <section id="avantages" className="py-24 lg:py-32 bg-background" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Pourquoi nous
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Pourquoi choisir Lamine Market ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Nous nous engageons à vous offrir le meilleur service possible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {advantages.map((a, i) => (
            <div
              key={a.title}
              className={`reveal reveal-delay-${i + 1} group p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${a.color} border mb-6 group-hover:scale-110 transition-transform`}>
                <a.icon size={24} />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">{a.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
