export type LoanStatus = 'active' | 'returned' | 'overdue' | 'lost'
export type ItemCategory = 'Electronics' | 'Tools' | 'Books' | 'Clothing' | 'Sports' | 'Kitchen' | 'Office' | 'Other'
export type PlanTier = 'free' | 'pro' | 'org'
export type OrgRole = 'owner' | 'admin' | 'user'
export type MemberStatus = 'pending' | 'active' | 'suspended'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; email: string; avatar_url: string | null; display_name: string | null; plan: PlanTier; square_customer_id: string | null; square_subscription_id: string | null; plan_activated_at: string | null; item_limit: number; org_id: string | null; org_role: OrgRole | null; created_at: string; updated_at: string }
        Insert: { id: string; username: string; email: string; avatar_url?: string | null; display_name?: string | null; plan?: PlanTier; square_customer_id?: string | null; square_subscription_id?: string | null; plan_activated_at?: string | null; item_limit?: number; org_id?: string | null; org_role?: OrgRole | null; created_at?: string; updated_at?: string }
        Update: { id?: string; username?: string; email?: string; avatar_url?: string | null; display_name?: string | null; plan?: PlanTier; square_customer_id?: string | null; square_subscription_id?: string | null; plan_activated_at?: string | null; item_limit?: number; org_id?: string | null; org_role?: OrgRole | null; updated_at?: string }
        Relationships: []
      }
      organizations: {
        Row: { id: string; name: string; owner_id: string; join_code: string; seat_limit: number; square_customer_id: string | null; square_subscription_id: string | null; plan_activated_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; owner_id: string; join_code: string; seat_limit?: number; square_customer_id?: string | null; square_subscription_id?: string | null; plan_activated_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; owner_id?: string; join_code?: string; seat_limit?: number; square_customer_id?: string | null; square_subscription_id?: string | null; plan_activated_at?: string | null; updated_at?: string }
        Relationships: []
      }
      org_members: {
        Row: { id: string; org_id: string; user_id: string; role: OrgRole; status: MemberStatus; joined_at: string | null; created_at: string }
        Insert: { id?: string; org_id: string; user_id: string; role?: OrgRole; status?: MemberStatus; joined_at?: string | null; created_at?: string }
        Update: { id?: string; org_id?: string; user_id?: string; role?: OrgRole; status?: MemberStatus; joined_at?: string | null }
        Relationships: []
      }
      items: {
        Row: { id: string; owner_id: string; name: string; emoji: string; category: ItemCategory; total_quantity: number; description: string | null; image_url: string | null; serial_number: string | null; purchase_date: string | null; purchase_price: number | null; notes: string | null; is_archived: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; name: string; emoji?: string; category?: ItemCategory; total_quantity?: number; description?: string | null; image_url?: string | null; serial_number?: string | null; purchase_date?: string | null; purchase_price?: number | null; notes?: string | null; is_archived?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; owner_id?: string; name?: string; emoji?: string; category?: ItemCategory; total_quantity?: number; description?: string | null; image_url?: string | null; serial_number?: string | null; purchase_date?: string | null; purchase_price?: number | null; notes?: string | null; is_archived?: boolean; updated_at?: string }
        Relationships: []
      }
      borrowers: {
        Row: { id: string; owner_id: string; name: string; email: string | null; phone: string | null; avatar_emoji: string; notes: string | null; total_loans: number; created_at: string }
        Insert: { id?: string; owner_id: string; name: string; email?: string | null; phone?: string | null; avatar_emoji?: string; notes?: string | null; total_loans?: number; created_at?: string }
        Update: { id?: string; owner_id?: string; name?: string; email?: string | null; phone?: string | null; avatar_emoji?: string; notes?: string | null; total_loans?: number }
        Relationships: []
      }
      loans: {
        Row: { id: string; owner_id: string; item_id: string; borrower_id: string | null; borrower_name: string; quantity: number; status: LoanStatus; borrowed_at: string; due_at: string; returned_at: string | null; location_note: string | null; condition_out: string | null; condition_in: string | null; reminder_sent: boolean; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; item_id: string; borrower_id?: string | null; borrower_name: string; quantity?: number; status?: LoanStatus; borrowed_at?: string; due_at: string; returned_at?: string | null; location_note?: string | null; condition_out?: string | null; condition_in?: string | null; reminder_sent?: boolean; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; owner_id?: string; item_id?: string; borrower_id?: string | null; borrower_name?: string; quantity?: number; status?: LoanStatus; borrowed_at?: string; due_at?: string; returned_at?: string | null; location_note?: string | null; condition_out?: string | null; condition_in?: string | null; reminder_sent?: boolean; notes?: string | null; updated_at?: string }
        Relationships: []
      }
      loan_events: {
        Row: { id: string; loan_id: string; owner_id: string; event_type: string; metadata: Record<string, unknown>; created_at: string }
        Insert: { id?: string; loan_id: string; owner_id: string; event_type: string; metadata?: Record<string, unknown>; created_at?: string }
        Update: { id?: string; loan_id?: string; owner_id?: string; event_type?: string; metadata?: Record<string, unknown> }
        Relationships: []
      }
      reminders: {
        Row: { id: string; loan_id: string; owner_id: string; remind_at: string; sent: boolean; method: string; created_at: string }
        Insert: { id?: string; loan_id: string; owner_id: string; remind_at: string; sent?: boolean; method?: string; created_at?: string }
        Update: { id?: string; sent?: boolean; method?: string }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; loan_id: string | null; title: string; body: string; is_read: boolean; type: string; metadata: Record<string, unknown>; created_at: string }
        Insert: { id?: string; user_id: string; loan_id?: string | null; title: string; body: string; is_read?: boolean; type?: string; metadata?: Record<string, unknown>; created_at?: string }
        Update: { id?: string; loan_id?: string | null; title?: string; body?: string; is_read?: boolean; type?: string; metadata?: Record<string, unknown> }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: { loan_status: LoanStatus; item_category: ItemCategory; plan_tier: PlanTier; org_role: OrgRole; member_status: MemberStatus }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrgMember = Database['public']['Tables']['org_members']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type Borrower = Database['public']['Tables']['borrowers']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type LoanEvent = Database['public']['Tables']['loan_events']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type LoanWithItem = Loan & { items: Item }
export type LoanWithDetails = Loan & { items: Item; borrowers: Borrower | null }
export type OrgMemberWithProfile = OrgMember & { profiles: Profile }
