const LETTERS = ["S", "c", "o", "u", "t", "i", "n", "g", ".", ".", "."];

export function AiLoader() {
  return (
    <div className="loader-wrapper">
      <div className="flex items-center">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="loader-letter font-display text-2xl font-medium text-white/80"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="loader" />
    </div>
  );
}
