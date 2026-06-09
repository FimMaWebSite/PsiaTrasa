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
  createdBy?: string;
  status?: 'approved' | 'pending' | 'rejected';
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
  createdBy?: string;
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
  createdBy?: string;
}

export interface User {
  username: string;
  dogName?: string;
  dogBreed?: string;
  dogSize?: 'small' | 'medium' | 'large';
  dogTemperament?: 'friendly' | 'neutral' | 'reactive';
  isLoggedIn: boolean;
  avatarUrl?: string;
  email?: string;
}

export interface CoffeeDonation {
  id: string;
  donorName: string;
  coffees: number;
  message?: string;
  createdAt: string;
}

export const POPULAR_BREEDS = [
  'Kundelek / Mieszaniec',
  'Labrador Retriever',
  'Golden Retriever',
  'Owczarek Niemiecki',
  'Buldog Francuski',
  'Border Collie',
  'Jack Russell Terrier',
  'Cavalier King Charles',
  'Yorkshire Terrier',
  'Shih Tzu',
  'Cocker Spaniel',
  'Siberian Husky',
  'Chihuahua',
  'Beagle',
  'Mops',
  'Bokser',
  'Samojed',
  'Maltańczyk',
  'Pudel',
  'Whippet',
  'Berneński Pies Pasterski',
  'Boston Terrier',
  'Owczarek Australijski (Aussie)',
  'Welsh Corgi',
  'Amstaff / Pitbull',
  'Sznaucer',
  'Jamnik',
  'Seter Irlandzki',
  'Doberman',
  'Rottweiler',
  'Akita',
  'Inna rasa'
];

