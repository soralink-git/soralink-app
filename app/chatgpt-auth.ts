export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  return null;
}
export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  throw new Error('Connectez-vous avec votre adresse e-mail.');
}
export function chatGPTSignInPath(_returnTo: string) {
  return '/auth?mode=login';
}
export function chatGPTSignOutPath(_returnTo = '/') {
  return '/';
}
