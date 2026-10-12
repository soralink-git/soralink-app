import App from './ui';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <App workspaceMode={params.app!==undefined}/>;}
