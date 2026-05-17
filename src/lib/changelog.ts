export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const CURRENT_VERSION = '1.2.3'

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.3',
    date: '2026-05-17 16:02 CEST',
    changes: [
      'Quick Lend now suggests contacts as you type — tap one to fill instantly',
      'Add a new name to your contacts right from Quick Lend with one tap',
    ],
  },
  {
    version: '1.2.2',
    date: '2026-05-17 15:52 CEST',
    changes: [
      'Returning, extending, and marking a loan as lost now correctly enforces ownership',
      'Organization setup now correctly fails if the owner could not be added as a member',
    ],
  },
  {
    version: '1.2.1',
    date: '2026-05-14 11:22 CEST',
    changes: [
      'Photos now save to items when added through Quick Lend (Pro)',
      'Save a borrower to contacts directly from Quick Lend (Pro)',
      'Borrower loan count now updates correctly when a loan is created',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-14 17:30 UTC',
    changes: [
      'Quick Lend — lend anything in seconds from the sidebar or the mobile button',
      'Take an optional photo when quick lending to remember what it looks like',
      'Terms of Service and Privacy Policy must be accepted when signing up',
      'Scan a QR code to borrow an item instantly — no login needed (Pro)',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-10 12:00 UTC',
    changes: [
      'Add photos to your items (Pro)',
      'Email confirmation and password reset now fully working',
      'Terms of Service and Privacy Policy pages added',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-03 10:00 UTC',
    changes: [
      'Initial release — item library, active loans, and loan history',
      'Free and Pro plans',
      'Org plan with team support',
    ],
  },
]
