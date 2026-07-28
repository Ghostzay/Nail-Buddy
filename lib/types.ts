/**
 * Database types.
 *
 * IMPORTANT: this describes the CURRENT schema plus the full post-migration
 * surface. Anything marked `(0001)`…`(0004)` only exists once the matching
 * file in supabase/migrations has been applied, and every read/write of one is
 * gated behind the corresponding flag in lib/flags.ts. Widening the types here
 * rather than casting at each call site keeps the target schema documented in
 * exactly one place.
 *
 * These MUST stay `type` aliases, never `interface` — see AUDIT.md §3.
 */

/** Legacy vocabulary and the 0004 vocabulary. Both are valid during rollout. */
export type JobStatus =
  | "pending" | "accepted" | "declined" | "completed"
  | "open" | "claimed" | "in_progress" | "complete" | "cancelled";

/** `squoval` requires 0004. */
export type Shape =
  | "square" | "squoval" | "almond" | "coffin" | "stiletto" | "round";

export type Length = "short" | "medium" | "long" | "xl";

/** blues/greens/purples require 0004. */
export type ColorFamily =
  | "nudes" | "reds" | "pinks" | "blacks" | "whites" | "chrome" | "glitter"
  | "blues" | "greens" | "purples";

export type DesignType =
  | "solid"
  | "french"
  | "ombre"
  | "simple_art"
  | "other";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  /** (0001) */
  first_name?: string | null;
  last_name?: string | null;
  language?: string;
  sensitivities?: string[];
  sms_consent?: boolean;
  referral_source?: string | null;
  last_seen_at?: string | null;
  /** (0001) generated column — digits only. */
  phone_normalized?: string | null;
};

export type Job = {
  id: string;
  customer_id: string;
  shape: Shape;
  length: Length;
  color_family: ColorFamily;
  design_type: DesignType;
  notes: string | null;
  notes_vi: string | null;
  photo_url: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  /** (0003) */
  requested_tech_id?: string | null;
  assigned_tech_id?: string | null;
  reassign_reason?: string | null;
  /** (0004) */
  started_at?: string | null;
  completed_at?: string | null;
  decline_reason?: string | null;
  photo_urls?: string[];
  color_families?: ColorFamily[];
  toe_color_families?: ColorFamily[];
};

/** (0003) */
export type Technician = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  photo_url: string | null;
  specialties: string[];
  is_clocked_in: boolean;
  active: boolean;
  created_at: string;
};

/** (0003) */
export type ServiceRow = {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string | null;
  group: string;
  price_cents: number;
  duration_min: number;
  is_base: boolean;
  requires_parent_group: string[];
  parallelizable: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
};

/** (0003) */
export type JobService = {
  job_id: string;
  service_id: string;
  price_cents: number;
};

/** (0002) — the masked row the kiosk is allowed to see. */
export type ClientLookupRow = {
  client_id: string;
  display_name: string;
  masked_phone: string;
  last_visit_at: string | null;
  last_visit_summary: string | null;
  language: string;
  sensitivities: string[];
};

export type JobWithCustomer = Job & {
  customer: Customer | null;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: Partial<Customer> & { name: string };
        Update: Partial<Customer>;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Partial<Job> & {
          customer_id: string;
          shape: Shape;
          length: Length;
          color_family: ColorFamily;
          design_type: DesignType;
        };
        Update: Partial<Job>;
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: InventoryItem;
        Insert: Partial<InventoryItem> & { name: string };
        Update: Partial<InventoryItem>;
        Relationships: [];
      };
      /** (0003) */
      technicians: {
        Row: Technician;
        Insert: Partial<Technician> & { display_name: string };
        Update: Partial<Technician>;
        Relationships: [];
      };
      /** (0003) */
      services: {
        Row: ServiceRow;
        Insert: Partial<ServiceRow> & { slug: string; name_en: string; group: string };
        Update: Partial<ServiceRow>;
        Relationships: [];
      };
      /** (0003) */
      job_services: {
        Row: JobService;
        Insert: JobService;
        Update: Partial<JobService>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** (0002) */
      client_lookup: {
        Args: { p_phone: string; p_device_id: string };
        Returns: ClientLookupRow[];
      };
      /** (0004) */
      claim_job: {
        Args: { p_job_id: string; p_tech_id: string | null };
        Returns: Job[];
      };
      /** (0004) */
      start_job: { Args: { p_job_id: string }; Returns: Job[] };
      /** (0004) */
      complete_job: { Args: { p_job_id: string }; Returns: Job[] };
    };
  };
};

export const SHAPE_OPTIONS: { value: Shape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "almond", label: "Almond" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
  { value: "round", label: "Round" },
];

export const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "xl", label: "XL" },
];

export const COLOR_FAMILY_OPTIONS: { value: ColorFamily; label: string }[] = [
  { value: "nudes", label: "Nudes" },
  { value: "reds", label: "Reds" },
  { value: "pinks", label: "Pinks" },
  { value: "blacks", label: "Blacks" },
  { value: "whites", label: "Whites" },
  { value: "chrome", label: "Chrome" },
  { value: "glitter", label: "Glitter" },
];

export const DESIGN_TYPE_OPTIONS: { value: DesignType; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "french", label: "French" },
  { value: "ombre", label: "Ombré" },
  { value: "simple_art", label: "Simple Art" },
  { value: "other", label: "Other" },
];
