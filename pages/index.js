import Head from 'next/head'
import fs from 'fs'
import path from 'path'

export async function getStaticProps() {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] || html
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || ''
  let scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n')
  scripts = scripts.replace("const URL='https://wpjixgfnynrboptwpotd.supabase.co',KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg';\nconst sb=supabase.createClient(URL,KEY);let me=null,profile=null,currentJob=null;", "const URL=window.location.origin+'/supabase',KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg';\nlet sb=supabase.createClient(URL,KEY);let me=null,profile=null,currentJob=null;")
  scripts = scripts.replace(/async function boot\(\)\{[\s\S]*?else showLogin\(\)\}/, `async function boot(){
    as.innerHTML=stages.map(x=>\`<option value="\${x[0]}">\${x[1]}</option>\`).join('');
    const saved=localStorage.getItem('recruitment_os_session');
    if(saved){
      try{
        const s=JSON.parse(saved);
        me=s.user;
        sb=supabase.createClient(URL,KEY,{global:{headers:{Authorization:'Bearer '+s.access_token}}});
        await ensureProfile();
        showApp();
        return;
      }catch(e){localStorage.removeItem('recruitment_os_session')}
    }
    showLogin();
  }`)
  scripts = scripts.replace(/async function login\(\)\{[\s\S]*?\n  \}/, `async function login(){
    loginMsg.textContent='در حال ورود...';
    const xhr=new XMLHttpRequest();
    xhr.open('POST','/api/login',true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.timeout=12000;
    xhr.onload=async function(){
      try{
        const out=JSON.parse(xhr.responseText||'{}');
        if(xhr.status<200||xhr.status>=300){loginMsg.textContent=out.error||out.message||'خطا در ورود';return}
        me=out.user;
        localStorage.setItem('recruitment_os_session',JSON.stringify({access_token:out.access_token,refresh_token:out.refresh_token,user:out.user}));
        sb=supabase.createClient(URL,KEY,{global:{headers:{Authorization:'Bearer '+out.access_token}}});
        await ensureProfile();
        showApp();
      }catch(e){loginMsg.textContent='خطا در پردازش پاسخ سرور';}
    };
    xhr.onerror=function(){loginMsg.textContent='خطا در ارتباط با سرور';};
    xhr.ontimeout=function(){loginMsg.textContent='ارتباط با سرور زمان‌بر شد؛ دوباره تلاش کن.';};
    xhr.send(JSON.stringify({email:email.value.trim(),password:password.value}));
  }`)
  scripts = scripts.replace(/async function signup\(\)\{[\s\S]*?\n  \}/, `async function signup(){
    loginMsg.textContent='در حال ساخت حساب...';
    try{
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
      const res=await fetch('/api/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email.value.trim().toLowerCase(),password:password.value}),signal:controller.signal}); clearTimeout(timer);
      const out=await res.json();
      if(!res.ok){loginMsg.textContent=out.msg||out.error_description||out.message||'خطا در ساخت حساب';return}
      if(out.access_token&&out.user){
        me=out.user;
        localStorage.setItem('recruitment_os_session',JSON.stringify({access_token:out.access_token,refresh_token:out.refresh_token,user:out.user}));
        sb=supabase.createClient(URL,KEY,{global:{headers:{Authorization:'Bearer '+out.access_token}}});
        await ensureProfile(); showApp(); return;
      }
      loginMsg.textContent='حساب ساخته شد. ایمیل تأیید را بررسی کن و سپس Login بزن.';
    }catch(e){loginMsg.textContent=e.name==='AbortError'?'ارتباط با سرور زمان‌بر شد؛ دوباره تلاش کن.':'خطا در ساخت حساب';}
  }`)
  scripts = scripts.replace("async function logout(){await sb.auth.signOut();location.reload()}", "async function logout(){localStorage.removeItem('recruitment_os_session');location.reload()}")
  return { props: { body, style, scripts } }
}

export default function Home({ body, style, scripts }) {
  return <>
    <Head><title>Recruitment OS</title><meta name="viewport" content="width=device-width,initial-scale=1" /><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script></Head>
    <style dangerouslySetInnerHTML={{__html: style}} />
    <div dangerouslySetInnerHTML={{__html: body.replace(/<script>[\s\S]*?<\/script>/gi, '')}} />
    <script dangerouslySetInnerHTML={{__html: scripts}} />
  </>
}