import axios from 'axios';

class AnalyticsTracker {
  constructor() {
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.activityQueue = [];
    this.isTracking = false;
    this.heartbeatInterval = null;
  }

  // Initialize tracking
  async startTracking() {
    if (this.isTracking) return;
    
    try {
      // Start a new session
      const response = await axios.post('/analytics/session/start', {
        sessionType: 'GENERAL',
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString()
        }
      });

      this.currentSessionId = response.data.sessionId;
      this.sessionStartTime = new Date();
      this.isTracking = true;

      // Start heartbeat to track activity
      this.startHeartbeat();

      // Track page view
      this.trackActivity('PAGE_VIEW', {
        page: window.location.pathname,
        title: document.title
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('Analytics tracking started');
    } catch (error) {
      console.error('Failed to start analytics tracking:', error);
    }
  }

  // Stop tracking
  async stopTracking() {
    if (!this.isTracking) return;

    try {
      // End the current session
      if (this.currentSessionId) {
        await axios.patch(`/analytics/session/${this.currentSessionId}/end`);
      }

      // Clear heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Flush activity queue
      await this.flushActivityQueue();

      this.isTracking = false;
      this.currentSessionId = null;
      this.sessionStartTime = null;

      console.log('Analytics tracking stopped');
    } catch (error) {
      console.error('Failed to stop analytics tracking:', error);
    }
  }

  // Track activity
  async trackActivity(activityType, metadata = {}) {
    if (!this.isTracking) return;

    const activity = {
      activityType,
      page: window.location.pathname,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    // Add to queue for batch processing
    this.activityQueue.push(activity);

    // If queue is getting large, flush it
    if (this.activityQueue.length >= 10) {
      await this.flushActivityQueue();
    }
  }

  // Track assignment start
  async trackAssignmentStart(assignmentId) {
    await this.trackActivity('ASSIGNMENT_START', { assignmentId });
    
    try {
      const response = await axios.post('/analytics/assignment/start', {
        assignmentId
      });
      return response.data.attemptId;
    } catch (error) {
      console.error('Failed to track assignment start:', error);
      return null;
    }
  }

  // Track assignment completion
  async trackAssignmentComplete(attemptId, answers = {}, score = null, feedback = {}) {
    await this.trackActivity('ASSIGNMENT_COMPLETE', { 
      attemptId, 
      score,
      answersCount: Object.keys(answers).length 
    });

    try {
      await axios.patch(`/analytics/assignment/${attemptId}/complete`, {
        answers,
        score,
        feedback
      });
    } catch (error) {
      console.error('Failed to track assignment completion:', error);
    }
  }

  // Track resource access
  async trackResourceAccess(resourceId, resourceType) {
    await this.trackActivity('RESOURCE_ACCESS', {
      resourceId,
      resourceType,
      accessMethod: 'direct'
    });
  }

  // Start heartbeat to track active time
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // Track activity every 30 seconds if user is active
      if (document.hasFocus()) {
        this.trackActivity('HEARTBEAT', {
          activeTime: Date.now() - this.sessionStartTime.getTime()
        });
      }
    }, 30000); // 30 seconds
  }

  // Flush activity queue
  async flushActivityQueue() {
    if (this.activityQueue.length === 0) return;

    const activities = [...this.activityQueue];
    this.activityQueue = [];

    try {
      // Send activities in batches
      for (const activity of activities) {
        await axios.post('/analytics/activity', activity);
      }
    } catch (error) {
      console.error('Failed to flush activity queue:', error);
      // Re-add activities to queue for retry
      this.activityQueue.unshift(...activities);
    }
  }

  // Set up event listeners for user interactions
  setupEventListeners() {
    // Track clicks on important elements
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Track clicks on buttons, links, and form elements
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'INPUT') {
        this.trackActivity('USER_INTERACTION', {
          element: target.tagName,
          text: target.textContent?.substring(0, 50) || target.value?.substring(0, 50),
          className: target.className
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.trackActivity('FORM_SUBMIT', {
        formId: e.target.id || 'unknown',
        formAction: e.target.action
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackActivity('PAGE_HIDDEN');
      } else {
        this.trackActivity('PAGE_VISIBLE');
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.stopTracking();
    });
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      isTracking: this.isTracking,
      queueLength: this.activityQueue.length
    };
  }
}

// Create singleton instance
const analyticsTracker = new AnalyticsTracker();

// Auto-start tracking for students
if (typeof window !== 'undefined') {
  // Check if user is a student
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'STUDENT') {
        // Start tracking after a short delay
        setTimeout(() => {
          analyticsTracker.startTracking();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to parse token for analytics:', error);
    }
  }
}

export default analyticsTracker; 