import React, { useState, useEffect } from 'react';
import type { Place, SafetyAlert, LostDog, User, PlaceType, AlertType } from './types';
import { db } from './services/db';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { Modal } from './components/Modal';
import { 
  Compass, MapPin, AlertTriangle, Sun, Moon, ShieldAlert, Plus, Check, RotateCcw, LogOut, LogIn
} from 'lucide-react';

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [lostDogs, setLostDogs] = useState<LostDog[]>([]);
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [selectedLostDog, setSelectedLostDog] = useState<LostDog | null>(null);

  // Drawing state
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);

  // Click Coordinates for modal additions
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCreationType, setActiveCreationType] = useState<'place' | 'alert' | 'lost' | null>(null);

  // Filters and Theme
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Auth User
  const [currentUser, setCurrentUser] = useState<User>({ username: 'Gość', isLoggedIn: false });

  // Modal Visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Forms inputs
  const [authUsername, setAuthUsername] = useState('');
  const [authDogName, setAuthDogName] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Place Form inputs
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDesc, setNewPlaceDesc] = useState('');
  const [newPlaceType, setNewPlaceType] = useState<PlaceType>('park');
  const [newPlaceTags, setNewPlaceTags] = useState<string[]>([]);

  // Alert Form inputs
  const [newAlertType, setNewAlertType] = useState<AlertType>('glass');
  const [newAlertDesc, setNewAlertDesc] = useState('');

  // Lost Dog Form inputs
  const [newDogName, setNewDogName] = useState('');
  const [newDogDesc, setNewDogDesc] = useState('');
  const [newDogPhone, setNewDogPhone] = useState('');

  // Route Form inputs
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteDesc, setNewRouteDesc] = useState('');
  const [newRouteTags, setNewRouteTags] = useState<string[]>([]);
  const [newRouteDifficulty, setNewRouteDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Fetch Initial Data
  useEffect(() => {
    setPlaces(db.getPlaces());
    setAlerts(db.getAlerts());
    setLostDogs(db.getLostDogs());
    setCurrentUser(db.getUser());

    // Check system preferences for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setSelectedAlert(null);
    setSelectedLostDog(null);
  };

  const handleSelectAlert = (alert: SafetyAlert) => {
    setSelectedAlert(alert);
    setSelectedPlace(null);
    setSelectedLostDog(null);
  };

  const handleSelectLostDog = (dog: LostDog) => {
    setSelectedLostDog(dog);
    setSelectedPlace(null);
    setSelectedAlert(null);
  };

  const handleCloseSidebar = () => {
    setSelectedPlace(null);
    setSelectedAlert(null);
    setSelectedLostDog(null);
  };

  // Auth Operations
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername) return;
    const user: User = {
      username: authUsername,
      dogName: authDogName || undefined,
      isLoggedIn: true,
    };
    db.setUser(user);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    // Clean input
    setAuthUsername('');
    setAuthDogName('');
    setAuthPassword('');
  };

  const handleLogout = () => {
    const guestUser = { username: 'Gość', isLoggedIn: false };
    db.setUser(guestUser);
    setCurrentUser(guestUser);
    handleCloseSidebar();
  };

  // Add Review
  const handleAddReview = (placeId: string, review: { userName: string; rating: number; comment: string }) => {
    db.addReview(placeId, review);
    // Reload local list
    const allPlaces = db.getPlaces();
    setPlaces(allPlaces);
    
    // Update selected place inside sidebar
    const updatedSelected = allPlaces.find(p => p.id === placeId);
    if (updatedSelected) {
      setSelectedPlace(updatedSelected);
    }
  };

  // Check-In
  const handleCheckIn = (placeId: string, checkIn: { dogName: string; dogBreed: string; dogSize: 'small' | 'medium' | 'large'; dogTemperament: 'friendly' | 'neutral' | 'reactive' }) => {
    db.addCheckIn(placeId, checkIn);
    // Reload local list
    const allPlaces = db.getPlaces();
    setPlaces(allPlaces);
    
    // Update selected place inside sidebar
    const updatedSelected = allPlaces.find(p => p.id === placeId);
    if (updatedSelected) {
      setSelectedPlace(updatedSelected);
    }
  };

  // Remove Check-In
  const handleRemoveCheckIn = (placeId: string, checkInId: string) => {
    db.removeCheckIn(placeId, checkInId);
    // Reload
    const allPlaces = db.getPlaces();
    setPlaces(allPlaces);
    const updatedSelected = allPlaces.find(p => p.id === placeId);
    if (updatedSelected) {
      setSelectedPlace(updatedSelected);
    }
  };

  // Resolve Alert
  const handleResolveAlert = (alertId: string) => {
    db.resolveAlert(alertId);
    setAlerts(db.getAlerts());
    setSelectedAlert(null);
  };

  // Resolve Lost Dog
  const handleResolveLostDog = (dogId: string) => {
    db.resolveLostDog(dogId);
    setLostDogs(db.getLostDogs());
    setSelectedLostDog(null);
  };

  // Click on map to add a point
  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setIsSelectionModalOpen(true);
  };

  const handleSelectionModalChoice = (type: 'place' | 'alert' | 'lost') => {
    setActiveCreationType(type);
    setIsSelectionModalOpen(false);
  };

  const handleAddSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickedCoords || !newPlaceName) return;

    db.addPlace({
      id: Math.random().toString(36).substr(2, 9),
      name: newPlaceName,
      description: newPlaceDesc,
      lat: clickedCoords.lat,
      lng: clickedCoords.lng,
      type: newPlaceType,
      tags: newPlaceTags,
    });

    setPlaces(db.getPlaces());
    
    // Reset Form & Close Modal
    setNewPlaceName('');
    setNewPlaceDesc('');
    setNewPlaceTags([]);
    setClickedCoords(null);
    setActiveCreationType(null);
  };

  const handleAddAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickedCoords || !newAlertDesc) return;

    db.addAlert({
      lat: clickedCoords.lat,
      lng: clickedCoords.lng,
      type: newAlertType,
      description: newAlertDesc,
      reportedBy: currentUser.isLoggedIn ? currentUser.username : 'Anonimowy Psiarz',
    });

    setAlerts(db.getAlerts());

    setNewAlertDesc('');
    setClickedCoords(null);
    setActiveCreationType(null);
  };

  const handleAddLostDogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickedCoords || !newDogName || !newDogPhone) return;

    db.addLostDog({
      lat: clickedCoords.lat,
      lng: clickedCoords.lng,
      dogName: newDogName,
      description: newDogDesc,
      contactPhone: newDogPhone,
    });

    setLostDogs(db.getLostDogs());

    setNewDogName('');
    setNewDogDesc('');
    setNewDogPhone('');
    setClickedCoords(null);
    setActiveCreationType(null);
  };

  // Drawing Route Point Add
  const handleAddDrawingPoint = (point: [number, number]) => {
    setDrawingPoints([...drawingPoints, point]);
  };

  // Route calculation (distance) using Haversine formula
  const calculateDistance = (points: [number, number][]) => {
    let total = 0;
    const toRad = (v: number) => (v * Math.PI) / 180;
    
    for (let i = 0; i < points.length - 1; i++) {
      const lat1 = points[i][0];
      const lon1 = points[i][1];
      const lat2 = points[i + 1][0];
      const lon2 = points[i + 1][1];

      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return Math.round(total * 10) / 10;
  };

  const handleSaveRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (drawingPoints.length < 2 || !newRouteName) return;

    const distance = calculateDistance(drawingPoints);
    const duration = Math.round(distance * 15); // Average walking speed: ~15 mins per km

    // Use the first point as the main marker position
    const startPoint = drawingPoints[0];

    db.addPlace({
      id: Math.random().toString(36).substr(2, 9),
      name: newRouteName,
      description: newRouteDesc,
      lat: startPoint[0],
      lng: startPoint[1],
      type: 'route',
      routePoints: drawingPoints,
      tags: newRouteTags,
      distance,
      duration,
      difficulty: newRouteDifficulty,
    });

    setPlaces(db.getPlaces());

    // Reset Route Drawer State
    setNewRouteName('');
    setNewRouteDesc('');
    setNewRouteTags([]);
    setDrawingPoints([]);
    setIsDrawingRoute(false);
  };

  const handleFilterToggle = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleTagToggle = (tag: string, tags: string[], setTags: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Compass size={24} strokeWidth={2.5} />
          </div>
          <span>PsiaTrasa</span>
        </div>
        <div className="header-actions">
          <button className="tool-btn" onClick={toggleTheme} style={{ width: '40px', height: '40px', boxShadow: 'none' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          {currentUser.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                🐕 <strong>{currentUser.username}</strong> {currentUser.dogName ? `& ${currentUser.dogName}` : ''}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={16} /> Wyloguj
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
              <LogIn size={16} /> Zaloguj się
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <main className="app-layout">
        <div className="map-wrapper">
          {/* Quick Filters */}
          <div className="map-filters">
            <button className={`filter-btn ${activeFilters.includes('ogrodzony') ? 'active' : ''}`} onClick={() => handleFilterToggle('ogrodzony')}>
              🔒 Ogrodzony
            </button>
            <button className={`filter-btn ${activeFilters.includes('woda') ? 'active' : ''}`} onClick={() => handleFilterToggle('woda')}>
              💧 Woda
            </button>
            <button className={`filter-btn ${activeFilters.includes('cień') ? 'active' : ''}`} onClick={() => handleFilterToggle('cień')}>
              🌲 W lesie / Cień
            </button>
            <button className={`filter-btn ${activeFilters.includes('oświetlenie') ? 'active' : ''}`} onClick={() => handleFilterToggle('oświetlenie')}>
              💡 Oświetlenie
            </button>
            <button className={`filter-btn ${activeFilters.includes('route') ? 'active' : ''}`} onClick={() => handleFilterToggle('route')}>
              🥾 Trasy
            </button>
            <button className={`filter-btn ${activeFilters.includes('vet') ? 'active' : ''}`} onClick={() => handleFilterToggle('vet')}>
              🩺 Weterynarze
            </button>
          </div>

          {/* Drawing Indicator */}
          {isDrawingRoute && (
            <div className="drawing-indicator">
              <div className="animate-ping" style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
              <span>Rysowanie Trasy: Klikaj na mapie, by dodać punkty ({drawingPoints.length})</span>
            </div>
          )}

          {/* Map Components */}
          <Map 
            places={places}
            alerts={alerts}
            lostDogs={lostDogs}
            selectedPlace={selectedPlace}
            selectedAlert={selectedAlert}
            selectedLostDog={selectedLostDog}
            onSelectPlace={handleSelectPlace}
            onSelectAlert={handleSelectAlert}
            onSelectLostDog={handleSelectLostDog}
            isDrawingRoute={isDrawingRoute}
            drawingPoints={drawingPoints}
            onAddDrawingPoint={handleAddDrawingPoint}
            onClickMapToAddSpot={handleMapClick}
            activeFilters={activeFilters}
          />

          {/* Map Control Buttons */}
          <div className="map-tools">
            {isDrawingRoute ? (
              <>
                <button 
                  className="tool-btn" 
                  onClick={() => setIsDrawingRoute(false)} 
                  title="Zapisz trasę"
                  disabled={drawingPoints.length < 2}
                  style={{ backgroundColor: drawingPoints.length >= 2 ? 'var(--primary)' : 'var(--bg-surface-glass)', color: drawingPoints.length >= 2 ? 'white' : 'var(--text-muted)' }}
                >
                  <Check size={20} />
                </button>
                <button 
                  className="tool-btn tool-btn-danger" 
                  onClick={() => setDrawingPoints([])} 
                  title="Wyczyść punkty"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            ) : (
              <button 
                className="tool-btn" 
                onClick={() => {
                  setIsDrawingRoute(true);
                  setDrawingPoints([]);
                  handleCloseSidebar();
                }} 
                title="Rysuj trasę spacerową"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar 
          selectedPlace={selectedPlace}
          selectedAlert={selectedAlert}
          selectedLostDog={selectedLostDog}
          places={places}
          alerts={alerts}
          lostDogs={lostDogs}
          currentUser={currentUser}
          onClose={handleCloseSidebar}
          onSelectPlace={handleSelectPlace}
          onAddReview={handleAddReview}
          onCheckIn={handleCheckIn}
          onRemoveCheckIn={handleRemoveCheckIn}
          onResolveAlert={handleResolveAlert}
          onResolveLostDog={handleResolveLostDog}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      </main>

      {/* Modal 1: Login Form */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Logowanie do PsiaTrasa">
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Nazwa użytkownika</label>
            <input type="text" className="form-input" required value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="np. Kasia" />
          </div>
          <div className="form-group">
            <label className="form-label">Imię Twojego psa (opcjonalnie)</label>
            <input type="text" className="form-input" value={authDogName} onChange={(e) => setAuthDogName(e.target.value)} placeholder="np. Fuks" />
          </div>
          <div className="form-group">
            <label className="form-label">Hasło</label>
            <input type="password" className="form-input" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAuthModalOpen(false)}>Anuluj</button>
            <button type="submit" className="btn btn-primary">Zaloguj się</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Selection of Marker Type */}
      <Modal isOpen={isSelectionModalOpen} onClose={() => { setIsSelectionModalOpen(false); setClickedCoords(null); }} title="Co chcesz dodać w tym miejscu?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => handleSelectionModalChoice('place')}>
            <MapPin size={20} color="var(--primary)" />
            <div style={{ textAlign: 'left' }}>
              <strong>Nowy wybieg lub punkt POI</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dodaj wybieg, park, plażę przyjazną psom lub weterynarza.</div>
            </div>
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => handleSelectionModalChoice('alert')}>
            <AlertTriangle size={20} color="#f59e0b" />
            <div style={{ textAlign: 'left' }}>
              <strong>Zgłoszenie zagrożenia (Alert)</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zgłoś rozbite szkło, trutkę, agresywne dzikie zwierzęta itp.</div>
            </div>
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => handleSelectionModalChoice('lost')}>
            <ShieldAlert size={20} color="#ef4444" />
            <div style={{ textAlign: 'left' }}>
              <strong>Zaginiony pies</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zgłoś zaginięcie pupila w tej okolicy wraz z kontaktem.</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Modal 3: Add Place Form */}
      <Modal isOpen={activeCreationType === 'place'} onClose={() => { setActiveCreationType(null); setClickedCoords(null); }} title="Dodaj nowy punkt dla psów">
        <form onSubmit={handleAddSpotSubmit}>
          <div className="form-group">
            <label className="form-label">Nazwa miejsca</label>
            <input type="text" className="form-input" required value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} placeholder="np. Zielony Wybieg Ołtaszyn" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis</label>
            <textarea className="form-textarea" required value={newPlaceDesc} onChange={(e) => setNewPlaceDesc(e.target.value)} placeholder="Opisz to miejsce: wyposażenie, podłoże, dostępność..." />
          </div>
          <div className="form-group">
            <label className="form-label">Typ lokalizacji</label>
            <select className="form-select" value={newPlaceType} onChange={(e) => setNewPlaceType(e.target.value as PlaceType)}>
              <option value="park">Park / Las</option>
              <option value="enclosure">Wybieg ogrodzony</option>
              <option value="water">Plaża / Dostęp do wody</option>
              <option value="cafe">Dog-Friendly Cafe</option>
              <option value="vet">Weterynarz 24/7</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Udogodnienia (Tagi)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ogrodzony', 'woda', 'cień', 'oświetlenie'].map(t => (
                <button 
                  type="button" 
                  key={t}
                  className={`filter-btn ${newPlaceTags.includes(t) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(t, newPlaceTags, setNewPlaceTags)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {t === 'ogrodzony' ? '🔒 Ogrodzenie' : t === 'woda' ? '💧 Woda' : t === 'cień' ? '🌲 Cień' : '💡 Oświetlenie'}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setActiveCreationType(null); setClickedCoords(null); }}>Anuluj</button>
            <button type="submit" className="btn btn-primary">Zapisz punkt</button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Add Alert Form */}
      <Modal isOpen={activeCreationType === 'alert'} onClose={() => { setActiveCreationType(null); setClickedCoords(null); }} title="Zgłoś niebezpieczeństwo w okolicy">
        <form onSubmit={handleAddAlertSubmit}>
          <div className="form-group">
            <label className="form-label">Typ niebezpieczeństwa</label>
            <select className="form-select" value={newAlertType} onChange={(e) => setNewAlertType(e.target.value as AlertType)}>
              <option value="glass">Rozbite szkło / Butelki</option>
              <option value="wild_animals">Dzikie zwierzęta (dziki itp.)</option>
              <option value="poison">Podejrzane jedzenie / Trutka</option>
              <option value="other">Inne zagrożenie</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Opis zagrożenia</label>
            <textarea className="form-textarea" required value={newAlertDesc} onChange={(e) => setNewAlertDesc(e.target.value)} placeholder="Napisz dokładnie gdzie leży niebezpieczeństwo, żeby inni mogli je łatwo ominąć..." />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setActiveCreationType(null); setClickedCoords(null); }}>Anuluj</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b' }}>Zgłoś alert</button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Add Lost Dog Form */}
      <Modal isOpen={activeCreationType === 'lost'} onClose={() => { setActiveCreationType(null); setClickedCoords(null); }} title="Zgłoś zaginionego psa">
        <form onSubmit={handleAddLostDogSubmit}>
          <div className="form-group">
            <label className="form-label">Imię psa</label>
            <input type="text" className="form-input" required value={newDogName} onChange={(e) => setNewDogName(e.target.value)} placeholder="np. Riko" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis psa i okoliczności ucieczki</label>
            <textarea className="form-textarea" required value={newDogDesc} onChange={(e) => setNewDogDesc(e.target.value)} placeholder="Opisz wygląd psa, znaki szczególne, szelki, kierunek ucieczki, jak się zachowuje..." />
          </div>
          <div className="form-group">
            <label className="form-label">Numer telefonu kontaktowego</label>
            <input type="tel" className="form-input" required value={newDogPhone} onChange={(e) => setNewDogPhone(e.target.value)} placeholder="np. +48 500 600 700" />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setActiveCreationType(null); setClickedCoords(null); }}>Anuluj</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ef4444' }}>Zgłoś zaginięcie</button>
          </div>
        </form>
      </Modal>

      {/* Modal 6: Save Route Form */}
      <Modal isOpen={!isDrawingRoute && drawingPoints.length >= 2} onClose={() => setDrawingPoints([])} title="Zapisz narysowaną trasę spacerową">
        <form onSubmit={handleSaveRouteSubmit}>
          <div className="form-group">
            <label className="form-label">Nazwa trasy spacerowej</label>
            <input type="text" className="form-input" required value={newRouteName} onChange={(e) => setNewRouteName(e.target.value)} placeholder="np. Wały Ślęzy z Kleciny" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis trasy</label>
            <textarea className="form-textarea" required value={newRouteDesc} onChange={(e) => setNewRouteDesc(e.target.value)} placeholder="Napisz o nawierzchni trasy, natężeniu ruchu rowerowego, polanach po drodze..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Trudność trasy</label>
              <select className="form-select" value={newRouteDifficulty} onChange={(e) => setNewRouteDifficulty(e.target.value as any)}>
                <option value="easy">Łatwa (płaska, krótka)</option>
                <option value="medium">Średnia (leśna ścieżka)</option>
                <option value="hard">Trudna (długa trasa)</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Długość obliczona:</div>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{calculateDistance(drawingPoints)} km</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Charakterystyka Trasy</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['woda', 'cień'].map(t => (
                <button 
                  type="button" 
                  key={t}
                  className={`filter-btn ${newRouteTags.includes(t) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(t, newRouteTags, setNewRouteTags)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {t === 'woda' ? '💧 Dostęp do wody' : '🌲 W lesie / Cień'}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDrawingPoints([])}>Odrzuć trasę</button>
            <button type="submit" className="btn btn-primary">Zapisz trasę</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
