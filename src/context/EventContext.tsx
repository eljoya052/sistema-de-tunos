import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Event } from '../types/database';
import { repository } from '../lib/repository';

interface EventContextType {
  activeEvent: Event | null;
  events: Event[];
  setActiveEventId: (id: string) => Promise<void>;
  createEvent: (name: string, date: string, actorId: string) => Promise<Event>;
  toggleEventStatus: (id: string, status: 'ACTIVO' | 'FINALIZADO') => Promise<void>;
  refreshEvents: () => Promise<void>;
  isLoading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const all = await repository.getEvents();
      const current = await repository.getActiveEvent();
      setEvents(all);
      setActiveEvent(current);
    } catch (e) {
      console.error('Error loading events:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = repository.subscribeRealtime((event) => {
      if (
        event.type === 'ACTIVE_EVENT_CHANGED' ||
        event.type === 'EVENT_CREATED' ||
        event.type === 'EVENT_STATUS_UPDATED' ||
        event.type === 'DATABASE_RESET'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  const setActiveEventId = async (id: string) => {
    await repository.setActiveEvent(id);
    await loadData();
  };

  const createEvent = async (name: string, date: string, actorId: string): Promise<Event> => {
    const ev = await repository.createEvent(name, date, actorId);
    await loadData();
    return ev;
  };

  const toggleEventStatus = async (id: string, status: 'ACTIVO' | 'FINALIZADO') => {
    await repository.toggleEventStatus(id, status);
    await loadData();
  };

  return (
    <EventContext.Provider
      value={{
        activeEvent,
        events,
        setActiveEventId,
        createEvent,
        toggleEventStatus,
        refreshEvents: loadData,
        isLoading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
