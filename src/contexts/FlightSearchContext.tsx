import { createContext, useContext, useState, type ReactNode } from "react";

export interface DuffelOffer {
  id: string;
  offer_id: string;
  airline_name: string;
  airline_code: string;
  flight_number: string;
  cabin_class: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  duration_raw?: string;
  stops: number;
  stop_airports: string[];
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  expires_at: string;
  emissions_kg: number | null;
  is_skiplag?: boolean;
  return_slice?: {
    departure_time: string;
    arrival_time: string;
    duration: string;
    stops: number;
  } | null;
}

export interface SearchParams {
  tripType: string;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  cabinClass: string;
  adults: number;
  children: number;
  infants: number;
}

interface FlightSearchContextType {
  searchParams: SearchParams | null;
  setSearchParams: (p: SearchParams | null) => void;
  outboundOffer: DuffelOffer | null;
  setOutboundOffer: (o: DuffelOffer | null) => void;
  returnOffer: DuffelOffer | null;
  setReturnOffer: (o: DuffelOffer | null) => void;
  allOutboundOffers: DuffelOffer[];
  setAllOutboundOffers: (o: DuffelOffer[]) => void;
  allReturnOffers: DuffelOffer[];
  setAllReturnOffers: (o: DuffelOffer[]) => void;
}

const FlightSearchContext = createContext<FlightSearchContextType>({
  searchParams: null,
  setSearchParams: () => {},
  outboundOffer: null,
  setOutboundOffer: () => {},
  returnOffer: null,
  setReturnOffer: () => {},
  allOutboundOffers: [],
  setAllOutboundOffers: () => {},
  allReturnOffers: [],
  setAllReturnOffers: () => {},
});

export const FlightSearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParamsRaw] = useState<SearchParams | null>(null);
  const [outboundOffer, setOutboundOffer] = useState<DuffelOffer | null>(null);
  const [returnOffer, setReturnOffer] = useState<DuffelOffer | null>(null);
  const [allOutboundOffers, setAllOutboundOffers] = useState<DuffelOffer[]>([]);
  const [allReturnOffers, setAllReturnOffers] = useState<DuffelOffer[]>([]);

  const setSearchParams = (p: SearchParams | null) => {
    setSearchParamsRaw(p);
    if (p && p.tripType === 'one_way') {
      setReturnOffer(null);
      setAllReturnOffers([]);
    }
  };

  return (
    <FlightSearchContext.Provider value={{
      searchParams, setSearchParams,
      outboundOffer, setOutboundOffer,
      returnOffer, setReturnOffer,
      allOutboundOffers, setAllOutboundOffers,
      allReturnOffers, setAllReturnOffers,
    }}>
      {children}
    </FlightSearchContext.Provider>
  );
};

export const useFlightSearch = () => useContext(FlightSearchContext);
