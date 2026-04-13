import { createContext, useContext, useState, type ReactNode } from "react";
import { type FlightResult } from "@/lib/mockFlights";

interface FlightContextType {
  selectedOffer: FlightResult | null;
  setSelectedOffer: (offer: FlightResult | null) => void;
}

const FlightContext = createContext<FlightContextType>({
  selectedOffer: null,
  setSelectedOffer: () => {},
});

export const FlightProvider = ({ children }: { children: ReactNode }) => {
  const [selectedOffer, setSelectedOffer] = useState<FlightResult | null>(null);
  return (
    <FlightContext.Provider value={{ selectedOffer, setSelectedOffer }}>
      {children}
    </FlightContext.Provider>
  );
};

export const useFlightContext = () => useContext(FlightContext);
