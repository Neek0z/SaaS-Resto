import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CardLink({ to, label = "Voir tout" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="mt-3 inline-flex items-center gap-[6px] text-[11.5px] text-ink-3 hover:text-ember-soft transition-colors font-semibold uppercase tracking-[0.08em] group"
    >
      {label}
      <ArrowRight
        size={12}
        className="transition-transform group-hover:translate-x-[2px]"
      />
    </Link>
  );
}
