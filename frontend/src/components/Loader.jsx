const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };
  const spinner = (
    <div className={`${sizes[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin`} />
  );

  if (!fullScreen) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      {spinner}
    </div>
  );
};

export default Loader;
