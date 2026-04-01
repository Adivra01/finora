import { Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Contactez-nous</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border border-border">
            <Phone className="text-primary mb-3" size={28} />
            <h3 className="font-bold mb-1">WhatsApp</h3>
            <a href="https://wa.me/22300000000" className="text-primary font-semibold hover:underline">
              +223 00 00 00 00
            </a>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border border-border">
            <MapPin className="text-primary mb-3" size={28} />
            <h3 className="font-bold mb-1">Zone de livraison</h3>
            <p className="text-muted-foreground">Bamako et environs</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border border-border">
            <Clock className="text-primary mb-3" size={28} />
            <h3 className="font-bold mb-1">Horaires</h3>
            <p className="text-muted-foreground">Lun – Sam : 7h – 19h</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
