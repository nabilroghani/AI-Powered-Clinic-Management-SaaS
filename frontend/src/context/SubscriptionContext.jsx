import { createContext, useContext, useMemo } from "react";

import { useAuth } from "./AuthContext.jsx";

const SubscriptionContext = createContext(null);

const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();

  const value = useMemo(
    () => ({
      plan: user?.subscriptionPlan || "Free",
      isPro: user?.subscriptionPlan === "Pro",
      patientProfile: user?.patientProfile || null
    }),
    [user]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

const useSubscription = () => {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider.");
  }

  return context;
};

export { SubscriptionProvider, useSubscription };
