import { useCountUp } from "@/hooks/useCountUp";

const stats = [
  { value: 500, suffix: "+", label: "Clients satisfaits" },
  { value: 1200, suffix: "+", label: "Commandes livrées" },
  { value: 4, suffix: "", label: "Catégories de produits" },
  { value: 7, suffix: "j/7", label: "Disponibilité" },
];

const StatItem = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-extrabold text-primary">
        {count}{suffix}
      </p>
      <p className="text-muted-foreground text-sm mt-2 font-medium">{label}</p>
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
