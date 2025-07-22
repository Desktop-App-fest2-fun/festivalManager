import { useContext } from "react";
import EventsContext, { EventsContextType } from "../contexts/EventsContext";

// Custom hook to use the context
export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};