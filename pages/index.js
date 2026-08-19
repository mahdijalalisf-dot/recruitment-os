import Head from 'next/head'
import fs from 'fs'
import path from 'path'

export async function getStaticProps() {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] || html
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || ''
  let scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n')
  scripts = scripts.replace("const URL='https://wpjixgfnynrboptwpotd.supabase.co'", "const URL=window.location.origin+'/supabase'")
  scripts = scripts.replace(/async function login\(\)\{[\s\S]*?showApp\(\)\}/, `async function login(){
    loginMsg.textContent='در حال ورود...';
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const res=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email.value.trim(),password:password.value}),signal:controller.signal});
      clearTimeout(timer);
      const out=await res.json();
      if(!res.ok){loginMsg.textContent=out.error||'خطا در ورود';return}
      const {error}=await sb.auth.setSession({access_token:out.access_token,refresh_token:out.refresh_token});
      if(error){loginMsg.textContent=error.message;return}
      me=out.user;
      await ensureProfile();
      showApp();
    }catch(e){loginMsg.textContent=e.name==='AbortError'?'ارتباط با سرور زمان‌بر شد؛ دوباره تلاش کن.':'خطا در ارتباط با سرور';}
  }`)
  return { props: { body, style, scripts } }
}

export default function Home({ body, style, scripts }) {
  return <>
    <Head>
      <title>Recruitment OS</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    </Head>
    <style dangerouslySetInnerHTML={{__html: style}} />
    <div dangerouslySetInnerHTML={{__html: body.replace(/<script>[\s\S]*?<\/script>/gi, '')}} />
    <script dangerouslySetInnerHTML={{__html: scripts}} />
  </>
}