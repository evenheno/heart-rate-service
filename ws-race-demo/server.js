import http from 'http';
import crypto from 'crypto';
import { readFile } from 'fs/promises';

const PORT = Number(process.env.PORT || 10000);
const sockets = new Set();
const players = new Map();
let target = randomTarget();
let winner = null;

function randomTarget(){ return {x:60+Math.random()*780,y:60+Math.random()*400}; }
function spawn(slot){ return slot===1?{x:120,y:260}:slot===2?{x:780,y:260}:randomTarget(); }
function assignSlot(){ const used=new Set([...players.values()].map(p=>p.slot)); return !used.has(1)?1:!used.has(2)?2:0; }
function state(){ return {type:'state',target,winner,players:[...players.values()].map(p=>({id:p.id,slot:p.slot,x:p.x,y:p.y,score:p.score}))}; }

function makeFrame(text, opcode=1){
  const payload = Buffer.from(text);
  if(payload.length < 126) return Buffer.concat([Buffer.from([0x80|opcode,payload.length]),payload]);
  if(payload.length < 65536){
    const h=Buffer.alloc(4); h[0]=0x80|opcode; h[1]=126; h.writeUInt16BE(payload.length,2);
    return Buffer.concat([h,payload]);
  }
  const h=Buffer.alloc(10); h[0]=0x80|opcode; h[1]=127; h.writeBigUInt64BE(BigInt(payload.length),2);
  return Buffer.concat([h,payload]);
}
function send(socket,obj){ if(!socket.destroyed) socket.write(makeFrame(JSON.stringify(obj))); }
function broadcast(obj){ const f=makeFrame(JSON.stringify(obj)); for(const s of sockets) if(!s.destroyed) s.write(f); }
function reset(){
  target=randomTarget(); winner=null;
  for(const p of players.values()){ p.score=0; Object.assign(p,spawn(p.slot)); }
  broadcast({type:'round-reset'}); broadcast(state());
}
function parseFrames(socket,chunk,onMessage){
  socket._buf=Buffer.concat([socket._buf||Buffer.alloc(0),chunk]);
  let b=socket._buf;
  while(b.length>=2){
    const opcode=b[0]&15, masked=!!(b[1]&128);
    let len=b[1]&127, offset=2;
    if(len===126){ if(b.length<4) break; len=b.readUInt16BE(2); offset=4; }
    else if(len===127){ if(b.length<10) break; len=Number(b.readBigUInt64BE(2)); offset=10; }
    let mask;
    if(masked){ if(b.length<offset+4) break; mask=b.subarray(offset,offset+4); offset+=4; }
    if(b.length<offset+len) break;
    const payload=Buffer.from(b.subarray(offset,offset+len));
    if(masked) for(let i=0;i<payload.length;i++) payload[i]^=mask[i%4];
    b=b.subarray(offset+len);
    if(opcode===8){ socket.end(makeFrame('',8)); break; }
    if(opcode===9){ socket.write(makeFrame(payload.toString(),10)); continue; }
    if(opcode===1) onMessage(payload.toString('utf8'));
  }
  socket._buf=b;
}

const server=http.createServer(async (req,res)=>{
  if(req.url==='/health'){
    res.writeHead(200,{'content-type':'application/json'});
    return res.end(JSON.stringify({ok:true,players:players.size}));
  }
  if(req.url!=='/'){ res.writeHead(404); return res.end('Not Found'); }
  const html=await readFile(new URL('./index.html',import.meta.url));
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
  res.end(html);
});

server.on('upgrade',(req,socket)=>{
  if(req.url!=='/ws'||req.headers.upgrade?.toLowerCase()!=='websocket') return socket.destroy();
  const key=req.headers['sec-websocket-key']; if(!key) return socket.destroy();
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const id=crypto.randomUUID(), slot=assignSlot(), player={id,slot,...spawn(slot),score:0};
  players.set(id,player); sockets.add(socket); send(socket,{type:'welcome',id,slot}); broadcast(state());
  const cleanup=()=>{ if(!sockets.has(socket)) return; sockets.delete(socket); players.delete(id); broadcast(state()); };
  socket.on('close',cleanup); socket.on('error',cleanup);
  socket.on('data',chunk=>parseFrames(socket,chunk,raw=>{
    let msg; try{ msg=JSON.parse(raw); }catch{return;}
    const p=players.get(id); if(!p) return;
    if(msg.type==='reset'){ reset(); return; }
    if(msg.type==='move'&&!winner&&p.slot){
      const dx=Math.max(-1,Math.min(1,Number(msg.dx)||0)), dy=Math.max(-1,Math.min(1,Number(msg.dy)||0));
      p.x=Math.max(22,Math.min(878,p.x+dx*14)); p.y=Math.max(22,Math.min(498,p.y+dy*14));
      if(Math.hypot(p.x-target.x,p.y-target.y)<38){
        p.score++; target=randomTarget();
        if(p.score>=5){ winner=p.slot; broadcast({type:'winner',slot:p.slot}); }
      }
      broadcast(state());
    }
  }));
});

server.listen(PORT,'0.0.0.0',()=>console.log('WebSocket Race listening on '+PORT));
