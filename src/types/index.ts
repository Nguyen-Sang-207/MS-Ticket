// Central TypeScript type definitions for the entire application

// ==================== USER ====================
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'LOCAL' | 'GOOGLE';
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  locked: boolean;
  rankId?: string;
  rankName?: string;
  totalPoints?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== MOVIE ====================
export interface Movie {
  id: string;
  nameVn: string;
  nameEn: string;
  director: string;
  releaseDate: string;
  endDate: string;
  briefVn: string;
  briefEn: string;
  image: string;
  trailer: string;
  status: 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';
  ratings?: string;
  time: number; // duration in minutes
  countryId?: string;
  countryVn?: string;
  countryEn?: string;
  limitageId?: string;
  limitageNameVn?: string;
  limitageNameEn?: string;
  listActor?: Actor[];
  listGenre?: string[];
  format?: string;
  actor?: string; // director/main actor display string
  createdAt?: string;
  tmdbId?: number;
}

// ==================== ACTOR ====================
export interface Actor {
  id: string;
  nameVn: string;
  nameEn: string;
  image?: string;
}

// ==================== GENRE ====================
export interface Genre {
  id: string;
  nameVn: string;
  nameEn: string;
}

// ==================== THEATER ====================
export interface Theater {
  id: string;
  name: string;
  nameVn?: string;  // alias for admin pages
  nameEn?: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  image?: string;
  phone?: string;
  status?: string;
}

// ==================== ROOM ====================
export interface Room {
  id: string;
  name: string;
  theaterId: string;
  theaterName?: string;
  totalSeats?: number;
  rows?: number;
  cols?: number;
}

// ==================== SEAT ====================
export interface Seat {
  id: string;
  roomId: string;
  row: string;
  col: number;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'MAINTENANCE';
  seatTypeId: string;
  seatTypeName?: string;
  price?: number;
}

export interface SeatType {
  id: string;
  nameVn: string;
  nameEn: string;
  price: number;
  color?: string;
}

// ==================== SHOWTIME ====================
export interface Showtime {
  id: string;
  movieId: string;
  movieNameVn: string;
  movieNameEn?: string;
  movieImage?: string;
  theaterId: string;
  theaterName?: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  languageVn?: string;
  languageEn?: string;
  formatVn?: string;
  formatEn?: string;
  totalSeats?: number;
  availableSeats?: number;
  bookedSeats?: number;
  isAvailable?: boolean;
}

// ==================== BOOKING ====================
export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  movieNameVn?: string;
  theaterName?: string;
  roomName?: string;
  date?: string;
  startTime?: string;
  seats: BookingSeat[];
  combos?: BookingCombo[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentId?: string;
  qrCode?: string;
  createdAt: string;
}

export interface BookingSeat {
  seatId: string;
  row: string;
  col: number;
  seatTypeName?: string;
  price: number;
}

export interface BookingCombo {
  comboId: string;
  comboName: string;
  quantity: number;
  price: number;
}

// ==================== COMBO ====================
export interface Combo {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  items?: ComboItem[];
}

export interface ComboItem {
  id: string;
  name: string;
  quantity: number;
}

// ==================== PAYMENT ====================
export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOMO' | 'VNPAY' | 'ZALOPAY';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  createdAt: string;
}

// ==================== PRICING RULE ====================
export interface PricingRule {
  id: string;
  name: string;
  seatTypeId: string;
  formatId?: string;
  dayType?: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  price: number;
}

// ==================== RANK ====================
export interface Rank {
  id: string;
  nameVn: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  discountPercent: number;
  color?: string;
}

// ==================== SCHEDULE (AI) ====================
export interface ScheduleRequest {
  openTime: string;
  closeTime: string;
  startDate: string;
  endDate: string;
  hallId: string;
  movies: ScheduleMovie[];
}

export interface ScheduleMovie {
  id: string;
  duration: number;
  rating: number;
  type: number;
  format: string;
  language: string;
}

export interface ScheduleResult {
  schedules: DaySchedule[];
  statistics: {
    totalScreenings: number;
    utilizationRate: number;
    revenueScore: number;
  };
}

export interface DaySchedule {
  date: string;
  screenings: Screening[];
}

export interface Screening {
  movieId: string;
  startTime: string;
  endTime: string;
  score: number;
  position: string;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ==================== FORMAT / LANGUAGE / COUNTRY ====================
export interface Format {
  id: string;
  nameVn: string;
  nameEn: string;
}

export interface Language {
  id: string;
  nameVn: string;
  nameEn: string;
}

export interface Country {
  id: string;
  nameVn: string;
  nameEn: string;
}

export interface LimitAge {
  id: string;
  nameVn: string;
  nameEn: string;
  minAge: number;
}

// ==================== REVIEW ====================
export interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number; // 1-10
  comment?: string;
  createdAt: string;
}

// ==================== PROMOTION ====================
export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxUsage?: number;
  usedCount?: number;
  expireDate?: string;
  active: boolean;
  applicableFor?: 'ALL' | 'MEMBER' | 'BANK';
  bankName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== PRICING RULE (admin) ====================
export interface PricingRuleAdmin {
  id: string;
  name: string;
  seatType: string;
  format: string;
  dayType: 'WEEKDAY' | 'WEEKEND' | 'ALL';
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

