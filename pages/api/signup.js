const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co';
const KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({message:'Method not allowed'});
 try{
  const {email,password}=req.body||{};
  const r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+KEY},body:JSON.stringify({email,password,data:{full_name:(email||'').split('@')[0]}})});
  const data=await r.json();
  return res.status(r.status).json(data);
 }catch(e){return res.status(500).json({message:e.message||'Signup failed'})}
}