import { api } from '@open-polityra/api-client'

export const canUpdateProfile = () => typeof api.users.updateMe === 'function'
export const canChangePassword = () => typeof api.users.changePassword === 'function'
export const updateProfile = (name: string) => api.users.updateMe({ name })
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.users.changePassword({ currentPassword, newPassword })
