/**
 * Campground Contacts & Trip Participants Types
 * For managing camping contacts and trip people
 */

import { Timestamp } from "firebase/firestore";

export type ParticipantRole = "host" | "co_host" | "guest" | "kid" | "pet" | "other";

export interface CampgroundContact {
  id: string;
  ownerId: string;
  contactUserId?: string | null;
  contactName: string;
  contactEmail?: string | null;
  contactNote?: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface TripParticipant {
  id: string;
  campgroundContactId: string;
  role: ParticipantRole;
  createdAt: Timestamp | string;
}

export interface CreateContactData {
  contactName: string;
  contactEmail?: string;
  contactNote?: string;
}

export interface UpdateContactData {
  contactName?: string;
  contactEmail?: string | null;
  contactNote?: string | null;
}

export interface ParticipantWithRole {
  contactId: string;
  role: ParticipantRole;
}
