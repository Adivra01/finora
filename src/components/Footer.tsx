const Footer = () => {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Lamine Market. Tous droits réservés.</p>
        <p className="mt-1">Bamako, Mali 🇲🇱</p>
      </div>
    </footer>
  );
};

export default Footer;
