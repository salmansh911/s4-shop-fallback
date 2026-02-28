"use client";

import { useEffect } from "react";
import { trackMarketingEvent, type MarketingEventName } from "@/lib/analytics/events";

type EventBeaconProps = {
  eventName: MarketingEventName;
  metadata?: Record<string, unknown>;
};

export default function EventBeacon({ eventName, metadata }: EventBeaconProps) {
  useEffect(() => {
    void trackMarketingEvent(eventName, metadata);
  }, [eventName, metadata]);

  return null;
}
