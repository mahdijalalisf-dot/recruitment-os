import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export const config={api:{bodyParser:{sizeLimit:'8mb'}}}

export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
 try{
  const {fileName,mimeType,base64}=req.body||{}
  if(!fileName||!base64) return res.status(400).json({error:'Resume file is required'})
  const buffer=Buffer.from(base64,'base64')
  const lower=fileName.toLowerCase()
  let text=''
  if(lower.endsWith('.pdf')||mimeType==='application/pdf'){
   const out=await pdf(buffer);text=out.text||''
  }else if(lower.endsWith('.docx')||mimeType==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
   const out=await mammoth.extractRawText({buffer});text=out.value||''
  }else if(lower.endsWith('.txt')||mimeType==='text/plain'){
   text=buffer.toString('utf8')
  }else{
   return res.status(400).json({error:'فعلاً PDF، DOCX و TXT پشتیبانی می‌شود.'})
  }
  text=text.replace(/\u0000/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()
  if(!text) return res.status(422).json({error:'متن قابل خواندن از رزومه پیدا نشد.'})
  return res.status(200).json({text})
 }catch(e){return res.status(500).json({error:e.message||'Resume parsing failed'})}
}