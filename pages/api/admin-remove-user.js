const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co'
const KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg'

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'')
  const {orgId,userId}=req.body||{}
  if(!token) return res.status(401).json({error:'Authentication required'})
  if(!orgId||!userId) return res.status(400).json({error:'Company and user are required'})
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_remove_member`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({org:orgId,member_user:userId})
    })
    const data=await r.json().catch(()=>null)
    if(!r.ok) return res.status(r.status).json({error:data?.message||data?.hint||'Could not remove user'})
    return res.status(200).json({ok:true})
  }catch(e){return res.status(500).json({error:e.message||'Could not remove user'})}
}
