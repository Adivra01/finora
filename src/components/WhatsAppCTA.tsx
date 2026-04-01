const WHATSAPP_URL = "https://wa.me/22300000000?text=Bonjour%20Lamine%20Market%2C%20je%20souhaite%20passer%20une%20commande";

const WhatsAppCTA = () => {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-4">
          Commandez facilement via WhatsApp
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
          Envoyez-nous votre liste et recevez vos produits rapidement. C'est simple et rapide !
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-card text-primary px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-shadow"
        >
          📲 Commander maintenant
        </a>
      </div>
    </section>
  );
};

export default WhatsAppCTA;
