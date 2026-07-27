export type JobStatus = "pending" | "accepted" | "declined" | "completed";

export type Shape = "square" | "almond" | "coffin" | "stiletto" | "round";

export type Length = "short" | "medium" | "long" | "xl";

export type ColorFamily =
  | "nudes"
  | "reds"
  | "pinks"
  | "blacks"
  | "whites"
  | "chrome"
  | "glitter";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
