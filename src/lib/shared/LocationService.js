import { v4 as uuidv4 } from "uuid";

export class LocationService {
  constructor() {
    this.activeSessions = new Map();
  }

  createSession(data) {
    let sharingId;
    do {
      sharingId = uuidv4();
    } while (this.activeSessions.has(sharingId));

    const pace = data.pace || 8;
    const newSession = {
      sharingId,
      latitude: 0,
      longitude: 0,
      path: [],
      active: true,
      pace,
      destination: null,
      eta: null,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.activeSessions.set(sharingId, newSession);
    return newSession;
  }

  getSession(sharingId) {
    return this.activeSessions.get(sharingId);
  }

  updateSession(sharingId, updates) {
    if (!this.activeSessions.has(sharingId)) {
      return null;
    }

    const session = this.activeSessions.get(sharingId);
    const updatedSession = { ...session, ...updates, lastUpdated: new Date() };

    // Add to path if new coordinates are different
    if (updates.latitude && updates.longitude && updatedSession.path) {
      const lastPoint = updatedSession.path[updatedSession.path.length - 1];
      if (
        !lastPoint ||
        lastPoint[0] !== updates.latitude ||
        lastPoint[1] !== updates.longitude
      ) {
        updatedSession.path.push([updates.latitude, updates.longitude]);
      }
    }

    this.activeSessions.set(sharingId, updatedSession);
    return updatedSession;
  }

  setDestination(sharingId, destination) {
    return this.updateSession(sharingId, { destination });
  }

  deactivateSession(sharingId) {
    return this.updateSession(sharingId, { active: false });
  }

  getActiveSessionsCount() {
    return this.activeSessions.size;
  }
}

// Export a singleton instance for shared use
export const locationService = new LocationService();