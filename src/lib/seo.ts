import type { Metadata } from "next";

export const privateRouteRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
};
