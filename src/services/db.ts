import type { Place, SafetyAlert, LostDog, User, Review, CheckIn, CoffeeDonation } from '../types';

const STORAGE_KEYS = {
  PLACES: 'psiatrasa_places',
  ALERTS: 'psiatrasa_alerts',
  LOST_DOGS: 'psiatrasa_lost_dogs',
  USER: 'psiatrasa_user',
  DONATIONS: 'psiatrasa_donations',
};

const INITIAL_PLACES: Place[] = [
  {
    id: 'p1',
    name: 'Park Grabiszyński (Polana główna)',
    description: 'Ogromny park z licznymi zacienionymi ścieżkami, idealny na długie spacery. Duża polana pozwala na swobodne bieganie z psem. Obok płynie rzeka Ślęza.',
    lat: 51.0864,
    lng: 16.9833,
    type: 'park',
    tags: ['cień', 'woda', 'las'],
    reviews: [
      {
        id: 'r1',
        userName: 'Marta & Luna',
        rating: 5,
        comment: 'Cudowne miejsce! Luna uwielbia kąpać się w Ślęzie, a w upalne dni drzewa dają super schronienie. Bardzo polecam.',
        createdAt: '2026-05-28T14:30:00Z',
      },
      {
        id: 'r2',
        userName: 'Tomek & Borys',
        rating: 4,
        comment: 'Super przestrzeń, ale w weekendy bywa tłoczno. Trzeba uważać na rowerzystów.',
        createdAt: '2026-05-29T09:15:00Z',
      }
    ],
    checkins: [
      {
        id: 'c1',
        dogName: 'Borys',
        dogBreed: 'Labrador',
        dogSize: 'large',
        dogTemperament: 'friendly',
        checkedInAt: new Date().toISOString(),
      }
    ]
  },
  {
    id: 'p2',
    name: 'Wybieg dla psów - Park Tołpy',
    description: 'W pełni ogrodzony, bezpieczny wybieg dla psów z przeszkodami do agility (tunel, pochylnie) oraz ławkami dla właścicieli. Oświetlony w nocy.',
    lat: 51.1217,
    lng: 17.0494,
    type: 'enclosure',
    tags: ['ogrodzony', 'oświetlenie'],
    reviews: [
      {
        id: 'r3',
        userName: 'Kasia & Fuks',
        rating: 5,
        comment: 'Najlepszy wybieg w okolicy! Podwójna śluza przy wejściu, bezpiecznie ogrodzony. Dużo zabawek na miejscu.',
        createdAt: '2026-05-27T18:45:00Z',
      }
    ],
    checkins: [
      {
        id: 'c2',
        dogName: 'Fuks',
        dogBreed: 'Kundelek',
        dogSize: 'medium',
        dogTemperament: 'friendly',
        checkedInAt: new Date().toISOString(),
      },
      {
        id: 'c3',
        dogName: 'Reksio',
        dogBreed: 'Jack Russell',
        dogSize: 'small',
        dogTemperament: 'neutral',
        checkedInAt: new Date().toISOString(),
      }
    ]
  },
  {
    id: 'p3',
    name: 'Plaża przyjazna psom nad Odrą',
    description: 'Szeroka, piaszczysta łacha nad rzeką. Doskonałe wejście do wody dla czworonogów lubiących pływać. Brak ogrodzenia, zalecane posłuszeństwo psa.',
    lat: 51.1154,
    lng: 17.0378,
    type: 'water',
    tags: ['woda'],
    reviews: [
      {
        id: 'r4',
        userName: 'Paweł & Shadow',
        rating: 4,
        comment: 'Ekstra wejście do wody, pies wybiegany za wszystkie czasy. Zdarzają się śmieci zostawiane przez ludzi, stąd 4/5.',
        createdAt: '2026-05-25T11:00:00Z',
      }
    ],
    checkins: []
  },
  {
    id: 'p4',
    name: 'Kawiarnia "Pod Psem" & Garden',
    description: 'Klimatyczna kawiarnia serwująca pyszne ciasta i kawę. Psy są bardzo mile widziane – dostają miskę z wodą oraz darmowe psie smaczki przy zamówieniu.',
    lat: 51.1082,
    lng: 17.0315,
    type: 'cafe',
    tags: [],
    reviews: [
      {
        id: 'r5',
        userName: 'Ania & Coco',
        rating: 5,
        comment: 'Najbardziej dog-friendly miejsce we Wrocławiu. Coco dostała pyszne ciasteczko, a ja świetne espresso.',
        createdAt: '2026-05-28T16:20:00Z',
      }
    ],
    checkins: []
  },
  {
    id: 'p5',
    name: 'Klinika Weterynaryjna 24/7 "VetHelp"',
    description: 'Całodobowa przychodnia weterynaryjna świadcząca pełen zakres usług ratunkowych, chirurgicznych i diagnostycznych. Doświadczony zespół.',
    lat: 51.1192,
    lng: 17.0621,
    type: 'vet',
    tags: [],
    reviews: [],
    checkins: []
  },
  {
    id: 'p6',
    name: 'Malownicza trasa wzdłuż Odry (ZOO - Biskupin)',
    description: 'Ścieżka spacerowa prowadząca wzdłuż wałów Odry od wysokości ZOO aż po Biskupin. Piękne widoki, dużo zieleni i łatwy dostęp do wody.',
    lat: 51.1022,
    lng: 17.0860,
    type: 'route',
    routePoints: [
      [51.1022, 17.0860],
      [51.0998, 17.0945],
      [51.1009, 17.1050]
    ],
    tags: ['woda', 'cień', 'las', 'smycz'],
    reviews: [
      {
        id: 'r6',
        userName: 'Jan & Hektor',
        rating: 5,
        comment: 'Moja ulubiona trasa na weekendowy spacer. Dużo cienia, a pies może bezpiecznie popływać w rzece.',
        createdAt: '2026-05-26T08:00:00Z',
      }
    ],
    checkins: [],
    distance: 1.8,
    duration: 25,
    difficulty: 'easy'
  },
  {
    id: 'p_warszawa_pole',
    name: 'Pole Mokotowskie - Strefa dla psów',
    description: 'Najpopularniejszy park dla psów w Warszawie. Ogromny wybieg, stawy w których psy chętnie się kąpią oraz mnóstwo miejsca do socjalizacji i zabawy z innymi czworonogami.',
    lat: 52.2132,
    lng: 21.0022,
    type: 'park',
    tags: ['cień', 'woda'],
    reviews: [
      {
        id: 'r_warszawa_1',
        userName: 'Aneta & Leo',
        rating: 5,
        comment: 'Najlepsze miejsce w Warszawie na wybieganie psa. Mnóstwo pozytywnych psiarzy i psów!',
        createdAt: '2026-05-30T12:00:00Z',
      }
    ],
    checkins: []
  },
  {
    id: 'p_krakow_blonia',
    name: 'Park Błonia Krakowskie (Wybieg)',
    description: 'Krakowskie Błonia to legendarne miejsce spotkań psiarzy. Ogromna, otwarta przestrzeń łąkowa idealna do aportowania i swobodnego biegania pod kontrolą.',
    lat: 50.0594,
    lng: 19.9142,
    type: 'park',
    tags: ['las'],
    reviews: [],
    checkins: []
  },
  {
    id: 'p_gdansk_brzezno',
    name: 'Psia Plaża Gdańsk Brzeźno (Wejście nr 34)',
    description: 'Oficjalna, dedykowana plaża dla psów w Trójmieście. Szeroka plaża, czysty piasek i bezpieczne wejście do Bałtyku. Raj dla psów kochających wodę!',
    lat: 54.4178,
    lng: 18.6295,
    type: 'water',
    tags: ['woda'],
    reviews: [
      {
        id: 'r_gdansk_1',
        userName: 'Karol & Amber',
        rating: 5,
        comment: 'Pies przeszczęśliwy! Super, że jest takie oficjalne miejsce nad polskim morzem.',
        createdAt: '2026-05-29T15:30:00Z',
      }
    ],
    checkins: []
  },
  {
    id: 'p_poznan_kaspr',
    name: 'Wybieg dla psów w Parku Kasprowicza',
    description: 'Ogrodzony i oświetlony wybieg w Poznaniu wyposażony w przyrządy do treningu zwinności (agility) oraz bezpieczne śluzy wejściowe.',
    lat: 52.3995,
    lng: 16.8974,
    type: 'enclosure',
    tags: ['ogrodzony', 'oświetlenie'],
    reviews: [],
    checkins: []
  }
];

const INITIAL_ALERTS: SafetyAlert[] = [
  {
    id: 'a1',
    lat: 51.0850,
    lng: 16.9850,
    type: 'glass',
    description: 'Rozbite butelki w pobliżu głównego mostku w Parku Grabiszyńskim. Uważajcie na łapy!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reportedBy: 'Krzysztof & Max',
    resolved: false,
  },
  {
    id: 'a2',
    lat: 51.1225,
    lng: 17.0485,
    type: 'wild_animals',
    description: 'Widziano lochę z młodymi w zaroślach tuż przy wybiegu Tołpy. Proszę trzymać psy na smyczy w drodze na wybieg.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    reportedBy: 'Ola & Bruno',
    resolved: false,
  }
];

const INITIAL_LOST_DOGS: LostDog[] = [
  {
    id: 'ld1',
    lat: 51.1110,
    lng: 17.0420,
    dogName: 'Riko',
    description: 'Młody Golden Retriever, przyjacielski ale przestraszony. Uciekł w szelkach koloru zielonego. Zareaguje na swoje imię.',
    contactPhone: '+48 501 234 567',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    resolved: false,
  }
];

export const db = {
  getPlaces(): Place[] {
    const data = localStorage.getItem(STORAGE_KEYS.PLACES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(INITIAL_PLACES));
      return INITIAL_PLACES;
    }
    // Merge missing initial places automatically
    try {
      const existing: Place[] = JSON.parse(data);
      let changed = false;
      INITIAL_PLACES.forEach(init => {
        if (!existing.some(p => p.id === init.id)) {
          existing.push(init);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(existing));
      }
      return existing;
    } catch (e) {
      return INITIAL_PLACES;
    }
  },

  savePlaces(places: Place[]) {
    localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
  },

  addPlace(place: Omit<Place, 'reviews' | 'checkins'>): Place {
    const places = this.getPlaces();
    const newPlace: Place = {
      ...place,
      reviews: [],
      checkins: [],
      status: 'pending',
    };
    places.push(newPlace);
    this.savePlaces(places);
    return newPlace;
  },

  addReview(placeId: string, review: Omit<Review, 'id' | 'createdAt'>): Review {
    const places = this.getPlaces();
    const placeIndex = places.findIndex(p => p.id === placeId);
    if (placeIndex === -1) throw new Error('Place not found');

    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    places[placeIndex].reviews.unshift(newReview);
    this.savePlaces(places);
    return newReview;
  },

  addCheckIn(placeId: string, checkIn: Omit<CheckIn, 'id' | 'checkedInAt'>): CheckIn {
    const places = this.getPlaces();
    const placeIndex = places.findIndex(p => p.id === placeId);
    if (placeIndex === -1) throw new Error('Place not found');

    const newCheckIn: CheckIn = {
      ...checkIn,
      id: Math.random().toString(36).substr(2, 9),
      checkedInAt: new Date().toISOString(),
    };

    // Remove any checkin with the same dog name to avoid duplicates
    places[placeIndex].checkins = places[placeIndex].checkins.filter(
      c => c.dogName.toLowerCase() !== checkIn.dogName.toLowerCase()
    );

    places[placeIndex].checkins.push(newCheckIn);
    this.savePlaces(places);
    return newCheckIn;
  },

  removeCheckIn(placeId: string, checkInId: string) {
    const places = this.getPlaces();
    const placeIndex = places.findIndex(p => p.id === placeId);
    if (placeIndex === -1) return;

    places[placeIndex].checkins = places[placeIndex].checkins.filter(c => c.id !== checkInId);
    this.savePlaces(places);
  },

  getAlerts(): SafetyAlert[] {
    const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
      return INITIAL_ALERTS;
    }
    return JSON.parse(data);
  },

  addAlert(alert: Omit<SafetyAlert, 'id' | 'createdAt' | 'resolved'>): SafetyAlert {
    const alerts = this.getAlerts();
    const newAlert: SafetyAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    alerts.unshift(newAlert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    return newAlert;
  },

  resolveAlert(alertId: string) {
    const alerts = this.getAlerts();
    const index = alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      alerts[index].resolved = true;
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    }
  },

  getLostDogs(): LostDog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOST_DOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.LOST_DOGS, JSON.stringify(INITIAL_LOST_DOGS));
      return INITIAL_LOST_DOGS;
    }
    return JSON.parse(data);
  },

  addLostDog(dog: Omit<LostDog, 'id' | 'createdAt' | 'resolved'>): LostDog {
    const dogs = this.getLostDogs();
    const newDog: LostDog = {
      ...dog,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    dogs.unshift(newDog);
    localStorage.setItem(STORAGE_KEYS.LOST_DOGS, JSON.stringify(dogs));
    return newDog;
  },

  resolveLostDog(dogId: string) {
    const dogs = this.getLostDogs();
    const index = dogs.findIndex(d => d.id === dogId);
    if (index !== -1) {
      dogs[index].resolved = true;
      localStorage.setItem(STORAGE_KEYS.LOST_DOGS, JSON.stringify(dogs));
    }
  },

  getUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      const defaultUser = { username: 'Gość', isLoggedIn: false };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(data);
  },

  setUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getDonations(): CoffeeDonation[] {
    const data = localStorage.getItem(STORAGE_KEYS.DONATIONS);
    if (!data) {
      const initial: CoffeeDonation[] = [
        {
          id: 'd1',
          donorName: 'Reksio i Kasia',
          coffees: 3,
          message: 'Super inicjatywa, w końcu wiemy gdzie biegać! 🐾',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'd2',
          donorName: 'Tomek i Borys',
          coffees: 1,
          message: 'Dzięki za ostrzeżenie o dzikach na Tołpy!',
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        {
          id: 'd3',
          donorName: 'Luna & Marta',
          coffees: 5,
          message: 'Najlepsza mapa spacerowa we Wrocławiu! Polecam kawiarnie pod psem.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        }
      ];
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  addDonation(donation: Omit<CoffeeDonation, 'id' | 'createdAt'>): CoffeeDonation {
    const donations = this.getDonations();
    const newDonation: CoffeeDonation = {
      ...donation,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    donations.unshift(newDonation);
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    return newDonation;
  }
};
