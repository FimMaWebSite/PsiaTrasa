import React, { useState, useEffect } from 'react';
import type { Place, SafetyAlert, LostDog, User, PlaceType, AlertType, CoffeeDonation } from './types';
import { POPULAR_BREEDS } from './types';
import { db } from './services/db';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { Modal } from './components/Modal';
import { authService, donationService, isSupabaseConfigured, supabase } from './services/supabase';
import { 
  Compass, MapPin, AlertTriangle, Sun, Moon, ShieldAlert, Plus, Check, RotateCcw, LogOut, LogIn, Navigation, Terminal, User as UserIcon
} from 'lucide-react';

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [lostDogs, setLostDogs] = useState<LostDog[]>([]);
  const [donations, setDonations] = useState<CoffeeDonation[]>([]);
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [selectedLostDog, setSelectedLostDog] = useState<LostDog | null>(null);

  // Drawing state
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isTrackingGPS, setIsTrackingGPS] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);

  // Click Coordinates for modal additions
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCreationType, setActiveCreationType] = useState<'place' | 'alert' | 'lost' | null>(null);

  // Filters and Theme
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryTab, setCategoryTab] = useState<'all' | 'enclosure' | 'park' | 'water' | 'route'>('all');
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [coffeeCount, setCoffeeCount] = useState(1);
  const [coffeeName, setCoffeeName] = useState('');
  const [coffeeMessage, setCoffeeMessage] = useState('');
  const [isCoffeeSuccess, setIsCoffeeSuccess] = useState(false);
  const [triggerUserLocate, setTriggerUserLocate] = useState(0);

  // Auth User
  const [currentUser, setCurrentUser] = useState<User>({ username: 'Gość', isLoggedIn: false });
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Edit Profile / Settings Form State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileDogName, setProfileDogName] = useState('');
  const [profileDogBreed, setProfileDogBreed] = useState('');
  const [profileDogSize, setProfileDogSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [profileDogTemp, setProfileDogTemp] = useState<'friendly' | 'neutral' | 'reactive'>('friendly');

  // Dev Console / Webhook State
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [simDonorName, setSimDonorName] = useState('Burek i jego człowiek');
  const [simCoffees, setSimCoffees] = useState(3);
  const [simMessage, setSimMessage] = useState('Super robota z tymi trasami! 🐕');

  // Filter My Tracks
  const [isFilterMyTracksActive, setIsFilterMyTracksActive] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Map center coordinates search targeting
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Modal Visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Forms inputs
  const [authUsername, setAuthUsername] = useState('');
  const [authDogName, setAuthDogName] = useState('');
  const [authDogBreed, setAuthDogBreed] = useState('');
  const [authDogSize, setAuthDogSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [authDogTemp, setAuthDogTemp] = useState<'friendly' | 'neutral' | 'reactive'>('friendly');
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
    
    // Load session from authService
    authService.getSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        // Pre-fill profile settings
        setProfileUsername(user.username);
        setProfileDogName(user.dogName || '');
        setProfileDogBreed(user.dogBreed || '');
        setProfileDogSize(user.dogSize || 'medium');
        setProfileDogTemp(user.dogTemperament || 'friendly');
      }
    });

    // Load donations from donationService
    donationService.getDonations().then((list) => {
      setDonations(list);
    });

    // Subscribe to donations if real Supabase
    const unsubscribeDonations = donationService.subscribeToNewDonations((newD) => {
      setDonations(prev => {
        if (prev.some(d => d.id === newD.id)) return prev;
        return [newD, ...prev];
      });
      showToast(`Nowa wpłata na kawkę! ☕ Dziękujemy, ${newD.donorName}!`);
    });

    // Check system preferences for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    return () => {
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, []);

  // Listen to Google Login popup messages
  useEffect(() => {
    const handleGoogleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'google-login-success') {
        const user: User = {
          username: e.data.name,
          dogName: e.data.dog,
          avatarUrl: e.data.avatar,
          isLoggedIn: true,
          email: e.data.email,
        };
        db.setUser(user);
        setCurrentUser(user);
        
        // Pre-fill profile settings
        setProfileUsername(user.username);
        setProfileDogName(user.dogName || '');
        setProfileDogBreed('');
        setProfileDogSize('medium');
        setProfileDogTemp('friendly');

        setIsAuthModalOpen(false);
        showToast('Zalogowano przez Google! 👋');
      }
    };
    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, []);

  // Check for OAuth / Auth redirect errors in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error || errorDescription) {
      const msg = errorDescription || error || 'Nieznany błąd logowania';
      showToast(`Błąd logowania: ${decodeURIComponent(msg).replace(/\+/g, ' ')}`, 'error');
      
      // Clean up URL parameters to keep it clean
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Also check hash for errors (Supabase sometimes redirects errors in the hash fragment)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error');
      const hashErrorDesc = hashParams.get('error_description');
      if (hashError || hashErrorDesc) {
        const msg = hashErrorDesc || hashError || 'Nieznany błąd logowania';
        showToast(`Błąd logowania: ${decodeURIComponent(msg).replace(/\+/g, ' ')}`, 'error');
        const newUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Listen to Supabase Auth state changes (real Google Login redirect callback handler)
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = session.user;
          // Fetch profile details gracefully
          let profile: any = null;
          try {
            const { data, error } = await client
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (!error) {
              profile = data;
            }
          } catch (e) {
            console.warn('Profiles table load failed, using user metadata:', e);
          }

          const loggedInUser: User = {
            username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            dogName: profile?.dog_name || user.user_metadata?.dogName,
            dogBreed: profile?.dog_breed || user.user_metadata?.dogBreed,
            dogSize: profile?.dog_size || user.user_metadata?.dogSize,
            dogTemperament: profile?.dog_temperament || user.user_metadata?.dogTemperament,
            isLoggedIn: true,
            avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || 'user')}`,
            email: user.email,
          };
          db.setUser(loggedInUser);
          setCurrentUser(loggedInUser);
          
          // Pre-fill profile settings
          setProfileUsername(loggedInUser.username);
          setProfileDogName(loggedInUser.dogName || '');
          setProfileDogBreed(loggedInUser.dogBreed || '');
          setProfileDogSize(loggedInUser.dogSize || 'medium');
          setProfileDogTemp(loggedInUser.dogTemperament || 'friendly');
          
          showToast('Zalogowano pomyślnie! 🐕');
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Toast auto-dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    
    if (authTab === 'login') {
      const { user, error } = await authService.signIn(authEmail, authPassword);
      setAuthLoading(false);
      if (error) {
        setAuthError(error);
        return;
      }
      if (user) {
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        showToast('Zalogowano pomyślnie! Witaj z powrotem. 👋');
        
        // Pre-fill profile
        setProfileUsername(user.username);
        setProfileDogName(user.dogName || '');
        setProfileDogBreed(user.dogBreed || '');
        setProfileDogSize(user.dogSize || 'medium');
        setProfileDogTemp(user.dogTemperament || 'friendly');
      }
    } else {
      // Register
      if (!authUsername) {
        setAuthError('Wpisz nazwę użytkownika.');
        setAuthLoading(false);
        return;
      }
      const { user, error } = await authService.signUp(authEmail, authPassword, {
        username: authUsername,
        dogName: authDogName || undefined,
        dogBreed: authDogBreed || undefined,
        dogSize: authDogSize,
        dogTemperament: authDogTemp,
      });
      setAuthLoading(false);
      if (error) {
        setAuthError(error);
        return;
      }
      if (user) {
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        showToast('Zarejestrowano pomyślnie! Witaj w społeczności. 🐕');
        
        // Pre-fill profile
        setProfileUsername(user.username);
        setProfileDogName(user.dogName || '');
        setProfileDogBreed(user.dogBreed || '');
        setProfileDogSize(user.dogSize || 'medium');
        setProfileDogTemp(user.dogTemperament || 'friendly');
      }
    }

    // Reset inputs
    setAuthPassword('');
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      alert("Błąd: Konfiguracja Supabase jest pusta w tej wersji strony. Upewnij się, że dodałeś sekrety (Secrets) VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w panelu GitHub -> Settings -> Secrets and variables -> Actions, a następnie wypchnąłeś kod (git push)!");
      return;
    }
    
    const { error } = await authService.signInWithGoogle();
    if (error) setAuthError(error);
  };
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername) return;

    const updatedUser: User = {
      ...currentUser,
      username: profileUsername,
      dogName: profileDogName || undefined,
      dogBreed: profileDogBreed || undefined,
      dogSize: profileDogSize,
      dogTemperament: profileDogTemp,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileDogName || profileUsername)}`,
    };

    const { user, error } = await authService.updateProfile(updatedUser);
    if (error) {
      showToast(error, 'error');
      return;
    }
    if (user) {
      setCurrentUser(user);
      setIsProfileModalOpen(false);
      showToast('Profil został zaktualizowany! 🐾');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    const guestUser = { username: 'Gość', isLoggedIn: false };
    setCurrentUser(guestUser);
    setIsProfileMenuOpen(false);
    setIsFilterMyTracksActive(false);
    handleCloseSidebar();
    showToast('Wylogowano pomyślnie. Do zobaczenia!');
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
      createdBy: currentUser.isLoggedIn ? (currentUser.email || currentUser.username) : undefined
    });

    setPlaces(db.getPlaces());
    
    // Reset Form & Close Modal
    setNewPlaceName('');
    setNewPlaceDesc('');
    setNewPlaceTags([]);
    setClickedCoords(null);
    setActiveCreationType(null);
    showToast('Miejsce zostało dodane! 🐾');
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
      createdBy: currentUser.isLoggedIn ? (currentUser.email || currentUser.username) : undefined
    });

    setAlerts(db.getAlerts());

    setNewAlertDesc('');
    setClickedCoords(null);
    setActiveCreationType(null);
    showToast('Zgłoszenie zostało dodane! Uważajcie na siebie. ⚠️', 'info');
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
      createdBy: currentUser.isLoggedIn ? (currentUser.email || currentUser.username) : undefined
    });

    setLostDogs(db.getLostDogs());

    setNewDogName('');
    setNewDogDesc('');
    setNewDogPhone('');
    setClickedCoords(null);
    setActiveCreationType(null);
    showToast('Zgłoszenie zaginionego psa zostało opublikowane! 🐕', 'error');
  };

  // Drawing Route Point Add
  const handleAddDrawingPoint = (point: [number, number]) => {
    setDrawingPoints([...drawingPoints, point]);
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      showToast('Twoja przeglądarka nie obsługuje lokalizacji GPS', 'error');
      return;
    }
    
    setIsTrackingGPS(true);
    setDrawingPoints([]);
    setIsDrawingRoute(true);
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy && accuracy > 30) return;
        
        setDrawingPoints((prev) => {
          if (prev.length === 0) {
            return [[latitude, longitude]];
          }
          
          const lastPoint = prev[prev.length - 1];
          const R = 6371000;
          const dLat = ((latitude - lastPoint[0]) * Math.PI) / 180;
          const dLng = ((longitude - lastPoint[1]) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lastPoint[0] * Math.PI) / 180) *
              Math.cos((latitude * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          
          if (distance >= 5) {
            return [...prev, [latitude, longitude]];
          }
          return prev;
        });
        
        setFlyToTarget({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('GPS tracking error:', error);
        showToast('Błąd GPS. Upewnij się, że masz włączoną lokalizację.', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    
    setGpsWatchId(watchId);
    showToast('Rozpoczęto nagrywanie trasy GPS! 🚶‍♂️🐕');
  };

  const stopGPSTracking = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
    setIsTrackingGPS(false);
    
    if (drawingPoints.length < 2) {
      showToast('Zbyt mało punktów (min. 2), by utworzyć trasę spacerową.', 'error');
      setIsDrawingRoute(false);
      setDrawingPoints([]);
    } else {
      setIsDrawingRoute(false);
      showToast('Nagrywanie GPS zakończone! Podaj dane trasy spacerowej.', 'success');
    }
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
      createdBy: currentUser.isLoggedIn ? (currentUser.email || currentUser.username) : undefined
    });

    setPlaces(db.getPlaces());

    // Reset Route Drawer State
    setNewRouteName('');
    setNewRouteDesc('');
    setNewRouteTags([]);
    setDrawingPoints([]);
    setIsDrawingRoute(false);
    showToast('Trasa spacerowa została zapisana! 🥾');
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

  const handleCoffeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const donor = coffeeName || 'Anonimowy Psiarz';
    await donationService.addDonation({
      donorName: donor,
      coffees: coffeeCount,
      message: coffeeMessage || undefined,
    });
    const list = await donationService.getDonations();
    setDonations(list);
    setIsCoffeeSuccess(true);
    showToast(`Dziękujemy ${donor} za postawienie kawki! ☕🐾`);
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
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)', 
              color: '#d97706',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              fontWeight: 600
            }} 
            onClick={() => {
              setIsCoffeeSuccess(false);
              setIsCoffeeModalOpen(true);
            }}
            title="Postaw nam kawkę!"
          >
            ☕ Postaw kawkę
          </button>

          <button 
            className="tool-btn" 
            onClick={() => setIsDevConsoleOpen(true)} 
            title="Panel Deweloperski & Webhooki" 
            style={{ width: '40px', height: '40px', boxShadow: 'none' }}
          >
            <Terminal size={18} />
          </button>

          <button className="tool-btn" onClick={toggleTheme} style={{ width: '40px', height: '40px', boxShadow: 'none' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          {currentUser.isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="tool-btn"
                style={{ 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  overflow: 'hidden', 
                  padding: 0,
                  border: '2px solid var(--primary)',
                  boxShadow: 'none'
                }}
              >
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>🐕</span>
                )}
              </button>
              
              {isProfileMenuOpen && (
                <div className="card" style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '48px', 
                  width: '260px', 
                  zIndex: 2100, 
                  boxShadow: 'var(--shadow-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  animation: 'slide-up 0.2s ease-out'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      🐕
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>{currentUser.username}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.email || 'Konto lokalne'}</span>
                    </div>
                  </div>
                  
                  {currentUser.dogName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      <strong>Pies:</strong> {currentUser.dogName}<br />
                      {currentUser.dogBreed && <><strong>Rasa:</strong> {currentUser.dogBreed}<br /></>}
                      {currentUser.dogSize && <><strong>Rozmiar:</strong> {currentUser.dogSize === 'small' ? 'Mały' : currentUser.dogSize === 'medium' ? 'Średni' : 'Duży'}<br /></>}
                      {currentUser.dogTemperament && <><strong>Temperament:</strong> {currentUser.dogTemperament === 'friendly' ? 'Przyjazny' : currentUser.dogTemperament === 'neutral' ? 'Neutralny' : 'Reaktywny'}</>}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => { setIsProfileModalOpen(true); setIsProfileMenuOpen(false); }}
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
                    >
                      <UserIcon size={14} /> Twój Profil
                    </button>
                    <button 
                      className={`btn btn-sm ${isFilterMyTracksActive ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => { setIsFilterMyTracksActive(!isFilterMyTracksActive); setIsProfileMenuOpen(false); }}
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
                    >
                      <MapPin size={14} /> {isFilterMyTracksActive ? '✓ Twoje Trasy (Włączone)' : 'Twoje Trasy'}
                    </button>
                  </div>
                  
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={handleLogout} 
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  >
                    <LogOut size={14} /> Wyloguj się
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab('login'); setAuthError(null); setIsAuthModalOpen(true); }}>
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
          {isTrackingGPS ? (
            <div className="drawing-indicator" style={{ backgroundColor: '#ef4444' }}>
              <div className="animate-ping" style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
              <span>Śledzenie GPS: Spaceruj z psem, trasa nagrywa się na żywo... ({drawingPoints.length} pkt)</span>
            </div>
          ) : isDrawingRoute ? (
            <div className="drawing-indicator">
              <div className="animate-ping" style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
              <span>Rysowanie Trasy: Klikaj na mapie, by dodać punkty ({drawingPoints.length})</span>
            </div>
          ) : null}

          {/* Map Components */}
          <Map 
            places={isFilterMyTracksActive ? places.filter(p => p.createdBy && (p.createdBy === currentUser.email || p.createdBy === currentUser.username)) : places}
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
            searchTerm={searchTerm}
            categoryTab={categoryTab}
            triggerUserLocate={triggerUserLocate}
            flyToTarget={flyToTarget}
          />

          {/* Map Control Buttons */}
          <div className="map-tools">
            <button 
              className="tool-btn" 
              onClick={() => setTriggerUserLocate(prev => prev + 1)} 
              title="Centruj na mnie (GPS)"
              style={{ marginBottom: '0.25rem' }}
            >
              <Navigation size={20} />
            </button>
            {isTrackingGPS ? (
              <button 
                className="tool-btn pulse-glow" 
                onClick={stopGPSTracking} 
                title="Zatrzymaj nagrywanie GPS"
                style={{ backgroundColor: '#ef4444', color: 'white', position: 'relative' }}
              >
                <div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '2px', margin: 'auto' }}></div>
              </button>
            ) : isDrawingRoute ? (
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
                  onClick={() => {
                    setDrawingPoints([]);
                    setIsDrawingRoute(false);
                  }} 
                  title="Wyczyść punkty"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button 
                  className="tool-btn" 
                  onClick={() => {
                    setIsDrawingRoute(true);
                    setDrawingPoints([]);
                    handleCloseSidebar();
                  }} 
                  title="Rysuj trasę spacerową (ręcznie)"
                >
                  <Plus size={20} />
                </button>
                <button 
                  className="tool-btn" 
                  onClick={startGPSTracking} 
                  title="Nagraj trasę przez GPS"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                >
                  <Compass size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar 
          selectedPlace={selectedPlace}
          selectedAlert={selectedAlert}
          selectedLostDog={selectedLostDog}
          places={isFilterMyTracksActive ? places.filter(p => p.createdBy && (p.createdBy === currentUser.email || p.createdBy === currentUser.username)) : places}
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
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryTab={categoryTab}
          setCategoryTab={setCategoryTab}
          onOpenCoffeeModal={() => { setIsCoffeeSuccess(false); setIsCoffeeModalOpen(true); }}
          donations={donations}
          onSearchCityCoords={(coords) => setFlyToTarget(coords)}
        />
      </main>

      {/* Modal 1: Login & Registration Form */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title={authTab === 'login' ? 'Logowanie do PsiaTrasa' : 'Rejestracja w PsiaTrasa'}>
        {/* Tab switchers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', gap: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setAuthTab('login')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              paddingBottom: '0.5rem', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              color: authTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authTab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer' 
            }}
          >
            Logowanie
          </button>
          <button 
            type="button" 
            onClick={() => setAuthTab('register')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              paddingBottom: '0.5rem', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              color: authTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authTab === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer' 
            }}
          >
            Rejestracja
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {authError && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '8px', 
              color: '#ef4444', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              ⚠️ {authError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Adres e-mail</label>
            <input type="email" className="form-input" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="np. kasia@gmail.com" />
          </div>

          {authTab === 'register' && (
            <div className="form-group">
              <label className="form-label">Nazwa użytkownika</label>
              <input type="text" className="form-input" required value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="np. Kasia" />
            </div>
          )}

          {authTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Imię Twojego psa (opcjonalnie)</label>
                <input type="text" className="form-input" value={authDogName} onChange={(e) => setAuthDogName(e.target.value)} placeholder="np. Fuks" />
              </div>
              <div className="form-group">
                <label className="form-label">Rasa (opcjonalnie)</label>
                <select className="form-select" value={authDogBreed} onChange={(e) => setAuthDogBreed(e.target.value)}>
                  <option value="">-- Wybierz rasę --</option>
                  {POPULAR_BREEDS.map((breed) => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Rozmiar</label>
                  <select className="form-select" value={authDogSize} onChange={(e) => setAuthDogSize(e.target.value as any)}>
                    <option value="small">Mały (&lt;10kg)</option>
                    <option value="medium">Średni (10-25kg)</option>
                    <option value="large">Duży (&gt;25kg)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temperament</label>
                  <select className="form-select" value={authDogTemp} onChange={(e) => setAuthDogTemp(e.target.value as any)}>
                    <option value="friendly">Przyjazny</option>
                    <option value="neutral">Neutralny</option>
                    <option value="reactive">Reaktywny</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Hasło</label>
            <input type="password" className="form-input" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" minLength={6} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={authLoading}>
            {authLoading ? 'Proszę czekać...' : authTab === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 0.5rem' }}>LUB</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* Google Login button */}
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="btn btn-secondary" 
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.57-3.71 2.57-6.32z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.77.52-1.76.83-2.91.83-2.24 0-4.14-1.51-4.81-3.55L1.6 13.12C3.09 16.08 6.18 18 9 18z"/>
            <path fill="#FBBC05" d="M4.19 10.94A5.38 5.38 0 0 1 3.9 9c0-.67.11-1.32.3-1.94L1.6 5.1C.97 6.36.6 7.8.6 9c0 1.2.37 2.64 1 3.9l2.59-1.96z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.8 11.43 0 9 0 6.18 0 3.09 1.92 1.6 4.88l2.59 1.96C4.86 4.8 6.76 3.58 9 3.58z"/>
          </svg>
          Zaloguj przez Google
        </button>
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

      {/* Modal 7: Buy a Coffee (Monetization widget modal) */}
      <Modal isOpen={isCoffeeModalOpen} onClose={() => setIsCoffeeModalOpen(false)} title="Postaw kawkę ☕">
        {isCoffeeSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐕💖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>Dziękujemy za wsparcie!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Dodaliśmy Cię na **Ścianę Chwały**! Aby wesprzeć nas realnie, możesz dokończyć transakcję na platformie **BuyCoffee.to**:
            </p>
            <a 
              href="https://buycoffee.to/psiatrasa" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn"
              style={{ 
                backgroundColor: '#f59e0b', 
                color: 'white', 
                fontWeight: 700, 
                width: '100%', 
                marginTop: '1rem',
                marginBottom: '1rem',
                border: 'none',
                textDecoration: 'none'
              }}
            >
              ☕ Dokończ kawę na buycoffee.to
            </a>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setIsCoffeeModalOpen(false)}
            >
              Zamknij
            </button>
          </div>
        ) : (
          <form onSubmit={handleCoffeeSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              PsiaTrasa to darmowy projekt. Będzie nam niezmiernie miło, jeśli docenisz naszą pracę i postawisz nam wirtualną kawkę!
            </p>
            <div className="form-group">
              <label className="form-label">Wybierz liczbę kaw</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[1, 3, 5].map(n => (
                  <button
                    type="button"
                    key={n}
                    className={`btn ${coffeeCount === n ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCoffeeCount(n)}
                    style={{ 
                      padding: '0.75rem', 
                      fontSize: '0.9rem', 
                      fontWeight: 600,
                      borderColor: coffeeCount === n ? 'transparent' : 'var(--border-color)',
                      backgroundColor: coffeeCount === n ? 'var(--primary)' : 'var(--bg-app)'
                    }}
                  >
                    {n} Kawa{n > 1 ? 'y' : ''} ({n * 5} zł)
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Twój podpis / Imię psa</label>
              <input 
                type="text" 
                className="form-input" 
                required
                value={coffeeName} 
                onChange={(e) => setCoffeeName(e.target.value)} 
                placeholder="np. Kasia i Fuks" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Krótka wiadomość (opcjonalnie)</label>
              <textarea 
                className="form-textarea" 
                value={coffeeMessage} 
                onChange={(e) => setCoffeeMessage(e.target.value)} 
                placeholder="Wpisz słowa wsparcia dla projektu..." 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white', width: '100%', border: 'none' }}>
              Wspieraj ({coffeeCount * 5} zł)
            </button>

            {/* Ściana Chwały (Wall of Fame) */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                🏆 Ściana Chwały (Darczyńcy)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '130px', overflowY: 'auto' }}>
                {donations.map((d) => (
                  <div key={d.id} style={{ 
                    fontSize: '0.8rem', 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.15rem' }}>
                      <span>👤 {d.donorName}</span>
                      <span style={{ color: '#f59e0b' }}>☕ x{d.coffees}</span>
                    </div>
                    {d.message && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>"{d.message}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 8: Edit Profile Settings */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Ustawienia Twojego Profilu">
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label className="form-label">Nazwa użytkownika</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={profileUsername} 
              onChange={(e) => setProfileUsername(e.target.value)} 
              placeholder="np. Kasia" 
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>🐕 Dane Twojego Psa</h4>
            
            <div className="form-group">
              <label className="form-label">Imię psa</label>
              <input 
                type="text" 
                className="form-input" 
                value={profileDogName} 
                onChange={(e) => setProfileDogName(e.target.value)} 
                placeholder="np. Fuks" 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Rasa</label>
              <select 
                className="form-select" 
                value={profileDogBreed} 
                onChange={(e) => setProfileDogBreed(e.target.value)}
              >
                <option value="">-- Wybierz rasę --</option>
                {POPULAR_BREEDS.map((breed) => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Rozmiar</label>
                <select className="form-select" value={profileDogSize} onChange={(e) => setProfileDogSize(e.target.value as any)}>
                  <option value="small">Mały (&lt;10kg)</option>
                  <option value="medium">Średni (10-25kg)</option>
                  <option value="large">Duży (&gt;25kg)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Temperament</label>
                <select className="form-select" value={profileDogTemp} onChange={(e) => setProfileDogTemp(e.target.value as any)}>
                  <option value="friendly">Przyjazny</option>
                  <option value="neutral">Neutralny</option>
                  <option value="reactive">Reaktywny</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>Anuluj</button>
            <button type="submit" className="btn btn-primary">Zapisz Zmiany</button>
          </div>
        </form>
      </Modal>

      {/* Modal 9: Developer / Webhook Console */}
      <Modal isOpen={isDevConsoleOpen} onClose={() => setIsDevConsoleOpen(false)} title="Panel Deweloperski & Webhooki">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Supabase Status */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--bg-app)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem' 
          }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              📡 Status Integracji Supabase
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: isSupabaseConfigured ? '#10b981' : '#f59e0b',
                boxShadow: isSupabaseConfigured ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
              }} />
              <strong>{isSupabaseConfigured ? 'Połączono z bazą produkcyjną Supabase Auth' : 'Tryb symulacji lokalnej (Mock LocalStorage)'}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {isSupabaseConfigured 
                ? 'Zmienne środowiskowe VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY zostały pomyślnie załadowane. Rejestracja, logowanie i Ściana Chwały są w 100% zsynchronizowane z chmurą Supabase.' 
                : 'Aplikacja działa w trybie offline z pełną symulacją rejestracji, sprawdzania poprawności haseł oraz zapisu w localStorage. Aby połączyć się z własnym Supabase, dodaj zmienne VITE_SUPABASE_URL oraz VITE_SUPABASE_ANON_KEY do pliku .env.'}
            </p>
          </div>

          {/* Webhook Simulator */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'rgba(16, 185, 129, 0.05)', 
            borderRadius: '12px', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem' 
          }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              🔌 Symulator Webhooka BuyCoffee.to
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Kiedy ktoś wpłaci datek na BuyCoffee.to/psiatrasa, ich serwer wysyła webhook (HTTP POST). Zasymuluj ten pakiet danych poniżej, aby sprawdzić dynamiczne dołączenie darczyńcy na Ścianę Chwały w czasie rzeczywistym!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Nazwa darczyńcy i psa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={simDonorName} 
                  onChange={(e) => setSimDonorName(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Liczba kaw</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={simCoffees} 
                  min={1}
                  onChange={(e) => setSimCoffees(parseInt(e.target.value) || 1)} 
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Wiadomość wsparcia</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                value={simMessage} 
                onChange={(e) => setSimMessage(e.target.value)} 
              />
            </div>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', alignSelf: 'flex-start', marginTop: '0.25rem' }}
              onClick={async () => {
                await donationService.addDonation({
                  donorName: simDonorName,
                  coffees: simCoffees,
                  message: simMessage || undefined
                });
                
                // Reload list in view
                const list = await donationService.getDonations();
                setDonations(list);

                showToast(`Zasymulowano Webhook: ${simDonorName} postawił kawkę! ☕`);
                setIsDevConsoleOpen(false);
              }}
            >
              🚀 Wyślij symulowany webhook
            </button>
          </div>

          {/* Integration Guidelines */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Integracja webhooka buycoffee.to w produkcji:</strong><br />
            1. Skonfiguruj endpoint na serwerze (np. Supabase Edge Function).<br />
            2. Wklej URL endpointu w ustawieniach konta BuyCoffee.to w zakładce "Webhooki".<br />
            3. Po otrzymaniu POST z buycoffee.to, serwer zapisuje datek w tabeli SQL <code style={{ backgroundColor: 'var(--bg-app)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>donations</code>, a ten klient automatycznie odświeży widok w czasie rzeczywistym!
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsDevConsoleOpen(false)} style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
            Zamknij panel
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div 
          className={`toast toast-${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            animation: 'slide-up 0.3s ease-out'
          }}
        >
          {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '🐾'}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
