export interface FlightResult {
  id: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  cabinClass: string;
  originIata: string;
  destinationIata: string;
  departureTime: string;
  arrivalTime: string;
  arrivesNextDay: boolean;
  durationFormatted: string;
  stops: number;
  priceUsd: number;
  prediction: "buy" | "wait";
  predictionConfidence: number;
  pointsEarn: number;
  pointsCard: string;
  visaInfo: string;
  safetyScore: number;
  isSkiplag: boolean;
  isSplitTicket: boolean;
  splitDetails?: string;
  isResilientCarrier: boolean;
  layoverAirport?: string;
}

export function getMockFlightsForDestination(destinationIata: string): FlightResult[] {
  if (destinationIata === "IST") {
    return [
      {
        id: "tk2",
        airlineCode: "TK",
        airlineName: "Turkish Airlines",
        flightNumber: "TK2",
        cabinClass: "Economy",
        originIata: "JFK",
        destinationIata: "IST",
        departureTime: "22:30",
        arrivalTime: "15:40",
        arrivesNextDay: true,
        durationFormatted: "10h 10m",
        stops: 0,
        priceUsd: 612,
        prediction: "buy",
        predictionConfidence: 92,
        pointsEarn: 3672,
        pointsCard: "Amex Gold",
        visaInfo: "e-Visa on arrival",
        safetyScore: 5,
        isSkiplag: false,
        isSplitTicket: false,
        isResilientCarrier: true,
      },
    ];
  }

  if (destinationIata === "TLV") {
    return [
      {
        id: "ly008",
        airlineCode: "LY",
        airlineName: "El Al",
        flightNumber: "LY008",
        cabinClass: "Economy",
        originIata: "JFK",
        destinationIata: "TLV",
        departureTime: "23:00",
        arrivalTime: "16:30",
        arrivesNextDay: true,
        durationFormatted: "11h 30m",
        stops: 0,
        priceUsd: 890,
        prediction: "buy",
        predictionConfidence: 87,
        pointsEarn: 5340,
        pointsCard: "Chase Sapphire",
        visaInfo: "No visa required",
        safetyScore: 8,
        isSkiplag: false,
        isSplitTicket: false,
        isResilientCarrier: true,
      },
      {
        id: "dl406",
        airlineCode: "DL",
        airlineName: "Delta",
        flightNumber: "DL406",
        cabinClass: "Economy",
        originIata: "JFK",
        destinationIata: "TLV",
        departureTime: "17:45",
        arrivalTime: "14:05",
        arrivesNextDay: true,
        durationFormatted: "14h 20m",
        stops: 1,
        priceUsd: 1240,
        prediction: "wait",
        predictionConfidence: 34,
        pointsEarn: 3720,
        pointsCard: "Delta SkyMiles",
        visaInfo: "No visa required",
        safetyScore: 8,
        isSkiplag: false,
        isSplitTicket: false,
        isResilientCarrier: false,
      },
      {
        id: "split-n0-ly",
        airlineCode: "N0",
        airlineName: "Norse + El Al",
        flightNumber: "N0→FCO + LY→TLV",
        cabinClass: "Economy",
        originIata: "JFK",
        destinationIata: "TLV",
        departureTime: "19:00",
        arrivalTime: "18:20",
        arrivesNextDay: true,
        durationFormatted: "17h 20m",
        stops: 1,
        priceUsd: 743,
        prediction: "buy",
        predictionConfidence: 78,
        pointsEarn: 2229,
        pointsCard: "Amex Gold",
        visaInfo: "No visa required",
        safetyScore: 8,
        isSkiplag: false,
        isSplitTicket: true,
        splitDetails: "2 separate tickets via Rome (FCO)",
        isResilientCarrier: true,
      },
      {
        id: "ua-skiplag",
        airlineCode: "UA",
        airlineName: "United",
        flightNumber: "UA84",
        cabinClass: "Economy",
        originIata: "JFK",
        destinationIata: "TLV",
        departureTime: "21:00",
        arrivalTime: "13:30",
        arrivesNextDay: true,
        durationFormatted: "10h 30m",
        stops: 1,
        priceUsd: 587,
        prediction: "buy",
        predictionConfidence: 88,
        pointsEarn: 1761,
        pointsCard: "United MileagePlus",
        visaInfo: "No visa required",
        safetyScore: 8,
        isSkiplag: true,
        isSplitTicket: false,
        isResilientCarrier: false,
      },
    ];
  }

  // Default fallback flights
  return [
    {
      id: "generic-1",
      airlineCode: "AA",
      airlineName: "American Airlines",
      flightNumber: "AA100",
      cabinClass: "Economy",
      originIata: "JFK",
      destinationIata: destinationIata,
      departureTime: "08:00",
      arrivalTime: "20:00",
      arrivesNextDay: false,
      durationFormatted: "12h 00m",
      stops: 1,
      priceUsd: 950,
      prediction: "buy",
      predictionConfidence: 72,
      pointsEarn: 2850,
      pointsCard: "Amex Gold",
      visaInfo: "Check visa requirements",
      safetyScore: 8,
      isSkiplag: false,
      isSplitTicket: false,
      isResilientCarrier: false,
    },
  ];
}
