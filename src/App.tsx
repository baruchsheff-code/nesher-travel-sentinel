import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FlightSearchProvider } from "@/contexts/FlightSearchContext";
import OfflineBanner from "@/components/OfflineBanner";
import SplashScreen from "@/components/SplashScreen";
import { useState, useCallback } from "react";
import Index from "./pages/Index.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import SelectReturn from "./pages/SelectReturn.tsx";
import TripReview from "./pages/TripReview.tsx";
import AddOns from "./pages/AddOns.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MyTrips from "./pages/MyTrips.tsx";
import Settings from "./pages/Settings.tsx";
import Business from "./pages/Business.tsx";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!splashDone && <SplashScreen onDone={handleSplashDone} />}
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
            <OfflineProvider>
            <FlightSearchProvider>
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/select-return" element={<SelectReturn />} />
              <Route path="/trip-review" element={<TripReview />} />
              <Route path="/add-ons" element={<AddOns />} />
              <Route path="/my-trips" element={<MyTrips />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Settings />} />
              <Route path="/business" element={<Business />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </FlightSearchProvider>
            </OfflineProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
