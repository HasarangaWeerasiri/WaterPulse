import emailService from './emailService.js';

/**
 * Notification Service — domain-level notification orchestration
 *
 * SRP : Knows WHEN and WHAT to notify. Delegates HOW to emailService.
 * OCP : New channels (SMS, push) are added here without touching taskService.
 * DIP : Depends on the emailService abstraction, not on Resend directly.
 *
 * Email triggers:
 *  Event                 Recipient(s)              Content                      
 *  Task created          Authority (assignedTo)    Assignment details           
 *  Task created          Citizen  (reportedBy)     Report acknowledged notice   
 *  Task → completed      Admin    (assignedBy)     Completion summary           
 *  Task → cancelled      Authority (assignedTo)    Cancellation alert          

 */
class NotificationService {

  //  Helpers 

  _fullName(user) {
    if (!user) return 'Unknown';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }

  _formatDate(date) {
    if (!date) return 'No due date set';
    return new Date(date).toDateString();
  }

  /** Priority → badge colour */
  _priorityColor(priority) {
    return { high: '#dc2626', medium: '#d97706', low: '#16a34a' }[priority] ?? '#6b7280';
  }

  /** Status → badge colour */
  _statusColor(status) {
    return {
      completed:   '#16a34a',
      cancelled:   '#dc2626',
      in_progress: '#2563eb',
      pending:     '#6b7280',
    }[status] ?? '#6b7280';
  }

  /**
   * Minimal reusable HTML email shell.
   * @param {string} title   - Pre-header / page title
   * @param {string} content - Inner HTML injected into the card body
   */
  _template(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;
                    box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;">
              💧 WaterPulse
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              This is an automated message from WaterPulse. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── Public notification methods ──────────────────────────────────────────

  /**
   * Notify an authority that a new task has been assigned to them.
   * Expected populated fields: assignedTo.email, reportId.address
   *
   * @param {Object} task - Populated Mongoose Task document
   * @returns {Promise<void>}
   */
  async notifyTaskAssigned(task) {
    // Send both emails concurrently — one failure does not block the other
    await Promise.allSettled([
      this._notifyAuthorityTaskAssigned(task),
      this._notifyCitizenReportAcknowledged(task),
    ]);
  }

  // ─── Private task-assigned handlers ──────────────────────────────────────

  async _notifyAuthorityTaskAssigned(task) {
    const authority = task.assignedTo;

    if (!authority?.email) {
      console.warn('[NotificationService] _notifyAuthorityTaskAssigned: authority has no email — skipping.');
      return;
    }

    const priorityColor = this._priorityColor(task.priority);
    const location      = task.reportId?.address || 'Location not specified';
    const dueDate       = this._formatDate(task.dueDate);
    const description   = task.description || 'No additional description provided.';
    const adminName     = this._fullName(task.assignedBy);

    const html = this._template('New Task Assigned — WaterPulse', `
      <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">New Task Assigned</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        You have been assigned a new task by <strong>${adminName}</strong>.
      </p>

      <!-- Task title -->
      <h3 style="margin:0 0 16px;color:#1d4ed8;font-size:18px;">${task.title}</h3>

      <!-- Priority badge -->
      <p style="margin:0 0 20px;">
        <span style="background:${priorityColor};color:#fff;padding:4px 12px;
                     border-radius:9999px;font-size:12px;font-weight:bold;
                     text-transform:uppercase;">
          ${task.priority} priority
        </span>
      </p>

      <!-- Details table -->
      <table width="100%" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;width:140px;font-weight:bold;">📍 Location</td>
          <td style="border:1px solid #e5e7eb;">${location}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">📅 Due Date</td>
          <td style="border:1px solid #e5e7eb;">${dueDate}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;font-weight:bold;">📝 Description</td>
          <td style="border:1px solid #e5e7eb;">${description}</td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Please log in to the WaterPulse system to view full task details and update the status
        when you arrive at the location.
      </p>
    `);

    await emailService.sendEmail({
      to: authority.email,
      subject: `[WaterPulse] New Task Assigned: ${task.title}`,
      html,
    });
  }

  async _notifyCitizenReportAcknowledged(task) {
    const citizen = task.reportId?.reportedBy;

    if (!citizen?.email) {
      console.warn('[NotificationService] _notifyCitizenReportAcknowledged: citizen has no email — skipping.');
      return;
    }

    const citizenName = this._fullName(citizen);
    const reportTitle = task.reportId?.title || 'Your report';
    const location    = task.reportId?.address || 'the reported location';
    const authorityName = this._fullName(task.assignedTo);

    const html = this._template('Your Report Is Being Actioned — WaterPulse', `
      <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">✅ Your Report Has Been Acknowledged</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        Hi <strong>${citizenName}</strong>, thank you for your report. Our team has reviewed it
        and assigned a field officer to investigate.
      </p>

      <h3 style="margin:0 0 20px;color:#1d4ed8;font-size:18px;">${reportTitle}</h3>

      <table width="100%" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;width:160px;font-weight:bold;">📍 Location</td>
          <td style="border:1px solid #e5e7eb;">${location}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">👷 Assigned officer</td>
          <td style="border:1px solid #e5e7eb;">${authorityName}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;font-weight:bold;">📋 Current status</td>
          <td style="border:1px solid #e5e7eb;">
            <span style="background:#d97706;color:#fff;padding:2px 10px;
                         border-radius:9999px;font-size:12px;font-weight:bold;">
              Under Investigation
            </span>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        We will keep you informed as the situation develops.
        Thank you for helping keep our water supply safe.
      </p>
    `);

    await emailService.sendEmail({
      to: citizen.email,
      subject: `[WaterPulse] Your report "${reportTitle}" is being investigated`,
      html,
    });
  }

  /**
   * Notify relevant parties when a task's status changes.
   *  - completed → admin receives a completion summary
   *  - cancelled → authority receives a cancellation alert
   *
   * @param {Object} task - Populated Mongoose Task document
   * @returns {Promise<void>}
   */
  async notifyTaskStatusUpdated(task) {
    if (task.status === 'completed') {
      // Notify both admin and citizen concurrently
      await Promise.allSettled([
        this._notifyTaskCompleted(task),
        this._notifyCitizenTaskCompleted(task),
      ]);
    }
    if (task.status === 'cancelled') await this._notifyTaskCancelled(task);
  }

  // ─── Private per-status handlers ──────────────────────────────────────────

  async _notifyTaskCompleted(task) {
    const admin = task.assignedBy;

    if (!admin?.email) {
      console.warn('[NotificationService] _notifyTaskCompleted: admin has no email — skipping.');
      return;
    }

    const authorityName = this._fullName(task.assignedTo);
    const completedAt   = task.completedAt
      ? new Date(task.completedAt).toLocaleString()
      : new Date().toLocaleString();

    const html = this._template('Task Completed — WaterPulse', `
      <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">✅ Task Completed</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        A task assigned by you has been marked as completed.
      </p>

      <h3 style="margin:0 0 20px;color:#1d4ed8;font-size:18px;">${task.title}</h3>

      <table width="100%" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;width:140px;font-weight:bold;">👷 Completed by</td>
          <td style="border:1px solid #e5e7eb;">${authorityName}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">🕐 Completed at</td>
          <td style="border:1px solid #e5e7eb;">${completedAt}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;font-weight:bold;">📍 Location</td>
          <td style="border:1px solid #e5e7eb;">${task.reportId?.address || 'N/A'}</td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Log in to WaterPulse to review the task and update the associated report status.
      </p>
    `);

    await emailService.sendEmail({
      to: admin.email,
      subject: `[WaterPulse] Task Completed: ${task.title}`,
      html,
    });
  }

  async _notifyCitizenTaskCompleted(task) {
    const citizen = task.reportId?.reportedBy;

    if (!citizen?.email) {
      console.warn('[NotificationService] _notifyCitizenTaskCompleted: citizen has no email — skipping.');
      return;
    }

    const citizenName   = this._fullName(citizen);
    const reportTitle   = task.reportId?.title || 'Your report';
    const location      = task.reportId?.address || 'the reported location';
    const authorityName = this._fullName(task.assignedTo);
    const completedAt   = task.completedAt
      ? new Date(task.completedAt).toLocaleString()
      : new Date().toLocaleString();

    const html = this._template('Issue Resolved — WaterPulse', `
      <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">✅ Your Report Has Been Resolved</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        Hi <strong>${citizenName}</strong>, we're pleased to let you know that the issue you
        reported has been investigated and resolved by our field team.
      </p>

      <h3 style="margin:0 0 20px;color:#1d4ed8;font-size:18px;">${reportTitle}</h3>

      <table width="100%" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;width:160px;font-weight:bold;">📍 Location</td>
          <td style="border:1px solid #e5e7eb;">${location}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">👷 Resolved by</td>
          <td style="border:1px solid #e5e7eb;">${authorityName}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;font-weight:bold;">🕐 Resolved at</td>
          <td style="border:1px solid #e5e7eb;">${completedAt}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">📋 Status</td>
          <td style="border:1px solid #e5e7eb;">
            <span style="background:#16a34a;color:#fff;padding:2px 10px;
                         border-radius:9999px;font-size:12px;font-weight:bold;">
              Resolved
            </span>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Thank you for helping keep our water supply safe.
        Your contribution made a difference.
      </p>
    `);

    await emailService.sendEmail({
      to: citizen.email,
      subject: `[WaterPulse] Your report "${reportTitle}" has been resolved`,
      html,
    });
  }

  async _notifyTaskCancelled(task) {
    const authority = task.assignedTo;

    if (!authority?.email) {
      console.warn('[NotificationService] _notifyTaskCancelled: authority has no email — skipping.');
      return;
    }

    const html = this._template('Task Cancelled — WaterPulse', `
      <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">❌ Task Cancelled</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        A task previously assigned to you has been cancelled.
      </p>

      <h3 style="margin:0 0 20px;color:#dc2626;font-size:18px;">${task.title}</h3>

      <table width="100%" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;width:140px;font-weight:bold;">📍 Location</td>
          <td style="border:1px solid #e5e7eb;">${task.reportId?.address || 'N/A'}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;font-weight:bold;">👤 Assigned by</td>
          <td style="border:1px solid #e5e7eb;">${this._fullName(task.assignedBy)}</td>
        </tr>
      </table>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        No action is required from you. Please log in to WaterPulse
        for any further updates from your administrator.
      </p>
    `);

    await emailService.sendEmail({
      to: authority.email,
      subject: `[WaterPulse] Task Cancelled: ${task.title}`,
      html,
    });
  }
}

export default new NotificationService();
