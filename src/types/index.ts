export type Role = 'Super Admin' | 'Owner' | 'Manager' | 'Receptionist' | 'Accountant' | 'Librarian' | 'Security' | 'Viewer';

export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' | 'MAINTENANCE';

export type MembershipStatus = 'Active' | 'Expiring' | 'Expired' | 'Suspended';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Association {
  id: string;
  name: string;
  code: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst: string;
  totalSeats: number;
  totalRooms: number;
  activeStudents: number;
  monthlyRevenue: number;
  currency: string;
  timezone: string;
  logo?: string;
}

export interface User {
  id: string;
  associationId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  pin: string;
  phone: string;
  status: 'Active' | 'Inactive';
  permissions?: string[];
  roleId?: string;
  digitalSignature?: string;
}

export interface Room {
  id: string;
  associationId: string;
  name: string;
  floor: string;
  capacity: number;
  occupied: number;
  type: 'Reading Hall' | 'AC Silent' | 'Exam Focus' | 'Digital Lounge' | 'Discussion';
  isAc: boolean;
  hasWifi: boolean;
  hasCctv: boolean;
  hasCharging: boolean;
  status: 'Active' | 'Maintenance';
}

export interface Seat {
  id: string;
  associationId: string;
  roomId: string;
  seatNumber: string; // e.g. "A01", "A02", etc.
  row: string;
  column: number;
  type: 'Standard' | 'Premium' | 'Window View' | 'Quiet Corner';
  hasCharging: boolean;
  hasLamp: boolean;
  hasLocker: boolean;
  status: SeatStatus;
  studentId?: string;
  studentName?: string;
  studentMobile?: string;
  membershipEnd?: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. "STU-1024"
  associationId: string;
  name: string;
  photo: string;
  mobile: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  address: string;
  fatherName: string;
  emergencyContact: string;
  idProofType: string;
  idProofNumber: string;
  admissionDate: string;
  membershipPlan: string;
  membershipStatus: MembershipStatus;
  expiryDate: string;
  seatNumber?: string;
  roomId?: string;
  balanceDue: number;
  notes?: string;
}

export interface Admission {
  id: string;
  admissionNo: string; // e.g. "ADM-2025-015"
  associationId: string;
  studentId: string;
  studentName: string;
  seatNumber: string;
  roomName: string;
  planName: string;
  date: string;
  amount: number;
  discount: number;
  paymentMethod: PaymentMethod;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  receiptNo: string;
}

export interface MembershipPlan {
  id: string;
  associationId: string;
  name: string; // e.g. "1 Month", "3 Months", "6 Months", "1 Year"
  durationMonths: number;
  price: number;
  discount: number;
  description: string;
  seatType: string;
  benefits: string[];
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  associationId: string;
  studentId: string;
  studentName: string;
  seatNumber: string;
  roomName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  durationMinutes: number;
  status: 'Present' | 'Late' | 'Absent';
}

export interface PaymentTransaction {
  id: string;
  receiptNo: string; // e.g. "REC-78456"
  associationId: string;
  studentId: string;
  studentName: string;
  seatNumber?: string;
  planName?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: 'Completed' | 'Refunded' | 'Pending';
  notes: string;
  deviceId: string;
  receivedBy: string;
}

export interface SeatReservation {
  id: string;
  associationId: string;
  studentId: string;
  studentName: string;
  seatNumber: string;
  date: string;
  slot: string;
  status: 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
}

export interface Locker {
  id: string;
  associationId: string;
  lockerNo: string; // e.g. "L001"
  status: SeatStatus;
  studentId?: string;
  studentName?: string;
  deposit: number;
  expiryDate?: string;
}

export interface LeaveRequest {
  id: string;
  associationId: string;
  studentId: string;
  studentName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
}

export interface Visitor {
  id: string;
  associationId: string;
  name: string;
  mobile: string;
  purpose: string;
  visitedPerson: string;
  entryTime: string;
  exitTime?: string;
  date: string;
  status: 'Inside' | 'Exited';
}

export interface Complaint {
  id: string;
  complaintNo: string;
  associationId: string;
  studentId: string;
  studentName: string;
  category: 'Air Conditioning' | 'Wi-Fi' | 'Noise' | 'Lighting' | 'Cleanliness' | 'Other';
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedStaff: string;
  status: 'New' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  date: string;
  resolution?: string;
}

export interface Notice {
  id: string;
  associationId: string;
  title: string;
  content: string;
  category: 'Holiday' | 'Announcement' | 'Rules' | 'Exam Update' | 'Maintenance';
  audience: 'All Students' | 'Staff Only' | 'Room A & B';
  date: string;
  status: 'Active' | 'Scheduled' | 'Archived';
  pinned: boolean;
}

export interface RoleJoiningPayload {
  libraryId: string;
  orgName: string;
  role: Role;
  roleId: string;
  assignedTo?: string;
  mobile?: string;
  email?: string;
  shift?: string;
  salary?: number;
  permissions: string[];
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  digitalSignature: string;
  joinedAt?: string;
  status: 'PENDING_INVITE' | 'ACTIVE_SIGNED' | 'REVOKED';
}

export interface StaffMember {
  id: string;
  associationId: string;
  name: string;
  role: Role;
  mobile: string;
  email: string;
  salary: number;
  shift: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Pending Invitation';
  joiningDate: string;
  roleId?: string;
  digitalSignature?: string;
  permissions?: string[];
  signingPayload?: RoleJoiningPayload;
}

export interface Expense {
  id: string;
  associationId: string;
  category: 'Electricity' | 'Rent' | 'Maintenance' | 'Internet' | 'Salary' | 'Supplies' | 'Cleaning';
  amount: number;
  date: string;
  vendor: string;
  method: PaymentMethod;
  description: string;
  attachment?: string;
}

export interface Income {
  id: string;
  associationId: string;
  category: 'Membership' | 'Admission' | 'Locker' | 'Printing Services' | 'Cafeteria / Snacks' | 'Fine / Late Fee';
  amount: number;
  date: string;
  source: string;
  method: PaymentMethod;
  notes: string;
}

export interface SyncQueueItem {
  id: string;
  associationId: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  version: number;
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
}

export interface AuditLog {
  id: string;
  associationId: string;
  userId: string;
  userName: string;
  device: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  associationId: string;
  title: string;
  description: string;
  type: 'admission' | 'payment' | 'membership' | 'seats' | 'sync' | 'security';
  timestamp: string;
  read: boolean;
  timeAgo: string;
}

export interface DeviceInfo {
  id: string;
  associationId: string;
  deviceName: string;
  user: string;
  lastActive: string;
  lastSync: string;
  status: 'Online' | 'Offline' | 'Syncing';
  ip: string;
}

export interface Book {
  id: string;
  libraryId: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  edition?: string;
  category: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  coverImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  barcode: string;
  rfidTag?: string;
  condition: string;
  status: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE' | 'LOST';
  rackLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}
