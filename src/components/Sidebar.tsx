import React, { useState } from 'react';
import type { Place, SafetyAlert, LostDog, User } from '../types';
import { 
  X, Bone, Star, MessageSquare, Users, AlertTriangle, Check, Search, Trash2
} from 'lucide-react';

interface SidebarProps {
  selectedPlace: Place | null;
  selectedAlert: SafetyAlert | null;
  selectedLostDog: LostDog | null;
  places: Place[];
  alerts: SafetyAlert[];
  lostDogs: LostDog[];
  currentUser: User;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onAddReview: (placeId: string, review: { userName: string; rating: number; comment: string }) => void;
  onCheckIn: (placeId: string, checkIn: { dogName: string; dogBreed: string; dogSize: 'small' | 'medium' | 'large'; dogTemperament: 'friendly' | 'neutral' | 'reactive' }) => void;
  onRemoveCheckIn: (placeId: string, checkInId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onResolveLostDog: (dogId: string) => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedPlace,
  selectedAlert,
  selectedLostDog,
  places,
  alerts,
  lostDogs,
  currentUser,
  onClose,
  onSelectPlace,
  onAddReview,
  onCheckIn,
  onRemoveCheckIn,
  onResolveAlert,
  onResolveLostDog,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [dogName, setDogName] = useState(currentUser.dogName || '');
  const [dogBreed, setDogBreed] = useState('');
  const [dogSize, setDogSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dogTemperament, setDogTemperament] = useState<'friendly' | 'neutral' | 'reactive'>('friendly');
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  // Type Translation helpers
  const translateType = (type: string) => {
    switch (type) {
      case 'park': return 'Park / Las';
      case 'enclosure': return 'Wybieg ogrodzony';
      case 'water': return 'Dostęp do wody';
      case 'cafe': return 'Dog-Friendly Cafe';
      case 'vet': return 'Weterynarz 24/7';
      case 'route': return 'Trasa spacerowa';
      default: return 'Miejsce';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'park': return 'badge-success';
      case 'enclosure': return 'badge-info';
      case 'water': return 'badge-success';
      case 'cafe': return 'badge-warning';
      case 'vet': return 'badge-danger';
      case 'route': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const getDifficultyText = (diff?: string) => {
    if (diff === 'easy') return 'Łatwa';
    if (diff === 'medium') return 'Średnia';
    if (diff === 'hard') return 'Trudna';
    return '';
  };

  // Filter places based on search
  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;
    const authorName = currentUser.isLoggedIn ? currentUser.username : 'Anonimowy Psiarz';
    onAddReview(selectedPlace.id, {
      userName: authorName,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewComment('');
    setReviewRating(5);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace || !dogName) return;
    onCheckIn(selectedPlace.id, {
      dogName,
      dogBreed: dogBreed || 'Mieszaniec',
      dogSize,
      dogTemperament,
    });
    setShowCheckInForm(false);
  };

  const getAverageRating = (place: Place) => {
    if (place.reviews.length === 0) return 0;
    const sum = place.reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / place.reviews.length) * 10) / 10;
  };

  const renderBones = (rating: number, clickable = false, onRate?: (r: number) => void) => {
    return (
      <div className="bone-rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <Bone
            key={i}
            size={18}
            className="bone-icon"
            color={i <= rating ? '#f59e0b' : '#cbd5e1'}
            fill={i <= rating ? '#f59e0b' : 'transparent'}
            onClick={() => clickable && onRate && onRate(i)}
          />
        ))}
      </div>
    );
  };

  const isOpen = selectedPlace !== null || selectedAlert !== null || selectedLostDog !== null;

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      {/* Header of selected view */}
      <div className="sidebar-header">
        <span className="sidebar-title">
          {selectedPlace && 'Szczegóły Miejsca'}
          {selectedAlert && 'Alert Bezpieczeństwa'}
          {selectedLostDog && 'Zaginiony Pies!'}
          {!isOpen && 'Baza Miejsc i Tras'}
        </span>
        {isOpen && (
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {/* VIEW 1: PLACE DETAILS */}
        {selectedPlace && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
              <span className={`badge ${getTypeBadgeColor(selectedPlace.type)}`}>
                {translateType(selectedPlace.type)}
              </span>
              {selectedPlace.reviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <strong>{getAverageRating(selectedPlace)}</strong> ({selectedPlace.reviews.length} opinii)
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedPlace.name}</h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              {selectedPlace.description}
            </p>

            {/* If it is a Route */}
            {selectedPlace.type === 'route' && (
              <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-light)', border: 'none' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Długość</div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedPlace.distance} km</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Czas</div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedPlace.duration} min</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trudność</div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{getDifficultyText(selectedPlace.difficulty)}</strong>
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedPlace.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {selectedPlace.tags.map(t => (
                  <span key={t} className="tag tag-active">
                    {t === 'ogrodzony' && '🔒 Ogrodzony'}
                    {t === 'woda' && '💧 Woda'}
                    {t === 'cień' && '🌲 Cień'}
                    {t === 'oświetlenie' && '💡 Oświetlenie'}
                    {t === 'całodobowy' && '⏰ 24/7'}
                  </span>
                ))}
              </div>
            )}

            {/* Check-in section (Kto jest na wybiegu) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--primary)" />
                  Kto jest na miejscu? ({selectedPlace.checkins.length})
                </h3>
                {!showCheckInForm && (
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    if (!currentUser.isLoggedIn) {
                      onOpenAuth();
                    } else {
                      setShowCheckInForm(true);
                    }
                  }}>
                    Zamelduj się
                  </button>
                )}
              </div>

              {showCheckInForm && (
                <form onSubmit={handleCheckInSubmit} className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-app)' }}>
                  <div className="form-group">
                    <label className="form-label">Imię psa</label>
                    <input type="text" className="form-input" required value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="np. Reksio" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rasa</label>
                    <input type="text" className="form-input" value={dogBreed} onChange={(e) => setDogBreed(e.target.value)} placeholder="np. Golden Retriever" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Rozmiar</label>
                      <select className="form-select" value={dogSize} onChange={(e) => setDogSize(e.target.value as any)}>
                        <option value="small">Mały (&lt;10kg)</option>
                        <option value="medium">Średni (10-25kg)</option>
                        <option value="large">Duży (&gt;25kg)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temperament</label>
                      <select className="form-select" value={dogTemperament} onChange={(e) => setDogTemperament(e.target.value as any)}>
                        <option value="friendly">Przyjazny</option>
                        <option value="neutral">Neutralny</option>
                        <option value="reactive">Reaktywny</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCheckInForm(false)}>Anuluj</button>
                    <button type="submit" className="btn btn-primary btn-sm">Zapisz</button>
                  </div>
                </form>
              )}

              {selectedPlace.checkins.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Aktualnie nie ma tu żadnego pieska. Bądź pierwszy!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedPlace.checkins.map(c => (
                    <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', marginBottom: 0 }}>
                      <div>
                        <strong>🐕 {c.dogName}</strong> ({c.dogBreed})
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Rozmiar: {c.dogSize === 'small' ? 'Mały' : c.dogSize === 'medium' ? 'Średni' : 'Duży'} | 
                          Osobowość: {c.dogTemperament === 'friendly' ? 'Przyjazny' : c.dogTemperament === 'neutral' ? 'Neutralny' : 'Reaktywny'}
                        </div>
                      </div>
                      {currentUser.isLoggedIn && (currentUser.dogName === c.dogName || currentUser.username === 'Admin') && (
                        <button className="sidebar-close-btn" style={{ color: '#ef4444' }} onClick={() => onRemoveCheckIn(selectedPlace.id, c.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MessageSquare size={20} color="var(--primary)" />
                Opinie właścicieli ({selectedPlace.reviews.length})
              </h3>

              {/* Add review form */}
              <form onSubmit={handleReviewSubmit} className="card" style={{ marginBottom: '1.25rem', backgroundColor: 'var(--bg-app)' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="form-label" style={{ marginBottom: 0 }}>Ocena:</span>
                  {renderBones(reviewRating, true, setReviewRating)}
                </div>
                <div className="form-group">
                  <textarea 
                    className="form-textarea" 
                    required 
                    placeholder="Napisz opinię (np. czysty teren, czy są kosze na psie odchody, przeszkody)..." 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Dodaj Opinię
                </button>
              </form>

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedPlace.reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>👤 {r.userName}</strong>
                      {renderBones(r.rating)}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{r.comment}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SAFETY ALERT DETAILS */}
        {selectedAlert && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={12} />
                ZAGROŻENIE: {
                  selectedAlert.type === 'glass' ? 'Rozbite szkło' :
                  selectedAlert.type === 'wild_animals' ? 'Dzikie zwierzęta' :
                  selectedAlert.type === 'poison' ? 'Trutka / Podrzucone jedzenie' : 'Inne niebezpieczeństwo'
                }
              </span>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>Zgłoszenie zagrożenia</h2>
            <div className="card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'var(--bg-app)' }}>
              <p style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>{selectedAlert.description}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zgłoszone przez: <strong>{selectedAlert.reportedBy}</strong><br />
                Kiedy: {new Date(selectedAlert.createdAt).toLocaleString('pl-PL')}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem', backgroundColor: '#10b981' }} 
              onClick={() => onResolveAlert(selectedAlert.id)}
            >
              <Check size={18} /> Oznacz jako nieaktualne / posprzątane
            </button>
          </div>
        )}

        {/* VIEW 3: LOST DOG DETAILS */}
        {selectedLostDog && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="badge badge-danger animate-pulse">ZAGINIONY PIES</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Szukamy: {selectedLostDog.dogName}!</h2>
            
            <div className="card" style={{ borderLeft: '4px solid #dc2626', backgroundColor: '#fef2f2', color: '#991b1b' }}>
              <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {selectedLostDog.description}
              </p>
              
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                📞 Kontakt do właściciela: <a href={`tel:${selectedLostDog.contactPhone}`} style={{ color: '#dc2626', textDecoration: 'underline' }}>{selectedLostDog.contactPhone}</a>
              </div>

              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Zgłoszono: {new Date(selectedLostDog.createdAt).toLocaleString('pl-PL')}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem', backgroundColor: '#16a34a' }} 
              onClick={() => onResolveLostDog(selectedLostDog.id)}
            >
              <Check size={18} /> Oznacz jako odnaleziony! 🎉
            </button>
          </div>
        )}

        {/* VIEW 4: DEFAULT SEARCH & LIST OF PLACES */}
        {!isOpen && (
          <div>
            {/* Search Bar */}
            <div className="form-group" style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Szukaj miejsc spacerowych..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Info Alerts Section */}
            {(alerts.filter(a => !a.resolved).length > 0 || lostDogs.filter(d => !d.resolved).length > 0) && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Pilne alerty w okolicy</h4>
                
                {lostDogs.filter(d => !d.resolved).map(d => (
                  <div key={d.id} className="card" style={{ borderColor: '#fecaca', backgroundColor: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <div className="marker-pin lost" style={{ position: 'relative', margin: 0, left: 0, top: 0, width: '32px', height: '32px' }}>
                      <span className="marker-inner" style={{ fontSize: '12px' }}>🚨</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#b91c1c' }}>Zaginął {d.dogName}!</strong>
                      <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>Skontaktuj się jeśli go zobaczysz.</div>
                    </div>
                  </div>
                ))}

                {alerts.filter(a => !a.resolved).map(a => (
                  <div key={a.id} className="card" style={{ borderColor: '#fef3c7', backgroundColor: '#fffbeb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <div className="marker-pin alert" style={{ position: 'relative', margin: 0, left: 0, top: 0, width: '32px', height: '32px' }}>
                      <span className="marker-inner" style={{ fontSize: '12px' }}>⚠️</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#d97706' }}>
                        {a.type === 'glass' ? 'Rozbite szkło' : a.type === 'poison' ? 'Zagrożenie trutką' : 'Zwierzęta/Inne'}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{a.description.substring(0, 50)}...</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Places list */}
            <div>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Wszystkie lokalizacje ({filteredPlaces.length})</h4>
              
              {filteredPlaces.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>Brak wyników wyszukiwania.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredPlaces.map(place => (
                    <div 
                      key={place.id} 
                      className="card" 
                      onClick={() => onSelectPlace(place)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span className={`badge ${getTypeBadgeColor(place.type)}`}>
                          {translateType(place.type)}
                        </span>
                        {place.reviews.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            ⭐ {getAverageRating(place)}
                          </div>
                        )}
                      </div>
                      <h3 className="card-title">{place.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                        {place.description}
                      </p>
                      
                      {place.type === 'route' && (
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                          <span>📏 {place.distance} km</span>
                          <span>⏱️ {place.duration} min</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
