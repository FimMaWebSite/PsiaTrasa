export type PlaceType = 'park' | 'enclosure' | 'water' | 'cafe' | 'vet' | 'route';

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5 bones
  comment: string;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  dogName: string;
  dogBreed: string;
  dogSize: 'small' | 'medium' | 'large';
  dogTemperament: 'friendly' | 'neutral' | 'reactive';
  checkedInAt: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  type: PlaceType;
  routePoints?: [number, number][]; // coordinates for trails
  tags: string[]; // e.g. ["ogrodzony", "cień", "woda", "oświetlenie"]
  reviews: Review[];
  checkins: CheckIn[];
  distance?: number; // for routes, in km
  duration?: number; // for routes, in minutes
  difficulty?: 'easy' | 'medium' | 'hard'; // for routes
  imageUrl?: string;
}

export type AlertType = 'glass' | 'wild_animals' | 'poison' | 'other';

export interface SafetyAlert {
  id: string;
  lat: number;
  lng: number;
  type: AlertType;
  description: string;
  createdAt: string;
  reportedBy: string;
  resolved: boolean;
}

export interface LostDog {
  id: string;
  lat: number;
  lng: number;
  dogName: string;
  description: string;
  contactPhone: string;
  photoUrl?: string;
  createdAt: string;
  resolved: boolean;
}

export interface User {
  username: string;
  dogName?: string;
  isLoggedIn: boolean;
}
