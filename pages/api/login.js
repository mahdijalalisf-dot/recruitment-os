const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co'
const SUPABASE_KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg'

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  try{
    const {email,password}=req.body||{}
    if(!email||!password) return res.status(400).json({error:'Email and password are required'})
    const controller=new AbortController()
    const timer=setTimeout(()=>controller.abort(),10000)
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method:'POST',
      headers:{'content-type':'application/json','apikey':SUPABASE_KEY,'authorization':`Bearer ${SUPABASE_KEY}`},
      body:JSON.stringify({email,password}),
      signal:controller.signal,
    })
    clearTimeout(timer)
    const data=await r.json().catch(()=>({}))
    if(!r.ok) return res.status(r.status).json({error:data?.msg||data?.message||data?.error_description||'Login failed'})
    return res.status(200).json({access_token:data.access_token,refresh_token:data.refresh_token,user:data.user})
  }catch(e){
    return res.status(500).json({error:e.name==='AbortError'?'Auth server timeout':'Authentication error'})
  }
}
