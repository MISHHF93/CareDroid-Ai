/**
 * Sync Service - Handles synchronization between offline storage and backend
 * NOTE: Requires dexie library - install with: npm install dexie
 */
import { db, initializeDatabase } from '../db/offline.db';
import offlineService from './offlineService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.AUTO_SYNC_INTERVAL = 30000; // 30 seconds
  }

  /**
   * Initialize sync service
   */
  initialize() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Start periodic sync if online
    if (navigator.onLine) {
      this.startAutoSync();
    }

    console.log('SyncService initialized');
  }

  /**
   * Handle coming online
   */
  handleOnline() {
    console.log('Connection restored - starting sync');
    this.syncAll();
    this.startAutoSync();
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('Connection lost - stopping auto-sync');
    this.stopAutoSync();
  }

  /**
   * Start automatic syncing
   */
  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, this.AUTO_SYNC_INTERVAL);

    console.log('Auto-sync started');
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Sync all unsynced data
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync - offline');
      return;
    }

    this.isSyncing = true;

    try {
      const token = localStorage.getItem('caredroid_access_token');
      if (!token) {
        console.log('No auth token - skipping sync');
        this.isSyncing = false;
        return;
      }

      console.log('Starting full sync...');

      // Get all unsynced items
      const unsynced = await offlineService.getUnsyncedItems();
      console.log(`Found ${unsynced.total} unsynced items`);

      if (unsynced.total === 0) {
        this.isSyncing = false;
        return;
      }

      // Sync messages
      await this.syncMessages(unsynced.messages, token);

      // Sync conversations
      await this.syncConversations(unsynced.conversations, token);

      // Sync tool results
      await this.syncToolResults(unsynced.toolResults, token);

      // Sync notifications
      await this.syncNotifications(unsynced.notifications, token);

      // Sync audit logs
      await this.syncAuditLogs(unsynced.auditLogs, token);

      console.log('Full sync completed successfully');

      // Download latest data from server
      await this.downloadLatestData(token);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync messages
   */
  async syncMessages(messages, token) {
    if (messages.length === 0) return;

    console.log(`Syncing ${messages.length} messages...`);

    for (const message of messages) {
      try {
        const response = await fetch(
          '/api/chat/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              conversationId: message.conversationId,
              content: message.content,
              role: message.role,
              timestamp: message.timestamp,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to sync message: ${response.status}`);
        }

        const data = await response.json();

        // Mark as synced
        await offlineService.markAsSynced('messages', message.id);

        // Update with server ID if needed
        if (data.id) {
          await db.messages.update(message.id, { serverId: data.id });
        }
      } catch (error) {
        console.error(`Failed to sync message ${message.id}:`, error);
      }
    }

    console.log('Messages synced');
  }

  /**
   * Sync conversations
   */
  async syncConversations(conversations, token) {
    if (conversations.length === 0) return;

    console.log(`Syncing ${conversations.length} conversations...`);

    for (const conversation of conversations) {
      try {
        const response = await fetch(
          '/api/chat/conversations',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: conversation.userId,
              title: conversation.title,
              lastMessageAt: conversation.lastMessageAt,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to sync conversation: ${response.status}`);
        }

        const data = await response.json();

        await offlineService.markAsSynced('conversations', conversation.id);

        if (data.id) {
          await db.conversations.update(conversation.id, { serverId: data.id });
        }
      } catch (error) {
        console.error(`Failed to sync conversation ${conversation.id}:`, error);
      }
    }

    console.log('Conversations synced');
  }

  /**
   * Sync tool results
   */
  async syncToolResults(toolResults, token) {
    if (toolResults.length === 0) return;

    console.log(`Syncing ${toolResults.length} tool results...`);

    for (const result of toolResults) {
      try {
        const response = await fetch(
          '/api/tools/results',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              toolType: result.toolType,
              input: result.input,
              output: result.output,
              timestamp: result.timestamp,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to sync tool result: ${response.status}`);
        }

        await offlineService.markAsSynced('toolResults', result.id);
      } catch (error) {
        console.error(`Failed to sync tool result ${result.id}:`, error);
      }
    }

    console.log('Tool results synced');
  }

  /**
   * Sync notifications
   */
  async syncNotifications(notifications, token) {
    if (notifications.length === 0) return;

    console.log(`Syncing ${notifications.length} notifications...`);

    for (const notification of notifications) {
      try {
        if (notification.read && notification.serverId) {
          // Mark as read on server
          const response = await fetch(
            `/api/notifications/${notification.serverId}/read`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to mark notification as read: ${response.status}`);
          }
        }

        await offlineService.markAsSynced('notifications', notification.id);
      } catch (error) {
        console.error(`Failed to sync notification ${notification.id}:`, error);
      }
    }

    console.log('Notifications synced');
  }

  /**
   * Sync audit logs
   */
  async syncAuditLogs(auditLogs, token) {
    if (auditLogs.length === 0) return;

    console.log(`Syncing ${auditLogs.length} audit logs...`);

    // Audit logs are typically server-generated, but we may have local actions to sync

    for (const log of auditLogs) {
      try {
        const response = await fetch(
          '/api/audit/sync',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: log.action,
              resourceType: log.resourceType,
              resourceId: log.resourceId,
              timestamp: log.timestamp,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to sync audit log: ${response.status}`);
        }

        await offlineService.markAsSynced('auditLogs', log.id);
      } catch (error) {
        console.error(`Failed to sync audit log ${log.id}:`, error);
      }
    }

    console.log('Audit logs synced');
  }

  /**
   * Download latest data from server
   */
  async downloadLatestData(token) {
    try {
      console.log('Downloading latest data from server...');

      // Get user profile
      const profileResponse = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData) {
          await offlineService.saveUserProfile(
            profileData.id,
            profileData
          );
        }
      }

      // Get latest notifications
      const notificationsResponse = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        if (notificationsData.notifications) {
          for (const notification of notificationsData.notifications) {
            // Only save if not already in local DB
            const existing = await db.notifications.get(notification.id);
            if (!existing) {
              await db.notifications.add({
                ...notification,
                synced: true,
              });
            }
          }
        }
      }

      console.log('Latest data downloaded');
    } catch (error) {
      console.error('Failed to download latest data:', error);
    }
  }

  /**
   * Force immediate sync
   */
  async forceSyncNow() {
    return await this.syncAll();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
      autoSyncEnabled: this.syncInterval !== null,
    };
  }

  /**
   * Clear all offline data and resync
   */
  async resetAndResync() {
    try {
      console.log('Resetting offline data...');

      // Clear all offline data
      await db.messages.clear();
      await db.conversations.clear();
      await db.toolResults.clear();
      await db.auditLogs.clear();
      await db.notifications.clear();
      await db.knowledgeCache.clear();

      // Download fresh data
      const token = localStorage.getItem('caredroid_access_token');
      if (token) {
        await this.downloadLatestData(token);
      }

      console.log('Reset and resync completed');
    } catch (error) {
      console.error('Failed to reset and resync:', error);
      throw error;
    }
  }
}

// Export singleton instance
const syncService = new SyncService();
export default syncService;
