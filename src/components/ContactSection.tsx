import { Phone, MapPin, Clock } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const contacts = [
  {
    icon: Phone,
    title: "WhatsApp",
    content: (
      <a href="https://wa.me/22300000000" className="text-primary font-semibold hover:underline text-lg">
        +223 00 00 00 00
      </a>
    ),
    desc: "Réponse rapide garantie",
  },
  {
    icon: MapPin,
    title: "Zone de livraison",
    content: <span className="text-foreground font-semibold text-lg">Bamako et environs</span>,
    desc: "Livraison à domicile",
  },
  {
    icon: Clock,
    title: "Horaires",
    content: <span className="text-foreground font-semibold text-lg">Lun – Sam : 7h – 19h</span>,
    desc: "Dimanche sur demande",
  },
];

const ContactSection = () => {
  const sectionRef = useReveal();

  return (
    <section id="contact" className="py-24 lg:py-32 bg-muted/30" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Contact
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Contactez-nous
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            N'hésitez pas à nous contacter pour toute question ou commande.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {contacts.map((c, i) => (
            <div
              key={c.title}
              className={`reveal reveal-delay-${i + 1} flex flex-col items-center text-center p-8 bg-card rounded-2xl border border-border hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <c.icon size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{c.title}</h3>
              {c.content}
              <p className="text-muted-foreground text-sm mt-2">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
