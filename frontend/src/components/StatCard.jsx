const StatCard = ({ label, value, icon: Icon, accent = 'brand' }) => {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="card p-5 flex items-center gap-4 animate-slide-up">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-ink-900 font-display">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
