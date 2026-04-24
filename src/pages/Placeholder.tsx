export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="card-shell mt-4">
      <div className="chip-uppercase mb-3">Bientôt</div>
      <h2 className="display text-[24px] font-medium mb-2">{title}</h2>
      <p className="text-ink-3 text-[13px] max-w-xl">
        Cette page est en cours de construction. Le tableau de bord est la première vue livrée —
        les autres modules suivront (commandes, réservations, menu, équipe…).
      </p>
    </div>
  );
}
