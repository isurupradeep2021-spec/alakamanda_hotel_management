import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESTAURANTS } from '../data/restaurants';

function ViewMenuPage() {
  const [activeType, setActiveType] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(RESTAURANTS.map((i) => i.type)))], []);

  const visibleRestaurants = useMemo(() => {
    if (activeType === 'All') return RESTAURANTS;
    return RESTAURANTS.filter((i) => i.type === activeType);
  }, [activeType]);

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Restaurants & Bars</p>
          <h2>Exceptional Dining</h2>
          <p>Embark on a culinary journey across our signature restaurants, inspired by Cinnamon Life City of Dreams.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-cup-hot" />
          {RESTAURANTS.length} Venues
        </div>
      </div>

      <div className="room-type-tabs">
        {categories.map((type) => (
          <button
            key={type}
            type="button"
            className={`type-tab ${activeType === type ? 'active' : ''}`}
            onClick={() => setActiveType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="room-catalog-grid">
        {visibleRestaurants.map((venue) => (
          <article className="room-catalog-card" key={venue.id}>
            <div className="room-photo-wrap">
              <img src={venue.image} alt={venue.name} className="room-photo" loading="lazy" />
              <span className={`room-status-badge ${venue.status === 'OPEN NOW' ? 'ok' : ''}`} style={{ backgroundColor: venue.status === 'OPEN NOW' ? '' : 'rgba(26,26,26,0.9)', color: venue.status === 'OPEN NOW' ? '' : '#F9F6F0'}}>
                {venue.status}
              </span>
            </div>

            <div className="room-content">
              <p className="room-type">{venue.category}</p>
              <h3>{venue.name}</h3>
              <p className="room-description">{venue.description}</p>

              <div className="room-meta">
                 <span><i className="bi bi-star-fill" style={{color: '#d4af37'}} /> Signature Venue</span>
              </div>

              <Link to={`/restaurant/${venue.id}`} className="room-cta" style={{ marginTop: 'auto' }}>
                Reserve Table / View Menu
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ViewMenuPage;
