import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RESTAURANTS } from '../data/restaurants';
import { createDiningBooking } from '../api/service';
import { useAuth } from '../context/AuthContext';

function RestaurantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);

  const [form, setForm] = useState({
    customerName: '',
    contact: '',
    guests: 2,
    bookingDateTime: '',
    category: 'Dinner',
    menuItem: 'Reservation Only',
    quantity: 1,
    unitPrice: 0,
    tableNumber: 1,
    specialRequest: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const found = RESTAURANTS.find(r => r.id === parseInt(id));
    if (found) {
      setRestaurant(found);
      setForm((prev) => ({
        ...prev,
        menuItem: `${found.name} Reservation`,
        customerName: user?.fullName || prev.customerName,
        contact: user?.email || prev.contact
      }));
    }
  }, [id, user?.fullName, user?.email]);

  if (!restaurant) return <div className="module-page"><p>Restaurant not found.</p></div>;

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    // We pass generic details to the operations API.
    const bookingPayload = {
      ...form,
      customerName: user?.fullName || form.customerName,
      contact: user?.email || form.contact,
      status: 'PENDING',
      unitPrice: 0, // Reservations are usually $0 to hold, or a fixed deposit.
    };

    try {
      await createDiningBooking(bookingPayload);
      setSuccessMsg(`Your reservation at ${restaurant.name} has been successfully requested.`);
      setForm((prev) => ({
        ...prev,
        customerName: user?.fullName || prev.customerName,
        contact: user?.email || prev.contact,
        bookingDateTime: '',
        specialRequest: ''
      }));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to make a reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-page dashboard-luxe">
      {/* Restaurant Hero */}
      <div 
        className="dash-hero luxe-hero" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${restaurant.image})`,
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div className="module-head" style={{maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
          <p className="eyebrow" style={{justifyContent: 'center'}}>{restaurant.category}</p>
          <h2 style={{fontSize: '56px', marginBottom: '24px'}}>{restaurant.name}</h2>
          <p style={{fontSize: '18px', lineHeight: '1.6'}}>{restaurant.description}</p>
        </div>
      </div>

      <div className="restaurant-details-container" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '60px', padding: '60px 40px', maxWidth: '1400px', margin: '0 auto'}}>
        
        {/* Left: Description & Details */}
        <div className="restaurant-info">
          <h3 style={{fontFamily: "'Playfair Display', serif", fontSize: '32px', marginBottom: '24px', color: '#1a1a1a'}}>
            The Essence of {restaurant.name}
          </h3>
          <p style={{fontSize: '16px', lineHeight: '1.8', color: '#4a4a4a', marginBottom: '32px'}}>
            {restaurant.longDescription}
          </p>

          <div className="menu-action-row" style={{marginBottom: '40px'}}>
            <a
              href={restaurant.menuPdf}
              target="_blank"
              rel="noreferrer"
              className="menu-action-btn"
            >
              <i className="bi bi-file-earmark-richtext" /> View Full Menu
            </a>
            <a
              href={restaurant.menuPdf}
              download={`${restaurant.name.toLowerCase().replace(/\s+/g, '-')}-menu.pdf`}
              className="menu-action-btn secondary"
            >
              <i className="bi bi-download" /> Download Menu
            </a>
            <button className="menu-action-btn secondary" onClick={() => navigate('/view-menu')}>
              <i className="bi bi-arrow-left" /> Back to All Restaurants
            </button>
          </div>

          <div className="restaurant-meta-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '32px', backgroundColor: '#F9F6F0', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)'}}>
            <div>
              <h4 style={{fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a38c5b', marginBottom: '8px'}}>Opening Hours</h4>
              <p style={{fontSize: '15px', color: '#1a1a1a'}}>Daily: 12:00 PM - 3:00 PM<br/>Evening: 6:00 PM - 11:30 PM</p>
            </div>
            <div>
              <h4 style={{fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a38c5b', marginBottom: '8px'}}>Dress Code</h4>
              <p style={{fontSize: '15px', color: '#1a1a1a'}}>Smart Casual. <br/>Sleeveless shirts and flip-flops are not permitted.</p>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="restaurant-booking-widget" style={{position: 'sticky', top: '40px'}}>
           <div className="crud-card" style={{padding: '32px'}}>
              <h3 style={{fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '8px'}}>Make a Reservation</h3>
              <p style={{fontSize: '14px', color: '#666', marginBottom: '24px'}}>Secure your table at {restaurant.name}.</p>

              {successMsg && <div style={{padding: '12px', backgroundColor: '#e2f5e9', color: '#1e7e34', borderRadius: '4px', marginBottom: '20px', fontSize: '14px'}}>{successMsg}</div>}
              {errorMsg && <div style={{padding: '12px', backgroundColor: '#fdf1f1', color: '#e74c3c', borderRadius: '4px', marginBottom: '20px', fontSize: '14px'}}>{errorMsg}</div>}

              <form className="crud-form" onSubmit={handleBook}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="John Doe" />
                </div>
                
                <div className="form-group">
                  <label>Contact (Email or Phone)</label>
                  <input type="text" required value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="john@email.com or +1 234 567 890" />
                </div>

                <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                  <div className="form-group">
                    <label>Guests</label>
                    <input type="number" min="1" required value={form.guests} onChange={e => setForm({...form, guests: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Meal</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Preferred Table Number (Optional)</label>
                  <input type="number" min="1" value={form.tableNumber} onChange={e => setForm({...form, tableNumber: Number(e.target.value)})} />
                </div>

                <div className="form-group">
                  <label>Date & Time</label>
                  <input type="datetime-local" required value={form.bookingDateTime} onChange={e => setForm({...form, bookingDateTime: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Special Requests</label>
                  <textarea rows="2" value={form.specialRequest} onChange={e => setForm({...form, specialRequest: e.target.value})} placeholder="Anniversary, dietary requirements..."></textarea>
                </div>

                <button type="submit" className="primary-btn" style={{width: '100%', marginTop: '16px'}} disabled={loading}>
                  {loading ? 'Requesting...' : 'Request Reservation'}
                </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
}

export default RestaurantDetailsPage;
