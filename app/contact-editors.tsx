'use client';
import NetworkLinksEditor from './network-links-editor';
import type { DashboardContext } from './dashboard-editor';
export function ContactActionsEditor({ context }: { context: DashboardContext }) {
  return <NetworkLinksEditor context={context} mode="direct" />;
}
export { default as SocialLinksEditor } from './network-links-editor';
