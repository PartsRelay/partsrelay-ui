import { vi } from 'vite-plus/test'

// Stands in for the Better Auth client in tests
export const authClient = {
  getSession: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  oneTap: vi.fn(),
  signIn: { social: vi.fn(), magicLink: vi.fn() },
  organization: {
    getFullOrganization: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    leave: vi.fn(),
    getInvitation: vi.fn(),
    listUserInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    inviteMember: vi.fn(),
    cancelInvitation: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
}
