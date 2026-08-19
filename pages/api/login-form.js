const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co';
const KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).send('Method not allowed');
  try{
    const {email,password}=req.body||{};
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method:'POST',
      headers:{'content-type':'application/json','apikey':KEY,'authorization':`Bearer ${KEY}`},
      body:JSON.stringify({email,password})
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=encodeURIComponent(data?.msg||data?.message||data?.error_description||'Login failed');
      res.writeHead(302,{Location:`/?login_error=${msg}`});
      return res.end();
    }
    const payload=Buffer.from(JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token,user:data.user}),'utf8').toString('base64url');
    res.setHeader('Set-Cookie',[`ros_session=${payload}; Path=/; Max-Age=3600; SameSite=Lax; Secure`]);
    res.writeHead(302,{Location:'/?logged_in=1'});
    return res.end();
  }catch(e){
    res.writeHead(302,{Location:'/?login_error='+encodeURIComponent('Server login error')});
    return res.end();
  }
}