import heroImg from "@/assets/hero-market.jpg";
import { useParallax } from "@/hooks/useParallax";
import { useReveal } from "@/hooks/useReveal";

const WHATSAPP_URL = "https://wa.me/22300000000?text=Bonjour%20Lamine%20Market%2C%20je%20souhaite%20passer%20une%20commande";

const WhatsAppCTA = () => {
  const offset = useParallax(0.2);
  const sectionRef = useReveal();

  return (
    <section className="relative py-32 overflow-hidden" ref={sectionRef}>
      {/* Parallax background */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${offset - 100}px)` }}
      >
        <img
          src={heroImg}
          alt=""
          className="w-full h-[140%] object-cover"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80 backdrop-blur-sm" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto reveal">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6 leading-tight">
            Prêt à commander ?
            <br />
            <span className="text-primary-foreground/80">C'est simple et rapide.</span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto">
            Envoyez-nous votre liste sur WhatsApp et recevez vos produits directement chez vous à Bamako.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal reveal-delay-1 inline-flex items-center gap-3 bg-primary-foreground text-primary px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander maintenant
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppCTA;
