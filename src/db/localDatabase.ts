import {
  Association,
  User,
  Room,
  Seat,
  Student,
  Admission,
  MembershipPlan,
  AttendanceRecord,
  PaymentTransaction,
  Locker,
  Expense,
  Notice,
  Visitor,
  Complaint,
  StaffMember,
  SyncQueueItem,
  AuditLog,
  AppNotification,
  DeviceInfo,
  ThemeMode,
  SeatStatus,
  PaymentMethod,
} from '../types';

import {
  initialAssociations,
  initialUsers,
  initialRooms,
  initialMembershipPlans,
  generateInitialSeats,
  initialStudents,
  initialAdmissions,
  initialPayments,
  initialAttendanceRecords,
  initialLockers,
  initialNotifications,
  initialDevices,
  initialStaff,
  initialExpenses,
  initialNotices,
  initialVisitors,
  initialComplaints,
  initialAuditLogs,
} from './initialData';

const DB_KEY_PREFIX = 'lib_mgmt_';

export class LocalDatabase {
  private static instance: LocalDatabase;

  public associations: Association[] = [];
  public users: User[] = [];
  public rooms: Room[] = [];
  public seats: Seat[] = [];
  public students: Student[] = [];
  public admissions: Admission[] = [];
  public membershipPlans: MembershipPlan[] = [];
  public attendance: AttendanceRecord[] = [];
  public payments: PaymentTransaction[] = [];
  public lockers: Locker[] = [];
  public expenses: Expense[] = [];
  public notices: Notice[] = [];
  public visitors: Visitor[] = [];
  public complaints: Complaint[] = [];
  public staff: StaffMember[] = [];
  public syncQueue: SyncQueueItem[] = [];
  public auditLogs: AuditLog[] = [];
  public notifications: AppNotification[] = [];
  public devices: DeviceInfo[] = [];

  // System states
  public currentAssociationId = 'assoc-1';
  public currentUser: User = initialUsers[0];
  public isOnline = true; // Toggleable in dev mode offline simulator
  public isSyncing = false;
  public lastSyncTime = '10:24 AM';
  public theme: ThemeMode = 'dark';

  private subscribers: Array<() => void> = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  public subscribe(cb: () => void) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notify() {
    this.saveToStorage();
    this.subscribers.forEach(cb => cb());
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(`${DB_KEY_PREFIX}state`);
      const savedTheme = (localStorage.getItem('lib_mgmt_theme') as ThemeMode) || null;
      if (stored) {
        const data = JSON.parse(stored);
        this.associations = data.associations || initialAssociations;
        this.users = data.users || initialUsers;
        this.rooms = data.rooms || initialRooms;
        this.seats = data.seats || generateInitialSeats();
        this.students = data.students || initialStudents;
        this.admissions = data.admissions || initialAdmissions;
        this.membershipPlans = data.membershipPlans || initialMembershipPlans;
        this.attendance = data.attendance || initialAttendanceRecords;
        this.payments = data.payments || initialPayments;
        this.lockers = data.lockers || initialLockers;
        this.expenses = data.expenses || initialExpenses;
        this.notices = data.notices || initialNotices;
        this.visitors = data.visitors || initialVisitors;
        this.complaints = data.complaints || initialComplaints;
        this.staff = data.staff || initialStaff;
        this.syncQueue = data.syncQueue || [];
        this.auditLogs = data.auditLogs || initialAuditLogs;
        this.notifications = data.notifications || initialNotifications;
        this.devices = data.devices || initialDevices;
        this.currentAssociationId = data.currentAssociationId || 'assoc-1';
        this.isOnline = data.isOnline !== undefined ? data.isOnline : true;
        this.theme = savedTheme || data.theme || 'dark';
        this.lastSyncTime = data.lastSyncTime || '10:24 AM';
        this.applyThemeToDOM(this.theme);
        return;
      }
    } catch (e) {
      console.warn('Could not load local database, initializing fresh seed', e);
    }
    this.resetToSeed();
    this.applyThemeToDOM(this.theme);
  }

  public saveToStorage() {
    try {
      const state = {
        associations: this.associations,
        users: this.users,
        rooms: this.rooms,
        seats: this.seats,
        students: this.students,
        admissions: this.admissions,
        membershipPlans: this.membershipPlans,
        attendance: this.attendance,
        payments: this.payments,
        lockers: this.lockers,
        expenses: this.expenses,
        notices: this.notices,
        visitors: this.visitors,
        complaints: this.complaints,
        staff: this.staff,
        syncQueue: this.syncQueue,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        devices: this.devices,
        currentAssociationId: this.currentAssociationId,
        isOnline: this.isOnline,
        theme: this.theme,
        lastSyncTime: this.lastSyncTime,
      };
      localStorage.setItem(`${DB_KEY_PREFIX}state`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist local DB state to localStorage', e);
    }
  }

  public resetToSeed() {
    this.associations = [...initialAssociations];
    this.users = [...initialUsers];
    this.rooms = [...initialRooms];
    this.seats = generateInitialSeats();
    this.students = [...initialStudents];
    this.admissions = [...initialAdmissions];
    this.membershipPlans = [...initialMembershipPlans];
    this.attendance = [...initialAttendanceRecords];
    this.payments = [...initialPayments];
    this.lockers = [...initialLockers];
    this.expenses = [...initialExpenses];
    this.notices = [...initialNotices];
    this.visitors = [...initialVisitors];
    this.complaints = [...initialComplaints];
    this.staff = [...initialStaff];
    this.syncQueue = [];
    this.auditLogs = [...initialAuditLogs];
    this.notifications = [...initialNotifications];
    this.devices = [...initialDevices];
    this.currentAssociationId = 'assoc-1';
    this.isOnline = true;
    this.theme = 'dark';
    this.lastSyncTime = '10:24 AM';
    this.notify();
  }

  // --- Multi-Tenant Helpers ---
  public getCurrentAssociation(): Association {
    return (
      this.associations.find(a => a.id === this.currentAssociationId) ||
      this.associations[0]
    );
  }

  public setAssociation(assocId: string) {
    this.currentAssociationId = assocId;
    this.notify();
  }

  // --- Theme Helpers ---
  public applyThemeToDOM(theme: ThemeMode) {
    if (typeof document === 'undefined') return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }

  public setTheme(theme: ThemeMode) {
    this.theme = theme;
    try {
      localStorage.setItem('lib_mgmt_theme', theme);
    } catch {
      // ignore
    }
    this.applyThemeToDOM(theme);
    this.notify();
  }

  // --- Device Activation (Image 2 - Flow Step 7-11) ---
  public isDeviceActivated: boolean = true;

  public activateDevice(licenseId: string, activationCode: string): { success: boolean; message?: string } {
    if (!licenseId || !activationCode) {
      return { success: false, message: 'License ID and Activation Code are required.' };
    }
    const cleanLic = licenseId.trim().toUpperCase();
    const cleanCode = activationCode.trim().toUpperCase();

    // Check valid license formats e.g. LIC-8F72K91, LIC-000001, or any valid LIC- pattern
    if (cleanLic.startsWith('LIC-') && cleanCode.length >= 6) {
      this.isDeviceActivated = true;
      try {
        localStorage.setItem('lib_mgmt_device_activated', 'true');
        localStorage.setItem('lib_mgmt_license_id', cleanLic);
      } catch {
        // ignore
      }
      this.addAudit('DEVICE_ACTIVATED', 'Security', `Device registered successfully under license ${cleanLic}.`);
      this.enqueueSync('device', 'DEVICE-7A91X', 'INSERT', {
        licenseId: cleanLic,
        deviceId: 'DEVICE-7A91X',
        status: 'ACTIVE',
        activatedAt: new Date().toISOString(),
      });
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Invalid or expired activation code from Management Server.' };
  }

  // --- Dev Mode Offline Simulator ---
  public toggleOnline(forceState?: boolean) {
    this.isOnline = forceState !== undefined ? forceState : !this.isOnline;
    this.notify();
  }

  // --- Enqueue Outbox Sync Event ---
  private enqueueSync(entityType: string, entityId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      associationId: this.currentAssociationId,
      deviceId: 'Reception PC (Local)',
      entityType,
      entityId,
      operation,
      payload: JSON.stringify(payload),
      version: 1,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };
    this.syncQueue.unshift(item);
  }

  // --- Audit Log ---
  private addAudit(action: string, module: string, details: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      associationId: this.currentAssociationId,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      device: 'Reception PC',
      action,
      module,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.auditLogs.unshift(log);
  }

  // --- Core Transactional Operation: New Admission ---
  public newAdmissionTransaction(params: {
    name: string;
    mobile: string;
    email: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
    address: string;
    fatherName: string;
    emergencyContact: string;
    idProofType: string;
    idProofNumber: string;
    planId: string;
    roomId: string;
    seatNumber: string;
    amount: number;
    discount: number;
    paymentMethod: PaymentMethod;
  }): { student: Student; admission: Admission; payment: PaymentTransaction } {
    const studentCount = this.students.length + 1;
    const studentIdCode = `STU-${1023 + studentCount}`;
    const admissionNo = `ADM-2025-0${studentCount < 10 ? '0' : ''}${studentCount}`;
    const receiptNo = `REC-${78456 + studentCount}`;

    const plan = this.membershipPlans.find(p => p.id === params.planId) || this.membershipPlans[0];
    const room = this.rooms.find(r => r.id === params.roomId) || this.rooms[0];

    const todayStr = '28 Apr 2025';
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + plan.durationMonths);
    const expiryStr = expiry.toISOString().split('T')[0];

    // 1. Create Student
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentId: studentIdCode,
      associationId: this.currentAssociationId,
      name: params.name,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      mobile: params.mobile,
      email: params.email,
      gender: params.gender,
      dob: params.dob,
      address: params.address,
      fatherName: params.fatherName,
      emergencyContact: params.emergencyContact,
      idProofType: params.idProofType,
      idProofNumber: params.idProofNumber,
      admissionDate: todayStr,
      membershipPlan: plan.name,
      membershipStatus: 'Active',
      expiryDate: expiryStr,
      seatNumber: params.seatNumber,
      roomId: params.roomId,
      balanceDue: 0,
    };
    this.students.unshift(newStudent);

    // 2. Mark Seat as Occupied
    const seatIdx = this.seats.findIndex(
      s => s.roomId === params.roomId && s.seatNumber === params.seatNumber
    );
    if (seatIdx !== -1) {
      this.seats[seatIdx] = {
        ...this.seats[seatIdx],
        status: 'OCCUPIED',
        studentId: newStudent.studentId,
        studentName: newStudent.name,
        studentMobile: newStudent.mobile,
        membershipEnd: expiryStr,
      };
    }

    // 3. Create Admission Record
    const newAdmission: Admission = {
      id: `adm-${Date.now()}`,
      admissionNo,
      associationId: this.currentAssociationId,
      studentId: newStudent.studentId,
      studentName: newStudent.name,
      seatNumber: params.seatNumber,
      roomName: room.name,
      planName: plan.name,
      date: todayStr,
      amount: params.amount,
      discount: params.discount,
      paymentMethod: params.paymentMethod,
      status: 'Active',
      receiptNo,
    };
    this.admissions.unshift(newAdmission);

    // 4. Create Financial Transaction & Receipt
    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      receiptNo,
      associationId: this.currentAssociationId,
      studentId: newStudent.studentId,
      studentName: newStudent.name,
      seatNumber: params.seatNumber,
      planName: plan.name,
      amount: params.amount,
      method: params.paymentMethod,
      date: todayStr,
      status: 'Completed',
      notes: `Admission fee for ${plan.name}`,
      deviceId: 'Reception PC',
      receivedBy: this.currentUser.name,
    };
    this.payments.unshift(newPayment);

    // 5. Audit & Sync
    this.addAudit(
      'ADMISSION_CREATED',
      'Admissions',
      `Admitted ${params.name} (${studentIdCode}) into ${room.name} (Seat ${params.seatNumber}). Paid ₹${params.amount} via ${params.paymentMethod}.`
    );
    this.enqueueSync('admission', newAdmission.id, 'INSERT', {
      student: newStudent,
      admission: newAdmission,
      payment: newPayment,
    });

    this.notify();
    return { student: newStudent, admission: newAdmission, payment: newPayment };
  }

  // --- Collect Payment Transaction ---
  public collectPaymentTransaction(params: {
    studentId: string;
    studentName: string;
    seatNumber?: string;
    planName?: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }): PaymentTransaction {
    const receiptNo = `REC-${78460 + this.payments.length}`;
    const payment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      receiptNo,
      associationId: this.currentAssociationId,
      studentId: params.studentId,
      studentName: params.studentName,
      seatNumber: params.seatNumber,
      planName: params.planName || 'Monthly Renewal',
      amount: params.amount,
      method: params.method,
      date: '28 Apr 2025',
      status: 'Completed',
      notes: params.notes || 'Counter fee collection',
      deviceId: 'Reception PC',
      receivedBy: this.currentUser.name,
    };

    this.payments.unshift(payment);

    // Update student balance if any
    const stu = this.students.find(s => s.studentId === params.studentId);
    if (stu && stu.balanceDue > 0) {
      stu.balanceDue = Math.max(0, stu.balanceDue - params.amount);
    }

    this.addAudit(
      'PAYMENT_COLLECTED',
      'Payments',
      `Collected ₹${params.amount} from ${params.studentName} (${params.studentId}) via ${params.method}. Receipt: ${receiptNo}.`
    );
    this.enqueueSync('payment', payment.id, 'INSERT', payment);

    this.notify();
    return payment;
  }

  // --- Seat Transfer Transaction ---
  public transferSeatTransaction(params: {
    studentId: string;
    fromSeatNumber: string;
    toRoomId: string;
    toSeatNumber: string;
    reason: string;
  }) {
    const student = this.students.find(s => s.studentId === params.studentId);
    if (!student) throw new Error('Student not found');

    // 1. Release old seat
    const oldSeat = this.seats.find(s => s.seatNumber === params.fromSeatNumber);
    if (oldSeat) {
      oldSeat.status = 'AVAILABLE';
      oldSeat.studentId = undefined;
      oldSeat.studentName = undefined;
      oldSeat.studentMobile = undefined;
    }

    // 2. Occupy new seat
    const newSeat = this.seats.find(
      s => s.roomId === params.toRoomId && s.seatNumber === params.toSeatNumber
    );
    if (newSeat) {
      newSeat.status = 'OCCUPIED';
      newSeat.studentId = student.studentId;
      newSeat.studentName = student.name;
      newSeat.studentMobile = student.mobile;
      newSeat.membershipEnd = student.expiryDate;
    }

    // 3. Update student record
    student.seatNumber = params.toSeatNumber;
    student.roomId = params.toRoomId;

    this.addAudit(
      'SEAT_TRANSFER',
      'Seats',
      `Transferred ${student.name} from Seat ${params.fromSeatNumber} to ${params.toSeatNumber}. Reason: ${params.reason}.`
    );
    this.enqueueSync('seat_transfer', `${student.id}-transfer`, 'UPDATE', {
      studentId: student.studentId,
      from: params.fromSeatNumber,
      to: params.toSeatNumber,
      reason: params.reason,
    });

    this.notify();
  }

  // --- Seat Status Update ---
  public updateSeatStatus(seatId: string, status: SeatStatus, studentName?: string) {
    const seat = this.seats.find(s => s.id === seatId);
    if (!seat) return;
    const oldStatus = seat.status;
    seat.status = status;
    if (status === 'AVAILABLE') {
      seat.studentId = undefined;
      seat.studentName = undefined;
      seat.studentMobile = undefined;
    } else if (status === 'OCCUPIED' && studentName) {
      seat.studentName = studentName;
    }

    this.addAudit('SEAT_STATUS_CHANGE', 'Seats', `Seat ${seat.seatNumber} status changed from ${oldStatus} to ${status}`);
    this.enqueueSync('seat', seat.id, 'UPDATE', seat);
    this.notify();
  }

  // --- Attendance Check-in / Check-out ---
  public recordAttendance(studentId: string): { success: boolean; message: string; record?: AttendanceRecord } {
    const student = this.students.find(s => s.studentId === studentId);
    if (!student) {
      return { success: false, message: 'Student ID not recognized.' };
    }

    // Check if currently checked in today
    const existing = this.attendance.find(
      a => a.studentId === studentId && a.date === '2025-04-28' && !a.checkOut
    );

    if (existing) {
      // Check out
      existing.checkOut = '11:15 AM';
      existing.durationMinutes = 240;
      this.addAudit('ATTENDANCE_CHECKOUT', 'Attendance', `${student.name} (${student.studentId}) checked out.`);
      this.enqueueSync('attendance', existing.id, 'UPDATE', existing);
      this.notify();
      return { success: true, message: `Checked OUT: ${student.name} (Duration: 4h 0m)`, record: existing };
    } else {
      // Check in
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        associationId: this.currentAssociationId,
        studentId: student.studentId,
        studentName: student.name,
        seatNumber: student.seatNumber || 'Unassigned',
        roomName: 'Room A - Reading Hall',
        date: '2025-04-28',
        checkIn: '10:45 AM',
        durationMinutes: 0,
        status: 'Present',
      };
      this.attendance.unshift(record);
      this.addAudit('ATTENDANCE_CHECKIN', 'Attendance', `${student.name} (${student.studentId}) checked in at Seat ${record.seatNumber}.`);
      this.enqueueSync('attendance', record.id, 'INSERT', record);
      this.notify();
      return { success: true, message: `Checked IN: ${student.name} (Seat ${record.seatNumber})`, record };
    }
  }

  // --- Locker Assignment ---
  public updateLocker(lockerNo: string, status: SeatStatus, studentName?: string) {
    const locker = this.lockers.find(l => l.lockerNo === lockerNo);
    if (!locker) return;
    locker.status = status;
    locker.studentName = status === 'OCCUPIED' ? studentName : undefined;
    this.addAudit('LOCKER_UPDATE', 'Lockers', `Locker ${lockerNo} updated to ${status}`);
    this.enqueueSync('locker', locker.id, 'UPDATE', locker);
    this.notify();
  }

  // --- Expense Addition ---
  public addExpense(params: Omit<Expense, 'id' | 'associationId'>) {
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      associationId: this.currentAssociationId,
      ...params,
    };
    this.expenses.unshift(exp);
    this.addAudit('EXPENSE_CREATED', 'Expenses', `Added expense ₹${exp.amount} for ${exp.category} (${exp.vendor}).`);
    this.enqueueSync('expense', exp.id, 'INSERT', exp);
    this.notify();
    return exp;
  }

  // --- Notice Addition ---
  public addNotice(params: Omit<Notice, 'id' | 'associationId'>) {
    const notice: Notice = {
      id: `not-${Date.now()}`,
      associationId: this.currentAssociationId,
      ...params,
    };
    this.notices.unshift(notice);
    this.addAudit('NOTICE_PUBLISHED', 'Notices', `Published notice: "${notice.title}".`);
    this.enqueueSync('notice', notice.id, 'INSERT', notice);
    this.notify();
    return notice;
  }

  // --- Visitor Check-in / out ---
  public addVisitor(params: Omit<Visitor, 'id' | 'associationId' | 'status'>) {
    const visitor: Visitor = {
      id: `vis-${Date.now()}`,
      associationId: this.currentAssociationId,
      ...params,
      status: 'Inside',
    };
    this.visitors.unshift(visitor);
    this.addAudit('VISITOR_CHECKIN', 'Visitors', `Visitor entry: ${visitor.name} (${visitor.purpose}).`);
    this.enqueueSync('visitor', visitor.id, 'INSERT', visitor);
    this.notify();
    return visitor;
  }

  public exitVisitor(id: string) {
    const v = this.visitors.find(item => item.id === id);
    if (v) {
      v.status = 'Exited';
      v.exitTime = '11:30 AM';
      this.addAudit('VISITOR_CHECKOUT', 'Visitors', `Visitor checkout: ${v.name}.`);
      this.enqueueSync('visitor', v.id, 'UPDATE', v);
      this.notify();
    }
  }

  // --- Sync Engine: Trigger Cloud Sync ---
  public async triggerSyncNow(): Promise<{ syncedCount: number; error?: string }> {
    if (!this.isOnline) {
      return { syncedCount: 0, error: 'Internet is offline. Cannot reach Supabase cloud.' };
    }

    this.isSyncing = true;
    this.notify();

    // Simulate network round-trip to Supabase PostgreSQL & Storage
    await new Promise(resolve => setTimeout(resolve, 1400));

    const pendingCount = this.syncQueue.length;
    // Mark pending as synced
    this.syncQueue.forEach(item => {
      item.status = 'SYNCED';
    });

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.lastSyncTime = `Today ${timeString}`;
    this.isSyncing = false;

    // Add sync notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      associationId: this.currentAssociationId,
      title: 'Cloud Sync Successful',
      description: `${pendingCount > 0 ? pendingCount : 18} records synchronized with PostgreSQL cloud.`,
      type: 'sync',
      timestamp: timeString,
      read: false,
      timeAgo: 'Just now',
    });

    this.notify();
    return { syncedCount: pendingCount || 18 };
  }
}

export const db = LocalDatabase.getInstance();
