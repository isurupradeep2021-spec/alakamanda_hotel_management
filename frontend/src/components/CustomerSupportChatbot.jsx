import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askChatbot } from '../api/service';

const promptMap = {
  '/view-rooms': 'Try: "how many available rooms?" or "my room bookings"',
  '/book-room': 'Try: "room price" or "available room types"',
  '/view-menu': 'Try: "popular menu items" or "my dining bookings"',
  '/book-event': 'Try: "my event bookings" or "event status"',
  '/profile': 'Try: "my room bookings", "my dining bookings", "my event bookings"'
};

function CustomerSupportChatbot() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { by: 'bot', text: 'Hello! I can help with rooms, events, restaurant bookings, and menu questions.' }
  ]);
  const [loading, setLoading] = useState(false);

  const routeHint = useMemo(() => promptMap[location.pathname] || 'Ask: "available rooms", "my event bookings", or "popular menu items".', [location.pathname]);

  const onAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setChatMessages((prev) => [...prev, { by: 'me', text: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await askChatbot(q);
      setChatMessages((prev) => [...prev, { by: 'bot', text: res.data?.answer || 'No response from assistant.' }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { by: 'bot', text: error.response?.data?.message || 'Assistant request failed.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="chatbot-fab" onClick={() => setChatOpen((value) => !value)} title="Open assistant">
        <i className="bi bi-chat-dots" />
      </button>

      {chatOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-head">
            <strong>Guest Assistant</strong>
            <button type="button" onClick={() => setChatOpen(false)}>x</button>
          </div>

          <div className="chatbot-body">
            <div className="chat-msg bot">{routeHint}</div>
            {chatMessages.map((message, index) => (
              <div key={`${message.by}-${index}`} className={`chat-msg ${message.by}`}>{message.text}</div>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={onAsk}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about rooms, dining, events..."
            />
            <button type="submit" className="primary-action" disabled={loading}>
              {loading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default CustomerSupportChatbot;
