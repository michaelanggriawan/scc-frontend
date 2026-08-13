// Mirrors the SCC backend domain model.

export type UserRole = 'customer' | 'admin';
export type EntityStatus = 'Active' | 'Inactive';

export type InquiryStatus =
  | 'New Inquiry'
  | 'Awaiting Payment'
  | 'Payment Submitted'
  | 'Confirmed'
  | 'Payment Rejected'
  | 'Cancelled';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  company: string;
  role: UserRole;
  passwordChangedAt: string | null;
}

export interface RoomSpec {
  system: string;
  spec: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: string;
  area: string;
  status: EntityStatus;
  description: string;
  facilities: string[];
  specs: RoomSpec[];
  photos: string[];
  floorPlans: string[];
  specPdfUrl: string | null;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
  order: number;
}

export interface PaymentProof {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
}

export interface Inquiry {
  id: string;
  ref: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string | null;
  roomId: string | null;
  addonIds: string[];
  date: string;
  time: string;
  duration: string;
  category: string;
  notes: string;
  status: InquiryStatus;
  agreedPrice: number | null;
  paymentDueDate: string | null;
  adminNotes: string;
  rejectionReason: string;
  rejectionCount: number;
  cancelledBy: string | null;
  cancelReason: string;
  createdAt: string;
  // enriched (detail endpoints only)
  room?: Room | null;
  addons?: AddOn[];
  proofs?: PaymentProof[];
  paymentLink?: { url: string; expiresAt: string | null; expired: boolean } | null;
}

export interface VenueInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  mapEmbedUrl?: string;
}

export interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrImageUrl: string | null;
  instructions: string;
}

export interface NotificationPrefs {
  newInquiry: boolean;
  paymentSubmitted: boolean;
  linkExpiringSoon: boolean;
  dailySummary: boolean;
}

export interface PayPageData {
  ref: string;
  status: InquiryStatus;
  payable: boolean;
  amount: number | null;
  dueDate: string | null;
  customerName: string;
  room: Room | null;
  addons: AddOn[];
  paymentInfo: PaymentInfo;
}

export interface DashboardStats {
  totalInquiries: number;
  awaitingPayment: number;
  paymentSubmitted: number;
  confirmed: number;
  cancelled: number;
  activeRooms: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
