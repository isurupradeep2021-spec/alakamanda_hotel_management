function FeaturePage({ title, subtitle, items = [] }) {
  return (
    <div className="module-page">
      <div className="module-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="module-grid">
        {items.map((item) => (
          <article key={item} className="module-card">
            <i className="bi bi-check2-circle" />
            <span>{item}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export default FeaturePage;
