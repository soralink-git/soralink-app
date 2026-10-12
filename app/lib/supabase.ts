import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';
export async function authClient(){if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)throw new Error('Connexion par e-mail temporairement indisponible');const jar=await cookies();return createServerClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{cookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'},cookies:{getAll(){return jar.getAll()},setAll(list){for(const {name,value,options} of list)jar.set(name,value,options)}}});}
