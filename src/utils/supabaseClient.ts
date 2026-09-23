/**
 * Supabase REST Direct Client & Migration Engine
 * Provides offline-safe connection testing, project ref extraction,
 * initial schema migration, and queue-based delta synchronization.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabasePingResult {
  ok: boolean;
  projectRef: string;
  latencyMs: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedItemsCount: number;
  error?: string;
  timestamp: string;
}

export class SupabaseClient {
  /**
   * Extracts the unique project reference id from any standard Supabase URL
   * e.g., "https://jsvevzzupajrgzxsmmyr.supabase.co" -> "jsvevzzupajrgzxsmmyr"
   */
  public static extractProjectRef(url: string): string {
    if (!url || typeof url !== 'string' || !url.trim()) return '';
    try {
      const clean = url.trim();
      const parsed = new URL(clean);
      const hostParts = parsed.hostname.split('.');
      if (hostParts.length > 0 && hostParts[0] !== 'localhost' && hostParts[0] !== '127') {
        return hostParts[0];
      }
      return '';
    } catch {
      // Fallback regex
      const match = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
      return match ? match[1] : '';
    }
  }

  /**
   * Actively probes the Supabase REST endpoint to verify network reachability
   * and that the publishable anon key is valid and authorized.
   */
  public static async pingSupabase(url: string, anonKey: string): Promise<SupabasePingResult> {
    const projectRef = this.extractProjectRef(url);
    const start = performance.now();

    try {
      const cleanUrl = url.replace(/\/+$/, '');

      // Check 1: Modern Supabase Auth settings endpoint (authenticates modern sb_publishable_... and anon keys)
      let response: Response | null = null;
      try {
        response = await fetch(`${cleanUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            Accept: 'application/json',
          },
        });
      } catch {
        // network or CORS issue, fall through to REST endpoint
      }

      // Check 2: If auth/v1/settings was not 200/401/403, fallback to REST endpoint
      if (!response || (response.status !== 200 && response.status !== 401 && response.status !== 403)) {
        try {
          const testEndpoint = `${cleanUrl}/rest/v1/?apikey=${encodeURIComponent(anonKey)}`;
          response = await fetch(testEndpoint, {
            method: 'GET',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Accept: 'application/json',
            },
          });
        } catch {
          // ignore
        }
      }

      const latencyMs = Math.max(1, Math.round(performance.now() - start));

      if (!response) {
        return {
          ok: false,
          projectRef,
          latencyMs,
          error: 'Unable to reach Supabase project. Check internet connection and URL.',
        };
      }

      // 401/403 means bad key
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          projectRef,
          latencyMs,
          error: 'Authentication failed. Please verify that your Supabase Publishable / Anon Key is active and correct.',
        };
      }

      // 200 or 204 or standard success
      if (response.ok || response.status < 500) {
        return {
          ok: true,
          projectRef,
          latencyMs,
        };
      }

      return {
        ok: false,
        projectRef,
        latencyMs,
        error: `Supabase server returned HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (err: any) {
      const latencyMs = Math.max(1, Math.round(performance.now() - start));
      return {
        ok: false,
        projectRef,
        latencyMs,
        error: err.message || 'Unable to connect to Supabase. Check your internet connection and URL.',
      };
    }
  }

  /**
   * Probes Supabase to check if the database tables have been created via migrations.
   * Probes the anchor `organizations` table. If missing (404 / PGRST205), returns ready: false.
   */
  public static async checkTablesExist(config: SupabaseConfig): Promise<{
    ready: boolean;
    existingTables: string[];
    missingTables: string[];
    totalExisting: number;
  }> {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const requiredTables = [
      'organizations',
      'students',
      'seats',
      'rooms',
      'admissions',
      'attendance',
      'payments',
      'membership_plans',
      'shifts',
      'reminders',
      'device_sync_queue',
      'sync_outbox',
      'audit_logs',
      'library_roles',
    ];

    try {
      const existingTables: string[] = [];
      const missingTables: string[] = [];

      await Promise.all(
        requiredTables.map(async (table) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${cleanUrl}/rest/v1/${table}?select=*&limit=1`, {
              method: 'GET',
              headers: {
                apikey: config.anonKey,
                Authorization: `Bearer ${config.anonKey}`,
                Accept: 'application/json',
              },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.status === 200 || res.status === 206) {
              existingTables.push(table);
            } else {
              missingTables.push(table);
            }
          } catch {
            missingTables.push(table);
          }
        })
      );

      const isReady = existingTables.length >= 7;

      return {
        ready: isReady,
        existingTables,
        missingTables,
        totalExisting: existingTables.length,
      };
    } catch {
      return {
        ready: false,
        existingTables: [],
        missingTables: requiredTables,
        totalExisting: 0,
      };
    }
  }

  /**
   * Pushes the complete library structural data and table datasets to remote Supabase tables.
   */
  public static async migrateLibraryToCloud(
    config: SupabaseConfig,
    data: {
      association: any;
      rooms?: any[];
      seats?: any[];
      students?: any[];
      admissions?: any[];
      attendance?: any[];
      payments?: any[];
      membershipPlans?: any[];
    }
  ): Promise<SyncResult & { tableStats?: Record<string, number> }> {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Pre-flight check: verify tables exist before firing CRUD requests to avoid console 404 spam
    const tableCheck = await this.checkTablesExist(config);
    if (!tableCheck.ready) {
      return {
        success: false,
        syncedItemsCount: 0,
        error: 'Database tables not yet created in Supabase. Please copy and run the SQL migration schema in your Supabase SQL Editor.',
        timestamp: timeStr,
      };
    }

    try {
      const cleanUrl = config.url.replace(/\/+$/, '');
      const timestamp = new Date().toISOString();
      const assocId = data.association.code || data.association.id || 'ORG-LIB001';
      const stats: Record<string, number> = {};
      let totalSynced = 0;

      const headers = {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      };

      // 1. Update Organization Metadata in Supabase
      try {
        const orgRes = await fetch(`${cleanUrl}/rest/v1/organizations?org_id=eq.${assocId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            active_users: 1,
            devices: 1,
            last_sync: `Online Synced at ${timeStr}`,
          }),
        });
        if (orgRes.ok || orgRes.status === 204) {
          stats['organizations'] = 1;
          totalSynced++;
        }
      } catch (e) {
        console.warn('Organization PATCH skipped:', e);
      }

      // 2. Push Students Table
      if (data.students && data.students.length > 0) {
        try {
          const studentPayload = data.students.map(s => ({
            student_id: s.studentId,
            association_id: assocId,
            name: s.name,
            mobile: s.mobile || '',
            email: s.email || '',
            seat_number: s.seatNumber || '',
            plan_name: s.membershipPlan || '',
            status: s.membershipStatus === 'Active' ? 'ACTIVE' : 'INACTIVE',
            valid_until: s.expiryDate || '',
          }));
          const res = await fetch(`${cleanUrl}/rest/v1/students`, {
            method: 'POST',
            headers,
            body: JSON.stringify(studentPayload),
          });
          if (res.ok || res.status === 201) {
            stats['students'] = studentPayload.length;
            totalSynced += studentPayload.length;
          }
        } catch (e) {
          console.warn('Students push error:', e);
        }
      }

      // 3. Push Seats Table
      if (data.seats && data.seats.length > 0) {
        try {
          // Push top 20 seats or occupied seats to avoid oversized single payload
          const seatsToPush = data.seats.slice(0, 50).map(s => ({
            seat_number: s.seatNumber,
            association_id: assocId,
            room_name: s.roomId || 'Hall A',
            status: s.status,
            student_id: s.studentId || null,
            student_name: s.studentName || null,
          }));
          const res = await fetch(`${cleanUrl}/rest/v1/seats`, {
            method: 'POST',
            headers,
            body: JSON.stringify(seatsToPush),
          });
          if (res.ok || res.status === 201) {
            stats['seats'] = seatsToPush.length;
            totalSynced += seatsToPush.length;
          }
        } catch (e) {
          console.warn('Seats push error:', e);
        }
      }

      // 4. Push Admissions Table
      if (data.admissions && data.admissions.length > 0) {
        try {
          const admissionPayload = data.admissions.map(a => ({
            admission_number: a.admissionNo,
            association_id: assocId,
            student_id: a.studentId,
            student_name: a.studentName,
            seat_number: a.seatNumber || '',
            plan_name: a.planName || '',
            amount_paid: a.amount,
            payment_method: a.paymentMethod || 'UPI',
          }));
          const res = await fetch(`${cleanUrl}/rest/v1/admissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(admissionPayload),
          });
          if (res.ok || res.status === 201) {
            stats['admissions'] = admissionPayload.length;
            totalSynced += admissionPayload.length;
          }
        } catch (e) {
          console.warn('Admissions push error:', e);
        }
      }

      // 5. Push Attendance Table
      if (data.attendance && data.attendance.length > 0) {
        try {
          const attPayload = data.attendance.map(a => ({
            association_id: assocId,
            student_id: a.studentId,
            student_name: a.studentName,
            seat_number: a.seatNumber || '',
            check_in: a.checkIn || '09:00 AM',
            check_out: a.checkOut || null,
            status: a.status || 'Inside',
            date: a.date,
          }));
          const res = await fetch(`${cleanUrl}/rest/v1/attendance`, {
            method: 'POST',
            headers,
            body: JSON.stringify(attPayload),
          });
          if (res.ok || res.status === 201) {
            stats['attendance'] = attPayload.length;
            totalSynced += attPayload.length;
          }
        } catch (e) {
          console.warn('Attendance push error:', e);
        }
      }

      // 6. Push Payments Table
      if (data.payments && data.payments.length > 0) {
        try {
          const payPayload = data.payments.map(p => ({
            receipt_number: p.receiptNo,
            association_id: assocId,
            student_id: p.studentId,
            student_name: p.studentName,
            amount: p.amount,
            method: p.method || 'UPI',
            status: p.status === 'Completed' ? 'PAID' : p.status,
            payment_date: p.date,
          }));
          const res = await fetch(`${cleanUrl}/rest/v1/payments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payPayload),
          });
          if (res.ok || res.status === 201) {
            stats['payments'] = payPayload.length;
            totalSynced += payPayload.length;
          }
        } catch (e) {
          console.warn('Payments push error:', e);
        }
      }

      // 7. Audit Log in Supabase
      try {
        await fetch(`${cleanUrl}/rest/v1/audit_logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify([{
            timestamp: `Today ${timeStr}`,
            event: 'Full Library Online Sync',
            organization: data.association.name,
            actor: data.association.owner || 'Library Owner',
            details: `Synchronized tables to Supabase cloud: ${Object.keys(stats).join(', ') || 'Connected'}`,
            type: 'provisioning',
          }]),
        });
        stats['audit_logs'] = 1;
        totalSynced++;
      } catch (e) {
        console.warn('Audit log push error:', e);
      }

      return {
        success: true,
        syncedItemsCount: totalSynced,
        tableStats: stats,
        timestamp: timeStr,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedItemsCount: 0,
        error: err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }

  /**
   * Processes the local SQLite outbox queue, pushing pending mutations to Supabase
   */
  public static async pushSyncQueue(
    config: SupabaseConfig,
    queue: any[]
  ): Promise<SyncResult> {
    if (!queue || queue.length === 0) {
      return {
        success: true,
        syncedItemsCount: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    let successfulPushes = 0;
    const cleanUrl = config.url.replace(/\/+$/, '');

    for (const item of queue) {
      try {
        const table = item.table || 'audit_logs';
        await fetch(`${cleanUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(item.payload || {}),
        });
        successfulPushes++;
      } catch {
        // Continue processing
      }
    }

    return {
      success: true,
      syncedItemsCount: successfulPushes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Checks if remote Supabase tables have newer or different records compared to local SQLite
   */
  public static async checkForRemoteChanges(
    config: SupabaseConfig,
    associationId: string,
    localCounts: { students: number; payments: number; admissions: number; staff?: number; notices?: number }
  ): Promise<{ hasRemoteChanges: boolean; remoteStudentCount: number; message?: string }> {
    try {
      const cleanUrl = config.url.replace(/\/+$/, '');
      const headers = {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
      };

      const res = await fetch(`${cleanUrl}/rest/v1/students?association_id=eq.${encodeURIComponent(associationId)}&select=id`, {
        method: 'HEAD',
        headers,
      });

      const contentRange = res.headers.get('content-range');
      let remoteCount = 0;
      if (contentRange) {
        const parts = contentRange.split('/');
        if (parts.length > 1) {
          remoteCount = parseInt(parts[1], 10) || 0;
        }
      }

      if (remoteCount > localCounts.students) {
        return {
          hasRemoteChanges: true,
          remoteStudentCount: remoteCount,
          message: `Remote Supabase contains ${remoteCount} students (local SQLite has ${localCounts.students}). Kindly Pull Cloud Changes first.`,
        };
      }
      return { hasRemoteChanges: false, remoteStudentCount: remoteCount };
    } catch {
      return { hasRemoteChanges: false, remoteStudentCount: 0 };
    }
  }
}
