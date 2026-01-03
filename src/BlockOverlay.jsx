import "./BlockOverlay.css";

export default function BlockOverlay({ activeBlock }) {
  const blocks = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="overlay-container">
      <div className="overlay-grid">
        {blocks.map((num) => (
          <div
            key={num}
            className={`overlay-block ${
              num === activeBlock ? "block-danger" : "block-safe"
            }`}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}
