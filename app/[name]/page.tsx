import { publicProfileMetadata, publicProfilePage } from '../lib/public-profile-page';
type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ params }: Props) {
  return publicProfileMetadata(await params);
}
export default async function Page({ params, searchParams }: Props) {
  return publicProfilePage(await params, (await searchParams).lang);
}
