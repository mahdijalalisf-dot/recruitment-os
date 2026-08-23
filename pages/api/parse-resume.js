import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export const config={api:{bodyParser:{sizeLimit:'8mb'}}}

function cleanText(text=''){
 return text.replace(/\u0000/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()
}

function extractContact(text=''){
 const normalized=text.replace(/[\u200c\u200f\u202a-\u202e]/g,' ')
 const email=(normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||''
 const phones=normalized.match(/(?:\+?98|0098|0)?[\s\-()]?9\d{2}[\s\-()]?\d{3}[\s\-()]?\d{4}/g)||[]
 let phone=(phones[0]||'').replace(/[^\d+]/g,'')
 if(phone.startsWith('0098')) phone='+98'+phone.slice(4)
 else if(phone.startsWith('98')&&!phone.startsWith('+')) phone='+'+phone
 else if(/^9\d{9}$/.test(phone)) phone='0'+phone
 return {email,phone}
}

async function extractPdfWithPdfJs(buffer){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
 const doc=await pdfjs.getDocument({data:new Uint8Array(buffer),disableWorker:true}).promise
 const pages=[]
 for(let i=1;i<=doc.numPages;i++){
  const page=await doc.getPage(i)
  const content=await page.getTextContent()
  pages.push(content.items.map(item=>item.str||'').join(' '))
 }
 return pages.join('\n')
}

export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
 try{
  const {fileName,mimeType,base64}=req.body||{}
  if(!fileName||!base64) return res.status(400).json({error:'Resume file is required'})
  const buffer=Buffer.from(base64,'base64')
  const lower=fileName.toLowerCase()
  let text=''
  if(lower.endsWith('.pdf')||mimeType==='application/pdf'){
   try{const out=await pdf(buffer);text=out.text||''}catch{}
   text=cleanText(text)
   if(text.length<40){
    try{text=cleanText(await extractPdfWithPdfJs(buffer))}catch{}
   }
  }else if(lower.endsWith('.docx')||mimeType==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
   const out=await mammoth.extractRawText({buffer});text=cleanText(out.value||'')
  }else if(lower.endsWith('.txt')||mimeType==='text/plain'){
   text=cleanText(buffer.toString('utf8'))
  }else{
   return res.status(400).json({error:'فعلاً PDF، DOCX و TXT پشتیبانی می‌شود.'})
  }
  text=cleanText(text)
  if(!text||text.length<20) return res.status(422).json({error:'این PDF احتمالاً اسکن/تصویری است یا متن آن قابل استخراج نیست. لطفاً نسخه PDF متنی یا DOCX همین رزومه را آپلود کن.'})
  return res.status(200).json({text,contact:extractContact(text)})
 }catch(e){return res.status(500).json({error:e.message||'Resume parsing failed'})}
}