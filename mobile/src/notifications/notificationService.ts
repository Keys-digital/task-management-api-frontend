import { NotificationPreferences, Task } from "../sdk/types";

export interface ScheduledNotification {
  id: string;
  taskId: number;
  title: string;
  body: string;
  triggerTime: number; // UNIX timestamp
}

export class NotificationService {
  private scheduled: ScheduledNotification[] = [];
  private pushToken: string | null = null;

  /**
   * Evaluates user notification preferences before scheduling
   */
  public shouldNotify(type: keyof NotificationPreferences, prefs?: NotificationPreferences): boolean {
    if (!prefs) return true;
    return Boolean(prefs[type]);
  }

  /**
   * Schedule local device push notification for task due dates
   */
  public scheduleTaskDueDateNotification(task: Task, userPrefs?: NotificationPreferences): ScheduledNotification | null {
    if (!task.due_date) return null;
    if (!this.shouldNotify("due_date", userPrefs)) return null;

    const dueDateTimestamp = new Date(task.due_date).getTime();
    if (isNaN(dueDateTimestamp) || dueDateTimestamp <= Date.now()) {
      return null;
    }

    const notification: ScheduledNotification = {
      id: `notif_task_${task.id}`,
      taskId: task.id,
      title: `Task Due Soon: ${task.title}`,
      body: task.description || `Your TaskFlo task "${task.title}" is due soon.`,
      triggerTime: dueDateTimestamp - 15 * 60 * 1000, // 15 mins prior
    };

    this.scheduled.push(notification);
    return notification;
  }

  /**
   * List all locally scheduled notifications
   */
  public getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduled];
  }

  /**
   * Cancel scheduled notification for a given task ID
   */
  public cancelTaskNotification(taskId: number): void {
    this.scheduled = this.scheduled.filter((n) => n.taskId !== taskId);
  }

  /**
   * Documented APNs / FCM Push Token Registration Contract
   * In future production builds, sends token to POST /api/notifications/register-device/
   */
  public async registerPushToken(token: string): Promise<{ success: boolean; token: string }> {
    this.pushToken = token;
    return {
      success: true,
      token: this.pushToken,
    };
  }

  public getPushToken(): string | null {
    return this.pushToken;
  }
}

export const defaultNotificationService = new NotificationService();
