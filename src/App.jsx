import React from "react";
import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react"
import { supabase } from './supabaseClient';

const ADMIN_NAME = "윤자영";

const INIT_QUESTS = [
  { id: 1, label: "수학 30분 학습", baseXp: 20, suggestedMin: 30 },
  { id: 2, label: "영어 단어 20개", baseXp: 15, suggestedMin: 20 },
  { id: 3, label: "줄넘기 1회",    baseXp: 10, suggestedMin: 5  },
];

const ALL_BADGES = [
  { id:"xp_first", emoji:"⚡", label:"첫 XP",      req:s=>s.xp>0 },
  { id:"xp100",    emoji:"🌟", label:"100 XP",     req:s=>s.xp>=100 },
  { id:"xp300",    emoji:"🥈", label:"Silver 달성", req:s=>s.xp>=300 },
  { id:"xp700",    emoji:"🥇", label:"Gold 달성",   req:s=>s.xp>=700 },
{ id:"xp1200",   emoji:"🎖️", label:"Premium",    req:s=>s.xp>=1200 },
  { id:"xp2000",   emoji:"💚", label:"Emerald 달성", req:s=>s.xp>=2000 },
  { id:"xp3200",   emoji:"💎", label:"Diamond 달성", req:s=>s.xp>=3200 },
  { id:"xp5000",   emoji:"⭐", label:"Master 달성",  req:s=>s.xp>=5000 },
  { id:"xp8000",   emoji:"👑", label:"Challenger 달성", req:s=>s.xp>=8000 },
  { id:"streak3",  emoji:"🔥", label:"3일 연속",    req:s=>s.streak>=3 },
  { id:"streak7",  emoji:"💫", label:"7일 연속",    req:s=>s.streak>=7 },
  { id:"streak30", emoji:"👑", label:"30일 연속",   req:s=>s.streak>=30 },
  { id:"q1",       emoji:"📝", label:"첫 퀘스트",   req:s=>s.questsDone>=1 },
  { id:"q5",       emoji:"📚", label:"퀘스트 5개",  req:s=>s.questsDone>=5 },
  { id:"q20",      emoji:"🎓", label:"퀘스트 20개", req:s=>s.questsDone>=20 },
  { id:"st30m",    emoji:"⏱️", label:"30분 학습",   req:s=>s.studySecs>=1800 },
  { id:"st3h",     emoji:"🏅", label:"3시간 학습",  req:s=>s.studySecs>=10800 },
  { id:"note1",    emoji:"📓", label:"첫 노트",     req:s=>s.entries>=1 },
  { id:"note20",   emoji:"📖", label:"노트 20개",   req:s=>s.entries>=20 },
  { id:"lv2",      emoji:"🎯", label:"Lv.2 달성",  req:s=>s.level>=2 },
  { id:"lv5",      emoji:"🌈", label:"Lv.5 달성",  req:s=>s.level>=5 },
{ id:"lv7",      emoji:"🏆", label:"Lv.7 달성",   req:s=>s.level>=7 },
  { id:"lv15",     emoji:"🌟", label:"최고 레벨",   req:s=>s.level>=15 },
];

const LEVELS=[
  {level:1,minXP:0,   maxXP:100},
  {level:2,minXP:100, maxXP:300},
  {level:3,minXP:300, maxXP:600},
  {level:4,minXP:600, maxXP:700},
  {level:5,minXP:700, maxXP:1000},
  {level:6,minXP:1000,maxXP:1200},
  {level:7,minXP:1200,maxXP:1600},
  {level:8,minXP:1600,maxXP:2000},
  {level:9,minXP:2000,maxXP:2600},
  {level:10,minXP:2600,maxXP:3200},
  {level:11,minXP:3200,maxXP:4000},
  {level:12,minXP:4000,maxXP:5000},
  {level:13,minXP:5000,maxXP:6500},
  {level:14,minXP:6500,maxXP:8000},
  {level:15,minXP:8000,maxXP:9500},
];
const RANKS=[
  {name:"Bronze", minXP:0,   icon:"🥉",color:"#d97706",bg:"#fef3c7",border:"#fcd34d"},
  {name:"Silver", minXP:300, icon:"🥈",color:"#475569",bg:"#f1f5f9",border:"#94a3b8"},
  {name:"Gold",   minXP:700, icon:"🥇",color:"#b45309",bg:"#fffbeb",border:"#fde68a"},
  {name:"Premium",minXP:1200,icon:"🎖️",color:"#a05070",bg:"#f5f4f2",border:"#b0aba3"},
  {name:"Emerald",minXP:2000,icon:"💚",color:"#059669",bg:"#d1fae5",border:"#6ee7b7"},
  {name:"Diamond",minXP:3200,icon:"💎",color:"#0891b2",bg:"#cffafe",border:"#67e8f9"},
  {name:"Master", minXP:5000,icon:"⭐",color:"#7c3aed",bg:"#ede9fe",border:"#c4b5fd"},
  {name:"Challenger",minXP:8000,icon:"👑",color:"#b91c1c",bg:"#fff1f1",border:"#fca5a5"},
];

const getLvl=function(xp){for(let i=LEVELS.length-1;i>=0;i--)if(xp>=LEVELS[i].minXP)return LEVELS[i];return LEVELS[0];};
const getRank=function(xp){for(let i=RANKS.length-1;i>=0;i--)if(xp>=RANKS[i].minXP)return RANKS[i];return RANKS[0];};
const fmt=function(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
const fmtMin=function(m){
  if(m<60)return m+"분";
  const h=Math.floor(m/60);
  const rem=m%60;
  return rem===0?h+"시간":h+"시간 "+rem+"분";
};
const loadLS=function(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}};
const calcStreak=function(dates){
  if(!dates||dates.length===0)return 0;
  const set=new Set(dates);
  const fmtD=function(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  let cur=new Date();
  if(!set.has(fmtD(cur))){
    cur.setDate(cur.getDate()-1);
    if(!set.has(fmtD(cur)))return 0;
  }
  let streak=0;
  while(set.has(fmtD(cur))){
    streak++;
    cur.setDate(cur.getDate()-1);
  }
  return streak;
};

// Default theme (pink) - dark/light only
// ── Color utilities for widget tone system ──
const hexToRgb=function(hex){
  let h=(hex||"#a05070").replace("#","");
  if(h.length===3)h=h.split("").map(function(c){return c+c;}).join("");
  const n=parseInt(h,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
};
const mixColor=function(hex,target,ratio){
  const a=hexToRgb(hex),b=hexToRgb(target);
  const r=Math.round(a.r+(b.r-a.r)*ratio);
  const g=Math.round(a.g+(b.g-a.g)*ratio);
  const bl=Math.round(a.b+(b.b-a.b)*ratio);
  return "rgb("+r+","+g+","+bl+")";
};
const getToneStyle=function(color,tone){
  const c=color||"#a05070";
  if(tone==="light")return {bg:mixColor(c,"#ffffff",0.90),border:mixColor(c,"#ffffff",0.68),text:"#334155",accent:c,solid:false};
  if(tone==="dark")return {bg:mixColor(c,"#000000",0.18),border:mixColor(c,"#000000",0.34),text:"#ffffff",accent:"#ffffff",solid:true};
  return {bg:mixColor(c,"#ffffff",0.76),border:mixColor(c,"#ffffff",0.44),text:"#334155",accent:c,solid:false};
};
const getCardStyle=function(color,tone){
  const c=color||"#a05070";
  if(tone==="light")return {bg:mixColor(c,"#ffffff",0.94),border:mixColor(c,"#ffffff",0.80),text:"#1e293b",sub:"#64748b"};
  if(tone==="dark")return {bg:mixColor(c,"#000000",0.12),border:mixColor(c,"#000000",0.28),text:"#ffffff",sub:"rgba(255,255,255,0.7)"};
  return {bg:mixColor(c,"#ffffff",0.86),border:mixColor(c,"#ffffff",0.58),text:"#1e293b",sub:"#64748b"};
};

const getTheme=function(id,dark,primaryColor){
  const p=primaryColor||"#a05070";
  const pl=p+"18";
  const pb=p+"44";
  if(dark) return {p:p,pl:"#1e1e2e",pc:"#16213e",pb:"#2d2d4e",pt:"#e2e8f0",bg:"#0f0f1a",nav:"rgba(15,15,26,0.95)",text:"#e2e8f0",sub:"#94a3b8",card:"#1e1e2e",border:"#2d2d4e"};
  return {p:p,pl:pl,pc:"#ffffff",pb:pb,pt:"#1a1a2e",bg:"#f4f6fb",nav:"rgba(255,255,255,0.95)",text:"#3a1a28",sub:"#64748b",card:"white",border:"#f0d0e0"};
};

// ── Draggable Streak Calendar Window ──
function StreakCalendarWindow({studyDates,onClose}){
  const [pos,setPos]=useState({x:20,y:68});
  const [dragging,setDragging]=useState(false);
  const dragStart=useRef(null);

  const onMouseDown=function(e){
    if(e.target.closest('button')||e.target.closest('.cal-body'))return;
    setDragging(true);
    dragStart.current={mx:e.clientX,my:e.clientY,ox:pos.x,oy:pos.y};
    e.preventDefault();
  };
  const onMouseMove=function(e){
    if(!dragging||!dragStart.current)return;
    const dx=e.clientX-dragStart.current.mx;
    const dy=e.clientY-dragStart.current.my;
    const nx=Math.max(0,Math.min(window.innerWidth-310,dragStart.current.ox+dx));
    const ny=Math.max(0,Math.min(window.innerHeight-400,dragStart.current.oy+dy));
    setPos({x:nx,y:ny});
  };
  const onMouseUp=function(){setDragging(false);};

  useEffect(function(){
    if(dragging){
      window.addEventListener('mousemove',onMouseMove);
      window.addEventListener('mouseup',onMouseUp);
    }
    return function(){
      window.removeEventListener('mousemove',onMouseMove);
      window.removeEventListener('mouseup',onMouseUp);
    };
  },[dragging,pos]);

  return(
    <div
      style={{position:"fixed",left:pos.x,top:pos.y,background:"white",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.2)",border:"1px solid #f0d0e0",width:300,zIndex:500,userSelect:"none"}}
      onMouseDown={onMouseDown}
    >
      {/* Drag handle bar */}
      <div style={{padding:"10px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:dragging?"grabbing":"grab",borderBottom:"1px solid #fce7f3",borderRadius:"16px 16px 0 0",background:"#fdf5f8"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{display:"flex",gap:3}}>{[0,1,2,3,4,5].map(function(i){return <div key={i} style={{width:3,height:3,borderRadius:"50%",background:"#d4a0b8"}}/>;})}</div>
          <span style={{fontSize:12,fontWeight:600,color:"#a05070"}}>🔥 학습 기록</span>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#c0a0b0",lineHeight:1,padding:"0 2px"}}>✕</button>
      </div>
      <div className="cal-body" style={{padding:"12px 16px 16px"}}>
        <StreakCalendar studyDates={studyDates}/>
      </div>
    </div>
  );
}

// ── Streak Calendar ──
function StreakCalendar({studyDates}){
  const today=new Date();
  const [cur,setCur]=useState({year:today.getFullYear(),month:today.getMonth()});
  const year=cur.year, month=cur.month;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();
  const prevMonthDays=new Date(year,month,0).getDate();
  const DAY_KR=["일","월","화","수","목","금","토"];
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevMonthDays-i,current:false});
  for(let d=1;d<=daysInMonth;d++)cells.push({day:d,current:true});
  while(cells.length<35)cells.push({day:cells.length-daysInMonth-firstDay+1,current:false});

  const isStudied=function(d){
    const mm=String(month+1).padStart(2,"0");
    const dd=String(d).padStart(2,"0");
    return (studyDates||[]).includes(year+"-"+mm+"-"+dd);
  };
  const isToday=function(d){return d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();};

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={function(){setCur(function(c){return c.month===0?{year:c.year-1,month:11}:{year:c.year,month:c.month-1};});}} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:12,color:"#64748b",lineHeight:1}}>‹</button>
          <span style={{fontSize:12,fontWeight:600,color:"#334155",minWidth:60,textAlign:"center"}}>{year}년 {month+1}월</span>
          <button onClick={function(){setCur(function(c){return c.month===11?{year:c.year+1,month:0}:{year:c.year,month:c.month+1};});}} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:12,color:"#64748b",lineHeight:1}}>›</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {DAY_KR.map(function(d,i){return <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:i===0?"#ef4444":i===6?"#3b82f6":"#94a3b8",padding:"2px 0"}}>{d}</div>;})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map(function(cell,idx){
          const studied=cell.current&&isStudied(cell.day);
          const today2=cell.current&&isToday(cell.day);
          const col=idx%7;
          return(
            <div key={idx} style={{display:"flex",alignItems:"center",justifyContent:"center",height:32,position:"relative"}}>
              <div style={{
                width:28,height:28,borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center",
                background:today2?"#a05070":studied?"#fce7f3":"transparent",
                border:studied&&!today2?"2px solid #a05070":"2px solid transparent",
                position:"relative",
              }}>
                <span style={{
                  fontSize:11,fontWeight:today2||studied?700:400,
                  color:today2?"white":studied?"#a05070":!cell.current?"#d1d5db":col===0?"#ef4444":col===6?"#3b82f6":"#334155",
                }}>{cell.day}</span>
                {studied&&!today2&&(
                  <div style={{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",fontSize:7}}>✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #f1f5f9",display:"flex",gap:14,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:"#a05070"}}/>
          <span style={{fontSize:10,color:"#64748b"}}>오늘</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:"#fce7f3",border:"2px solid #a05070"}}/>
          <span style={{fontSize:10,color:"#64748b"}}>학습 완료</span>
        </div>
        <div style={{marginLeft:"auto",fontSize:11,color:"#a05070",fontWeight:600}}>
          이번 달 {(studyDates||[]).filter(function(d){return d.startsWith(year+"-"+String(month+1).padStart(2,"0"));}).length}일 학습
        </div>
      </div>
    </div>
  );
}

// ── Settings Modal ──
function SettingsModal({darkMode,onDark,onClose}){
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:darkMode?"#1e1e2e":"white",borderRadius:20,padding:"28px 32px",width:340,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <span style={{fontSize:17,fontWeight:800,color:darkMode?"#e2e8f0":"#1e293b"}}>⚙️ 설정</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#94a3b8"}}>✕</button>
        </div>
        <div style={{background:darkMode?"#16213e":"#f8fafc",borderRadius:14,padding:"18px 20px",border:"1px solid "+(darkMode?"#2d2d4e":"#e2e8f0"),display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:darkMode?"#e2e8f0":"#1e293b"}}>{darkMode?"🌙 다크 모드":"☀️ 라이트 모드"}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>{darkMode?"어두운 테마 사용 중":"밝은 테마 사용 중"}</div>
          </div>
          <button onClick={function(){onDark(!darkMode);}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
            <div style={{width:56,height:30,borderRadius:15,background:darkMode?"#6366f1":"#e2e8f0",position:"relative",transition:"background 0.3s"}}>
              <div style={{position:"absolute",top:3,left:darkMode?28:3,width:24,height:24,borderRadius:"50%",background:darkMode?"white":"#94a3b8",boxShadow:"0 2px 6px rgba(0,0,0,0.2)",transition:"left 0.3s"}}/>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Editor ──
function EntryEditor({entry,onUpdate,onDelete}){
  const ref=useRef(null);
  const [collapsed,setCollapsed]=useState(false);
  const [isEmpty,setIsEmpty]=useState(!entry.content);
  const [entryTitle,setEntryTitle]=useState(entry.entryTitle||"");
  const COLORS=["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a05070","#ec4899","#1e293b"];
  useEffect(function(){if(ref.current&&entry.content){ref.current.innerHTML=entry.content;setIsEmpty(false);}},[]);
  const exec=function(cmd,v){if(ref.current)ref.current.focus();document.execCommand(cmd,false,v||null);};
  const handleInput=function(e){const html=e.currentTarget.innerHTML;const text=e.currentTarget.innerText.trim();setIsEmpty(text==="");onUpdate({content:html,title:text.slice(0,40)});};
  return(
    <div style={{background:"white",borderRadius:14,border:"1px solid #f1f5f9",marginBottom:12,boxShadow:"0 2px 8px rgba(99,102,241,0.06)",position:"relative"}}>
      <div style={{position:"absolute",top:8,right:10,display:"flex",gap:5,zIndex:2}}>
        <button onClick={()=>setCollapsed(function(c){return !c;})} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"3px 9px",cursor:"pointer",fontSize:11,color:"#64748b",fontFamily:"inherit",whiteSpace:"nowrap"}}>{collapsed?"∨ 펼치기":"∧ 접기"}</button>
        <button onClick={onDelete} style={{background:"#fff0f0",border:"1px solid #fecaca",borderRadius:7,padding:"4px 8px",cursor:"pointer",color:"#ef4444",fontFamily:"inherit",fontSize:13}}>🗑</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",paddingRight:130,borderBottom:collapsed?"none":"1px solid #f1f5f9"}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#eeece8,#fae8ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#a05070",border:"2px solid #d4d0ca",flexShrink:0}}>{entry.num}</div>
        {collapsed?<span style={{fontSize:13,color:"#334155",fontWeight:500}}>{entryTitle||entry.title||"제목 없음"}</span>:<input value={entryTitle} onChange={function(e){setEntryTitle(e.target.value);onUpdate({entryTitle:e.target.value});}} placeholder="제목을 입력하세요..." style={{flex:1,border:"none",outline:"none",fontSize:13,fontWeight:600,color:"#334155",background:"transparent",fontFamily:"inherit",padding:"2px 0"}}/>}
      </div>
      {!collapsed&&(
        <div style={{padding:"10px 14px 14px"}}>
          <div style={{display:"flex",gap:3,marginBottom:8,padding:6,background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",flexWrap:"wrap",alignItems:"center"}}>
            {[["B","bold"],["I","italic"],["U","underline"],["S","strikeThrough"]].map(function(item){return <button key={item[1]} onMouseDown={function(e){e.preventDefault();exec(item[1]);}} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:12,minWidth:26,fontFamily:"inherit"}}>{item[0]}</button>;})}
            <div style={{width:1,height:18,background:"#e2e8f0",margin:"0 2px"}}/>
            {COLORS.map(function(col){return <button key={col} onMouseDown={function(e){e.preventDefault();exec("foreColor",col);}} style={{width:18,height:18,borderRadius:"50%",background:col,border:"2px solid white",cursor:"pointer",boxShadow:"0 0 0 1px #e2e8f0",flexShrink:0}}/>;}) }
            <div style={{width:1,height:18,background:"#e2e8f0",margin:"0 2px"}}/>
            {[["H1","formatBlock","h3"],["H2","formatBlock","h4"],["•","insertUnorderedList",null],["1.","insertOrderedList",null]].map(function(item){return <button key={item[0]} onMouseDown={function(e){e.preventDefault();exec(item[1],item[2]);}} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 7px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{item[0]}</button>;})}
          </div>
          <div style={{position:"relative"}}>
            {isEmpty&&<div style={{position:"absolute",top:10,left:10,fontSize:14,color:"#cbd5e1",pointerEvents:"none",userSelect:"none"}}>여기에 공부 내용을 작성해보세요! ✨</div>}
            <div ref={ref} contentEditable suppressContentEditableWarning onInput={handleInput} onFocus={function(){setIsEmpty(false);}} onBlur={function(e){const text=e.currentTarget.innerText.trim();setIsEmpty(text==="");onUpdate({content:e.currentTarget.innerHTML,title:text.slice(0,40)});}} style={{minHeight:90,outline:"none",fontSize:14,lineHeight:1.8,color:"#334155",padding:10,border:"1px solid #e2e8f0",borderRadius:10,fontFamily:"inherit"}}/>
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterNameInput({name,onRename}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(name);
  if(editing){return <input autoFocus value={val} onChange={function(e){setVal(e.target.value);}} onBlur={function(){onRename(val.trim()||name);setEditing(false);}} onKeyDown={function(e){if(e.key==="Enter"){onRename(val.trim()||name);setEditing(false);}if(e.key==="Escape")setEditing(false);}} onClick={function(e){e.stopPropagation();}} style={{flex:1,border:"none",borderBottom:"1.5px solid #a05070",outline:"none",fontSize:13,fontWeight:600,color:"#7a2848",background:"transparent",fontFamily:"inherit",minWidth:0,padding:"1px 0"}}/>;}
  return <span onClick={function(e){e.stopPropagation();setEditing(true);}} title="클릭하여 이름 수정" style={{fontSize:13,fontWeight:600,color:"#7a2848",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text"}}>{name}</span>;
}

function PageNameInput({name,onRename,isSelected}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(name);
  if(editing){return <input autoFocus value={val} onChange={function(e){setVal(e.target.value);}} onBlur={function(){onRename(val.trim()||name);setEditing(false);}} onKeyDown={function(e){if(e.key==="Enter"){onRename(val.trim()||name);setEditing(false);}if(e.key==="Escape")setEditing(false);}} onClick={function(e){e.stopPropagation();}} style={{flex:1,border:"none",borderBottom:"1.5px solid "+(isSelected?"#a05070":"#c0a0b0"),outline:"none",fontSize:12,color:"#7a2848",background:"transparent",fontFamily:"inherit",minWidth:0,padding:"1px 0"}}/>;}
  return <span onClick={function(e){e.stopPropagation();setEditing(true);}} title="클릭하여 이름 수정" style={{fontSize:12,color:isSelected?"#7a2848":"#6a5060",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text"}}>{name}</span>;
}

const ES={flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:"#94a3b8",textAlign:"center"};

function NotePage({onEntriesChange}){
  const [notebooks,setNotebooks]=useState(function(){try{const v=localStorage.getItem("bm_notebooks");return v?JSON.parse(v):[];}catch{return[];}});
  const [selNb,setSelNb]=useState(null);
  const [selCh,setSelCh]=useState(null);
  const [selPg,setSelPg]=useState(null);
  const [addingNb,setAddingNb]=useState(false);
  const [newNbName,setNewNbName]=useState("");
  const [saveMsg,setSaveMsg]=useState("");
  const nb=notebooks.find(function(n){return n.id===selNb;});
  const chapter=nb&&nb.chapters.find(function(c){return c.id===selCh;});
  const page=chapter&&chapter.pages.find(function(p){return p.id===selPg;});
  useEffect(function(){const t=notebooks.reduce(function(a,n){return a+n.chapters.reduce(function(b,c){return b+c.pages.reduce(function(d,p){return d+p.entries.length;},0);},0);},0);onEntriesChange(t);},[notebooks]);
  const saveNotebooks=function(){try{localStorage.setItem("bm_notebooks",JSON.stringify(notebooks));setSaveMsg("저장됨 ✓");setTimeout(function(){setSaveMsg("");},2000);}catch{setSaveMsg("저장 실패");}};
  const upNbs=function(fn){setNotebooks(fn);};
  const addNb=function(){if(!newNbName.trim())return;const n={id:Date.now(),name:newNbName.trim(),chapters:[]};upNbs(function(p){return p.concat([n]);});setSelNb(n.id);setSelCh(null);setSelPg(null);setNewNbName("");setAddingNb(false);};
  const addChapter=function(){if(!nb)return;const ch={id:Date.now(),name:"챕터 "+((nb.chapters.length||0)+1),pages:[]};upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.concat([ch])}):n;});});setSelCh(ch.id);setSelPg(null);};
  const addPage=function(chId){const ch2=nb&&nb.chapters.find(function(c){return c.id===chId;});const pg={id:Date.now(),name:"페이지 "+((ch2&&ch2.pages.length||0)+1),entries:[]};upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===chId?Object.assign({},ch,{pages:ch.pages.concat([pg])}):ch;})}):n;});});setSelCh(chId);setSelPg(pg.id);};
  const addEntry=function(){if(!selPg)return;upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===selCh?Object.assign({},ch,{pages:ch.pages.map(function(pg){if(pg.id!==selPg)return pg;return Object.assign({},pg,{entries:pg.entries.concat([{id:Date.now(),content:"",title:"",num:pg.entries.length+1}])});})}):ch;})}):n;});});};
  const updateEntry=function(id,data){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===selCh?Object.assign({},ch,{pages:ch.pages.map(function(pg){return pg.id===selPg?Object.assign({},pg,{entries:pg.entries.map(function(e){return e.id===id?Object.assign({},e,data):e;})}):pg;})}):ch;})}):n;});});};
  const deleteEntry=function(id){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===selCh?Object.assign({},ch,{pages:ch.pages.map(function(pg){return pg.id===selPg?Object.assign({},pg,{entries:pg.entries.filter(function(e){return e.id!==id;}).map(function(e,i){return Object.assign({},e,{num:i+1});})}):pg;})}):ch;})}):n;});});};
  const deleteNb=function(id){upNbs(function(p){return p.filter(function(n){return n.id!==id;});});if(selNb===id){setSelNb(null);setSelCh(null);setSelPg(null);}};
  const deleteChapter=function(chId){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.filter(function(ch){return ch.id!==chId;})}):n;});});if(selCh===chId){setSelCh(null);setSelPg(null);}};
  const deletePage=function(chId,pgId){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===chId?Object.assign({},ch,{pages:ch.pages.filter(function(pg){return pg.id!==pgId;})}):ch;})}):n;});});if(selPg===pgId)setSelPg(null);};
  const renameChapter=function(chId,name){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===chId?Object.assign({},ch,{name:name}):ch;})}):n;});});};
  const renamePage=function(chId,pgId,name){upNbs(function(p){return p.map(function(n){return n.id===selNb?Object.assign({},n,{chapters:n.chapters.map(function(ch){return ch.id===chId?Object.assign({},ch,{pages:ch.pages.map(function(pg){return pg.id===pgId?Object.assign({},pg,{name:name}):pg;})}):ch;})}):n;});});};
  return(
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>
      <div style={{width:210,borderRight:"1px solid #ede8ec",background:"white",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white",borderBottom:"1px solid #ede8ec"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#5a3a4a"}}>노트북</span>
          <button onClick={function(){setAddingNb(true);}} style={{background:"#a05070",color:"white",border:"none",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
        </div>
        {addingNb&&(<div style={{padding:"8px 12px",borderBottom:"1px solid #f1f5f9"}}><input autoFocus value={newNbName} onChange={function(e){setNewNbName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addNb();if(e.key==="Escape")setAddingNb(false);}} placeholder="노트북 이름..." style={{width:"100%",padding:"6px 8px",border:"1px solid #a05070",borderRadius:8,fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none"}}/></div>)}
        <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
          {notebooks.length===0&&<div style={{padding:16,textAlign:"center",fontSize:12,color:"#94a3b8"}}>위 + 버튼으로<br/>노트북을 만들어보세요</div>}
          {notebooks.map(function(n){return(<div key={n.id} onClick={function(){setSelNb(n.id);setSelCh(null);setSelPg(null);}} style={{padding:"10px 12px",cursor:"pointer",fontSize:13,fontWeight:500,borderRadius:10,marginBottom:3,display:"flex",alignItems:"center",gap:6,background:selNb===n.id?"linear-gradient(135deg,#eeece8,#fce7f3)":"#f8fafc",color:selNb===n.id?"#a05070":"#475569",border:"1px solid "+(selNb===n.id?"#d4d0ca":"#f1f5f9")}}><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name}</span><button onClick={function(e){e.stopPropagation();deleteNb(n.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:13,padding:"0 2px",lineHeight:1,flexShrink:0}}>🗑</button></div>);})}
        </div>
      </div>
      <div style={{width:290,borderRight:"1px solid #ede8ec",background:"#fdf5f8",display:"flex",flexDirection:"column"}}>
        {!nb?<div style={ES}><div style={{width:48,height:48,borderRadius:12,background:"#f0e0e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#a05070",marginBottom:4}}>+</div><div style={{fontSize:13,fontWeight:600,color:"#5a3a4a"}}>노트북을 선택해주세요</div><div style={{fontSize:11,color:"#c0a0b0"}}>왼쪽에서 노트북을 클릭하세요</div></div>:(
          <React.Fragment>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #ede8ec",background:"white"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#a05070",flexShrink:0}}/><span style={{fontWeight:600,color:"#3a1a28",fontSize:13}}>{nb.name}</span></div><div style={{fontSize:11,color:"#b09aa8",marginTop:2}}>{nb.chapters.length}개의 챕터</div></div>
            <div style={{flex:1,overflowY:"auto",padding:"8px 8px 0"}}>
              {nb.chapters.map(function(ch){return(<div key={ch.id} style={{marginBottom:4}}><div onClick={function(){setSelCh(ch.id);setSelPg(null);}} style={{padding:"9px 12px",borderRadius:10,cursor:"pointer",background:selCh===ch.id?"#fce8f0":"#f8eaf2",border:"1px solid "+(selCh===ch.id?"#e0b8cc":"#ede0e8"),display:"flex",alignItems:"center",gap:8}}><ChapterNameInput name={ch.name} onRename={function(name){renameChapter(ch.id,name);}}/><span style={{fontSize:10,color:"#c0a0b0",flexShrink:0}}>{ch.pages.length}p</span><button onClick={function(e){e.stopPropagation();deleteChapter(ch.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#e0a0b8",fontSize:12,padding:"0 2px",lineHeight:1,flexShrink:0}}>🗑</button></div>{ch.pages.map(function(pg){return(<div key={pg.id} onClick={function(){setSelCh(ch.id);setSelPg(pg.id);}} style={{padding:"7px 12px 7px 24px",borderRadius:10,cursor:"pointer",background:selPg===pg.id?"#f5e0ea":"white",marginTop:3,marginLeft:10,border:"1px solid "+(selPg===pg.id?"#d4a8bc":"#ede8ec"),display:"flex",alignItems:"center",gap:6}}><PageNameInput name={pg.name} isSelected={selPg===pg.id} onRename={function(name){renamePage(ch.id,pg.id,name);}}/>{pg.entries.length>0&&<span style={{fontSize:10,background:"#f5e0ea",color:"#a05070",padding:"1px 6px",borderRadius:20,flexShrink:0}}>{pg.entries.length}</span>}<button onClick={function(e){e.stopPropagation();deletePage(ch.id,pg.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#e0a0b8",fontSize:11,padding:"0 2px",lineHeight:1,flexShrink:0}}>🗑</button></div>);})}{selCh===ch.id&&<button onClick={function(){addPage(ch.id);}} style={{display:"block",width:"calc(100% - 10px)",marginLeft:10,marginTop:3,background:"white",border:"1px dashed #d4b8c8",borderRadius:8,padding:"6px",cursor:"pointer",fontSize:11,color:"#a05070",fontFamily:"inherit"}}>+ 페이지 추가</button>}</div>);})}
            </div>
            <div style={{padding:"10px 8px",borderTop:"1px solid #ede8ec"}}><button onClick={addChapter} style={{width:"100%",padding:"10px",fontFamily:"inherit",background:"white",border:"1px solid #e0c8d4",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,color:"#a05070"}}>+ 챕터 추가</button></div>
          </React.Fragment>
        )}
      </div>
      <div style={{flex:1,background:"#fafafa",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {!page?<div style={ES}><div style={{fontSize:14,fontWeight:600,color:"#3a2030"}}>페이지를 선택하거나 새로 만들어보세요</div><div style={{fontSize:12,color:"#b09aa8"}}>먼저 왼쪽에서 노트북을 만들어주세요</div></div>:(
          <React.Fragment>
            <div style={{padding:"11px 20px",background:"white",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:12,color:"#94a3b8"}}><span style={{fontWeight:500,color:"#64748b"}}>{nb.name}</span><span style={{color:"#c0bab2",margin:"0 6px"}}>›</span><span style={{fontWeight:500,color:"#64748b"}}>{chapter&&chapter.name}</span><span style={{color:"#c0bab2",margin:"0 6px"}}>›</span><span style={{fontWeight:700,color:"#334155"}}>{page.name}</span></div><div style={{display:"flex",alignItems:"center",gap:8}}>{saveMsg&&<span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>{saveMsg}</span>}<span style={{fontSize:11,background:"#eeece8",color:"#a05070",padding:"2px 10px",borderRadius:20}}>{page.entries.length}개의 항목</span><button onClick={saveNotebooks} style={{padding:"5px 14px",background:"#a05070",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>💾 저장</button></div></div>
            <div style={{flex:1,overflowY:"auto",padding:20}}>{page.entries.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:60}}>아래 버튼으로 첫 엔트리를 추가해보세요! ✨</div>}{page.entries.map(function(e){return <EntryEditor key={e.id} entry={e} onUpdate={function(d){updateEntry(e.id,d);}} onDelete={function(){deleteEntry(e.id);}}/>;})}</div>
            <div style={{padding:"12px 20px",borderTop:"1px solid #e2e8f0",background:"white",display:"flex",gap:10,alignItems:"center"}}><button onClick={addEntry} style={{padding:"10px 24px",fontFamily:"inherit",background:"linear-gradient(135deg,#eeece8,#fce7f3)",border:"1px solid #b0aba3",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:600,color:"#a05070"}}>+ 엔트리 추가</button><button onClick={saveNotebooks} style={{padding:"10px 20px",fontFamily:"inherit",background:"#a05070",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:600,color:"white"}}>💾 노트 저장</button>{saveMsg&&<span style={{fontSize:12,color:"#22c55e",fontWeight:600}}>{saveMsg}</span>}</div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

const SB=function(bg,color,bc){return {fontSize:11,background:bg,color:color,border:bc?"1px solid "+bc:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"};};

function QuestItem({quest,onStart,onPause,onResume,onConfirm,onUndo,onDelete,onEditMin,onEditLabel,tone}){
  const [editingMin,setEditingMin]=useState(false);
  const [localMin,setLocalMin]=useState(quest.userMin);
  const [editingLabel,setEditingLabel]=useState(false);
  const [localLabel,setLocalLabel]=useState(quest.label);
  const done=quest.done,running=quest.running,secs=quest.secs,userMin=quest.userMin;
  const total=userMin*60;
  const pct=secs!==null?((total-secs)/total)*100:0;
  const t=tone||{bg:"#f8fafc",border:"#e2e8f0",text:"#334155",accent:"#a05070",solid:false};
  return(
    <div style={{background:done?"#f0fdf4":t.bg,borderRadius:12,border:"1px solid "+(done?"#86efac":t.border),padding:"11px 13px",marginBottom:8,transition:"all 0.25s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(done?"#22c55e":pct>=90?t.accent:"#cbd5e1"),background:done?"#22c55e":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:pct>=90&&!done?"pointer":"default",boxShadow:pct>=90&&!done?"0 0 0 3px "+t.accent+"26":"none"}} onClick={pct>=90&&!done?function(){onConfirm();}:undefined}>{done&&<span style={{color:"white",fontSize:10}}>✓</span>}</div>
        {editingLabel&&!done?<input autoFocus value={localLabel} onChange={function(e){setLocalLabel(e.target.value);}} onBlur={function(){onEditLabel(localLabel.trim()||quest.label);setEditingLabel(false);}} onKeyDown={function(e){if(e.key==="Enter"){onEditLabel(localLabel.trim()||quest.label);setEditingLabel(false);}if(e.key==="Escape")setEditingLabel(false);}} style={{flex:1,border:"none",borderBottom:"1.5px solid "+t.accent,outline:"none",fontSize:13,background:"transparent",fontFamily:"inherit",padding:"1px 0"}}/>:<span onDoubleClick={function(){if(!done&&!running)setEditingLabel(true);}} title={done?"":"더블클릭하여 이름 수정"} style={{flex:1,fontSize:13,color:done?"#94a3b8":t.text,textDecoration:done?"line-through":"none",cursor:done||running?"default":"text"}}>{quest.label}</span>}
        {!done&&(editingMin?<input type="number" value={localMin} min={1} max={300} autoFocus onChange={function(e){setLocalMin(e.target.value);}} onBlur={function(){const v=Math.max(1,Number(localMin)||1);onEditMin(v);setEditingMin(false);}} onKeyDown={function(e){if(e.key==="Enter"){const v=Math.max(1,Number(localMin)||1);onEditMin(v);setEditingMin(false);}}} style={{width:52,padding:"2px 6px",border:"1px solid "+t.accent,borderRadius:6,fontSize:12,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>:<span onClick={function(){if(!running)setLocalMin(String(userMin));if(!running)setEditingMin(true);}} title="클릭하여 시간 수정" style={{fontSize:12,color:t.solid?t.text:t.accent,background:t.solid?"rgba(255,255,255,0.18)":"white",padding:"2px 8px",borderRadius:20,cursor:"pointer"}}>{fmtMin(userMin)} ✎</span>)}
        <span style={{fontSize:12,color:t.solid?t.text:t.accent,fontWeight:700}}>+{quest.baseXp} XP</span>
        {!done&&!running&&<button onClick={onDelete} style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:13,padding:"0 2px",lineHeight:1}}>🗑</button>}
      </div>
      {!done&&(<div style={{marginTop:8}}><div style={{height:4,background:t.solid?"rgba(255,255,255,0.25)":"#e2e8f0",borderRadius:9999}}><div style={{width:pct+"%",height:"100%",background:pct>=90?t.accent:(t.solid?"rgba(255,255,255,0.7)":"linear-gradient(90deg,#1e1e1e,#3d3d3d)"),borderRadius:9999,transition:"width 1s linear"}}/></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5}}><span style={{fontSize:11,color:t.solid?"rgba(255,255,255,0.75)":"#94a3b8"}}>{secs!==null?(pct>=90?"✓ 체크박스로 완료!":fmt(secs)+" 남음"):"목표 "+fmt(total)}</span><div style={{display:"flex",gap:5}}>{!running&&secs===null&&<button onClick={onStart} style={SB(t.accent,t.solid?"#1e293b":"white")}>▶ 시작</button>}{running&&<button onClick={onPause} style={SB("#f1f5f9","#64748b","#e2e8f0")}>⏸ 일시정지</button>}{!running&&secs!==null&&secs>0&&<button onClick={onResume} style={SB(t.accent,t.solid?"#1e293b":"white")}>▶ 재개</button>}</div></div></div>)}
      {done&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>✓ 완료! +{quest.baseXp} XP 획득</span><button onClick={onUndo} style={{fontSize:11,background:"white",border:"1px solid #fecaca",borderRadius:6,padding:"2px 8px",cursor:"pointer",color:"#ef4444",fontFamily:"inherit"}}>↩ XP 취소</button></div>)}
    </div>
  );
}

const KR_FIXED={"01-01":"신정","03-01":"삼일절","05-05":"어린이날","06-06":"현충일","08-15":"광복절","10-03":"개천절","10-09":"한글날","12-25":"크리스마스","2026-01-28":"설날 연휴","2026-01-29":"설날","2026-01-30":"설날 연휴","2026-05-24":"부처님오신날","2026-09-24":"추석 연휴","2026-09-25":"추석","2026-09-26":"추석 연휴","2025-01-29":"설날","2025-10-06":"추석"};
const DAY_LABELS=["일","월","화","수","목","금","토"];
function KoreanCalendar(props){
  const compact=props.compact||false;
  const today=new Date();
  const [cur,setCur]=useState({year:today.getFullYear(),month:today.getMonth()});
  const year=cur.year,month=cur.month;
  const getHoliday=function(y,m,d){const mm=String(m+1).padStart(2,"0"),dd=String(d).padStart(2,"0");return KR_FIXED[y+"-"+mm+"-"+dd]||KR_FIXED[mm+"-"+dd]||null;};
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const prevMonthDays=new Date(year,month,0).getDate();
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevMonthDays-i,current:false});
  for(let d=1;d<=daysInMonth;d++)cells.push({day:d,current:true});
  for(let d=1;d<=42-cells.length;d++)cells.push({day:d,current:false});
  return(
    <div style={{background:"white",borderRadius:14,padding:compact?12:16,border:"1px solid #e2e8f0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:compact?8:14}}>
        <span style={{fontSize:compact?12:14,fontWeight:700,color:"#334155"}}>📅 캘린더</span>
        <div style={{display:"flex",alignItems:"center",gap:compact?4:8}}>
          <button onClick={function(){setCur(function(c){const m=c.month===0?11:c.month-1;const y=c.month===0?c.year-1:c.year;return {year:y,month:m};});}} style={{background:"#f1f5f9",border:"none",borderRadius:6,width:compact?22:26,height:compact?22:26,cursor:"pointer",fontSize:compact?11:14,color:"#64748b"}}>‹</button>
          <span style={{fontSize:compact?11:14,fontWeight:700,color:"#334155",minWidth:compact?60:70,textAlign:"center"}}>{year}년 {month+1}월</span>
          <button onClick={function(){setCur(function(c){const m=c.month===11?0:c.month+1;const y=c.month===11?c.year+1:c.year;return {year:y,month:m};});}} style={{background:"#f1f5f9",border:"none",borderRadius:6,width:compact?22:26,height:compact?22:26,cursor:"pointer",fontSize:compact?11:14,color:"#64748b"}}>›</button>
          <button onClick={function(){setCur({year:today.getFullYear(),month:today.getMonth()});}} style={{background:"#eeece8",border:"none",borderRadius:6,padding:compact?"2px 7px":"3px 10px",cursor:"pointer",fontSize:compact?10:11,fontWeight:600,color:"#a05070"}}>오늘</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:2}}>{DAY_LABELS.map(function(d,i){return <div key={i} style={{textAlign:"center",fontSize:compact?9:11,fontWeight:700,padding:compact?"2px 0":"4px 0",color:i===0?"#ef4444":i===6?"#3b82f6":"#64748b"}}>{d}</div>;})}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
        {cells.map(function(cell,idx){
          const col=idx%7;
          const holiday=cell.current?getHoliday(year,month,cell.day):null;
          const isRed=col===0||(!!holiday);
          const isBlue=col===6&&!holiday;
          const isToday=cell.current&&year===today.getFullYear()&&month===today.getMonth()&&cell.day===today.getDate();
          const sz=compact?24:30;
          return(<div key={idx} title={holiday||undefined} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:compact?"2px 0":"3px 0"}}><div style={{width:sz,height:sz,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?"#a05070":"transparent"}}><span style={{fontSize:compact?10:12,fontWeight:isToday?800:cell.current?500:400,color:isToday?"white":!cell.current?"#d1d5db":isRed?"#ef4444":isBlue?"#3b82f6":"#334155",lineHeight:1}}>{cell.day}</span></div>{!isToday&&cell.current&&holiday&&<div style={{width:3,height:3,borderRadius:"50%",background:"#ef4444",marginTop:1}}/>}</div>);
        })}
      </div>
    </div>
  );
}

function getWeekLabel(){const now=new Date();const m=now.getMonth()+1;const fd=new Date(now.getFullYear(),now.getMonth(),1).getDay();return m+"월 "+Math.ceil((now.getDate()+fd)/7)+"주차";}
function getDayDate(i){const now=new Date();const d=new Date(now);d.setDate(d.getDate()+(i-now.getDay()));return (d.getMonth()+1)+"/"+d.getDate();}
function WeeklyBarChart(props){
  const title=props.title,barColor=props.barColor,data=props.data,unit=props.unit,todayIdx=props.todayIdx;
  const max=Math.max.apply(null,data.concat([1]));
  const [hovered,setHovered]=useState(null);
  return(
    <div style={{background:"white",borderRadius:12,padding:"14px 16px",border:"1px solid #ede8ec"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:12,fontWeight:600,color:"#3a2030"}}>{title}</span><span style={{fontSize:10,color:"#b09aa8",background:"#f5eaf0",padding:"2px 8px",borderRadius:20}}>{getWeekLabel()}</span></div>
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
        {data.map(function(val,i){const pct=Math.max((val/max)*100,2);const isToday=i===todayIdx;const isHov=hovered===i;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",position:"relative"}} onMouseEnter={function(){setHovered(i);}} onMouseLeave={function(){setHovered(null);}}>
          {isHov&&<div style={{position:"absolute",top:-38,left:"50%",transform:"translateX(-50%)",background:"#2d1a22",color:"white",fontSize:10,fontWeight:600,padding:"4px 8px",borderRadius:7,whiteSpace:"nowrap",zIndex:10,textAlign:"center"}}><div style={{color:"#e8b8cc",fontSize:9}}>{getDayDate(i)}</div><div>{val>0?val+unit:"-"}</div></div>}
          <div style={{width:"100%",height:pct+"%",borderRadius:"5px 5px 0 0",background:isToday?barColor:"#f0e0e8",transition:"height 0.4s ease",opacity:isHov?0.75:1}}/>
        </div>);})}
      </div>
      <div style={{display:"flex",gap:6,marginTop:6}}>{DAY_LABELS.map(function(d,i){return <div key={i} style={{flex:1,textAlign:"center",fontSize:10,fontWeight:i===todayIdx?700:400,color:i===todayIdx?"#a05070":"#c0aab8"}}>{d}</div>;})}</div>
      <div style={{marginTop:10,borderTop:"1px solid #f0e8ec",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"#b09aa8"}}>이번 주 합계</span><span style={{fontSize:13,fontWeight:700,color:"#3a2030"}}>{data.reduce(function(a,b){return a+b;},0)}{unit}</span></div>
    </div>
  );
}

function Dashboard({xp,onXPChange,stats,setStats,xpFlash,activeTab,darkMode,onQuestsChange}){
  const th=getTheme("default",darkMode||false);
  const [widgetColors,setWidgetColors]=useState(function(){
    return loadLS("bm_widget_colors_v2",{
      quest:{color:"#a05070",tone:"same"},
      cal_ai:{color:"#a05070",tone:"same"},
      badges:{color:"#a05070",tone:"same"},
      report:{color:"#a05070",tone:"same"},
    });
  });
  const setWColor=function(wid,patch){
    setWidgetColors(function(prev){
      const next=Object.assign({},prev);
      next[wid]=Object.assign({},prev[wid],patch);
      try{localStorage.setItem("bm_widget_colors_v2",JSON.stringify(next));}catch{}
      return next;
    });
  };
  const [showColorPicker,setShowColorPicker]=useState(null);

  const COLOR_PRESETS=["#a05070","#e11d48","#ea580c","#ca8a04","#16a34a","#0284c7","#7c3aed","#0f766e","#1d4ed8","#db2777","#0f172a","#be185d"];
  const TONES=[{id:"light",label:"연하게"},{id:"same",label:"똑같이"},{id:"dark",label:"진하게"}];

  const WidgetHeader=function(props){
    const wid=props.wid,emoji=props.emoji,title=props.title,extra=props.extra,cardText=props.cardText||"#334155";
    const wc=widgetColors[wid]||{color:"#a05070",tone:"same"};
    const previewTone=getToneStyle(wc.color,wc.tone);
    const previewCard=getCardStyle(wc.color,wc.tone);
    return(
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,position:"relative"}}>
        <span draggable="true" onDragStart={function(e){e.stopPropagation();onDragStart(wid);}} onDragEnd={onDragEnd}
          style={{fontSize:14,color:cardText==="#ffffff"?"rgba(255,255,255,0.6)":"#94a3b8",cursor:"grab",userSelect:"none",padding:"0 4px"}} title="드래그해서 순서 변경">⠿</span>
        <span style={{fontSize:14,fontWeight:600,color:cardText}}>{emoji} {title}</span>
        {extra}
        <button
          onMouseDown={function(e){e.stopPropagation();}}
          onClick={function(e){e.stopPropagation();setShowColorPicker(showColorPicker===wid?null:wid);}}
          style={{marginLeft:"auto",width:22,height:22,borderRadius:"50%",background:wc.color,border:"3px solid white",boxShadow:"0 1px 6px rgba(0,0,0,0.2)",cursor:"pointer",flexShrink:0}}
          title="위젯 색상 변경"/>
        {showColorPicker===wid&&(
          <div
            onMouseDown={function(e){e.stopPropagation();}}
            onClick={function(e){e.stopPropagation();}}
            style={{position:"absolute",top:30,right:0,background:"white",borderRadius:18,padding:"16px 18px",boxShadow:"0 8px 40px rgba(0,0,0,0.18)",border:"1px solid #f0d0e0",zIndex:9999,width:240}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>🎨 위젯 색상</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:10}}>
              {COLOR_PRESETS.map(function(col){return(
                <div key={col}
                  onClick={function(){setWColor(wid,{color:col});}}
                  style={{width:26,height:26,borderRadius:"50%",background:col,cursor:"pointer",border:wc.color===col?"3px solid #1e293b":"2px solid transparent",boxSizing:"border-box",transition:"transform 0.1s",transform:wc.color===col?"scale(1.2)":"scale(1)"}}/>
              );})}
            </div>
            <input type="color" value={wc.color}
              onChange={function(e){setWColor(wid,{color:e.target.value});}}
              style={{width:"100%",height:30,borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer",padding:2,marginBottom:14}}/>

            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>🧊 톤 선택 — 위젯 배경과 박스가 자동으로 맞춰져요</div>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {TONES.map(function(t){
                const active=wc.tone===t.id;
                return(
                  <button key={t.id} onClick={function(){setWColor(wid,{tone:t.id});}}
                    style={{flex:1,padding:"6px 4px",borderRadius:9,border:"1.5px solid "+(active?wc.color:"#e2e8f0"),background:active?wc.color+"14":"white",color:active?wc.color:"#94a3b8",fontSize:11,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* live preview: widget card bg + inner box together */}
            <div style={{background:previewCard.bg,border:"1px solid "+previewCard.border,borderRadius:12,padding:8}}>
              <div style={{fontSize:9,fontWeight:700,color:previewCard.text,marginBottom:6}}>위젯 배경 미리보기</div>
              <div style={{background:previewTone.bg,border:"1px solid "+previewTone.border,borderRadius:9,padding:"7px 9px"}}>
                <div style={{fontSize:10,color:previewTone.solid?previewTone.text:"#475569",fontWeight:600}}>미리보기 박스</div>
                <div style={{fontSize:9,color:previewTone.solid?"rgba(255,255,255,0.75)":"#94a3b8",marginTop:2}}>이렇게 적용돼요</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
const todayStr=function(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  const [quests,setQuests]=useState(function(){
    const saved=loadLS("bm_quests_today",null);
    if(saved&&saved.date===todayStr()){
      return saved.quests.map(function(q){return Object.assign({},q,{running:false});});
    }
    return INIT_QUESTS.map(function(q){return Object.assign({},q,{userMin:q.suggestedMin,secs:null,running:false,done:false});});
  });
  const [addingQ,setAddingQ]=useState(false);
  const [newQL,setNewQL]=useState("");
  const addQuest=function(){
    if(!newQL.trim())return;
    setQuests(function(prev){return prev.concat([{id:Date.now(),label:newQL.trim(),baseXp:10,suggestedMin:15,userMin:15,secs:null,running:false,done:false}]);});
    setNewQL("");
    setAddingQ(false);
  };
const [praiseMsg,setPraiseMsg]=useState(null);
  useEffect(function(){if(onQuestsChange)onQuestsChange(quests);},[quests]);
  useEffect(function(){
    try{localStorage.setItem("bm_quests_today",JSON.stringify({date:todayStr(),quests:quests}));}catch{}
  },[quests]);
  useEffect(function(){if(activeTab!=="dashboard"){setQuests(function(p){return p.map(function(q){return q.running?Object.assign({},q,{running:false}):q;});});}  },[activeTab]);
  const ivRef=useRef(null);
  useEffect(function(){
    ivRef.current=setInterval(function(){setQuests(function(prev){let changed=false;const next=prev.map(function(q){if(!q.running||q.done)return q;changed=true;const ns=q.secs-1;if(ns<=0)return Object.assign({},q,{secs:0,running:false,done:true,_justDone:true});return Object.assign({},q,{secs:ns});});return changed?next:prev;});},1000);
    return function(){clearInterval(ivRef.current);};
  },[]);
  useEffect(function(){
    const today=new Date().getDay();
    quests.forEach(function(q){
      if(!q._justDone)return;
      onXPChange(function(x){return x+q.baseXp;});
      setStats(function(s){const wXP=s.weeklyXP.slice();wXP[today]=(wXP[today]||0)+q.baseXp;const wM=s.weeklyMins.slice();wM[today]=(wM[today]||0)+q.userMin;const today2=new Date();const dateStr=today2.getFullYear()+"-"+String(today2.getMonth()+1).padStart(2,"0")+"-"+String(today2.getDate()).padStart(2,"0");const prevDates=s.studyDates||[];const newDates=prevDates.includes(dateStr)?prevDates:prevDates.concat([dateStr]);return Object.assign({},s,{questsDone:s.questsDone+1,studySecs:s.studySecs+q.userMin*60,weeklyXP:wXP,weeklyMins:wM,studyDates:newDates,streak:calcStreak(newDates)});});
      setQuests(function(p){return p.map(function(qq){return qq.id===q.id?Object.assign({},qq,{_justDone:false}):qq;});});
      try{if(navigator.vibrate)navigator.vibrate([80,40,120]);}catch(e){}
      const PRAISE=["🎉 완벽해요! 오늘도 한 조각을 완성했어요!","💪 대단해요! 이 기세로 계속 go!","✨ 퍼즐 한 조각 획득!","🔥 스트릭을 지켜냈어요!","⚡ XP 획득! 레벨업이 가까워지고 있어요!","🏆 훌륭해요! 습관이 실력이 되는 순간이에요."];
      setPraiseMsg(PRAISE[Math.floor(Math.random()*PRAISE.length)]);
      setTimeout(function(){setPraiseMsg(null);},3200);
    });
  },[quests]);
  const upQ=function(id,patch){setQuests(function(p){return p.map(function(q){return q.id===id?Object.assign({},q,patch):q;});});};
  const lvl=getLvl(xp),rank=getRank(xp);
  const xpInLevel=xp-lvl.minXP,xpNeeded=lvl.maxXP-lvl.minXP;
  const progress=Math.min((xpInLevel/xpNeeded)*100,100);
  const xpToNext=lvl.maxXP-xp;
  const qDone=quests.filter(function(q){return q.done;}).length;
  const earned=ALL_BADGES.filter(function(b){return b.req(Object.assign({},stats,{xp:xp,level:lvl.level}));});
  const aiMode=xpToNext<=30?"xp":qDone===0?"warn":"basic";
  const aiCfgs={warn:{msg:"아직 퀘스트를 완료하지 않았어요! 오늘 학습을 시작해보세요. 💪",bg:"#fdf0f4",border:"#f0c8d8",icon:"😤"},xp:{msg:"레벨업까지 "+xpToNext+" XP만 남았어요! 지금 학습하면 레벨업! 🎉",bg:"#fce8f0",border:"#f0b8d0",icon:"🤩"},basic:{msg:"오늘도 잘게 성장해요! 퀘스트를 완료해보세요. 😊",bg:"#fdf0f5",border:"#f0c8d8",icon:"😊"}};
  const aiCfg=aiCfgs[aiMode];
  const handleUndo=function(qid,xpAmt,userMin){const today=new Date().getDay();upQ(qid,{done:false,secs:null,running:false});onXPChange(function(x){return Math.max(0,x-xpAmt);});setStats(function(s){const wXP=s.weeklyXP.slice();wXP[today]=Math.max(0,(wXP[today]||0)-xpAmt);const wM=s.weeklyMins.slice();wM[today]=Math.max(0,(wM[today]||0)-userMin);return Object.assign({},s,{questsDone:Math.max(0,s.questsDone-1),studySecs:Math.max(0,s.studySecs-userMin*60),weeklyXP:wXP,weeklyMins:wM});});};
  const deleteQuest=function(qid){setQuests(function(p){return p.filter(function(q){return q.id!==qid;});});};
  const today2=new Date().getDay();
  // Widget order state (stored in localStorage)
  const [widgetOrder,setWidgetOrder]=useState(function(){
    return loadLS("bm_widget_order",["quest","cal_ai","badges","report"]);
  });
  const [dragOverId,setDragOverId]=useState(null);
  const [dragId,setDragId]=useState(null);

  const onDragStart=function(id){setDragId(id);};
  const onDragOver=function(e,id){e.preventDefault();setDragOverId(id);};
  const onDrop=function(id){
    if(!dragId||dragId===id)return;
    const order=widgetOrder.slice();
    const fromIdx=order.indexOf(dragId);
    const toIdx=order.indexOf(id);
    order.splice(fromIdx,1);
    order.splice(toIdx,0,dragId);
    setWidgetOrder(order);
    try{localStorage.setItem("bm_widget_order",JSON.stringify(order));}catch{}
    setDragId(null);setDragOverId(null);
  };
  const onDragEnd=function(){setDragId(null);setDragOverId(null);};

  const qTone=getToneStyle(widgetColors.quest.color,widgetColors.quest.tone);
  const bTone=getToneStyle(widgetColors.badges.color,widgetColors.badges.tone);
  const rTone=getToneStyle(widgetColors.report.color,widgetColors.report.tone);
  const cTone=getToneStyle(widgetColors.cal_ai.color,widgetColors.cal_ai.tone);
  const qCard=getCardStyle(widgetColors.quest.color,widgetColors.quest.tone);
  const bCard=getCardStyle(widgetColors.badges.color,widgetColors.badges.tone);
  const rCard=getCardStyle(widgetColors.report.color,widgetColors.report.tone);
  const cCard=getCardStyle(widgetColors.cal_ai.color,widgetColors.cal_ai.tone);

  const WIDGETS={
    quest:(
      <div key="quest"
        onDragOver={function(e){e.preventDefault();setDragOverId("quest");}}
        onDrop={function(){onDrop("quest");}}
        onDragLeave={function(){setDragOverId(null);}}
        style={{background:qCard.bg,borderRadius:20,padding:18,border:"2px solid "+(dragOverId==="quest"?widgetColors.quest.color:qCard.border),boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"border 0.15s, background 0.3s"}}>
        <WidgetHeader wid="quest" emoji="🎯" title="오늘의 퀘스트" cardText={qCard.text} extra={<React.Fragment><span style={{fontSize:11,color:qTone.solid?qTone.accent:widgetColors.quest.color,background:widgetColors.quest.color+"18",padding:"2px 8px",borderRadius:20,marginLeft:4}}>{qDone}/{quests.length} 완료</span><button onClick={function(e){e.stopPropagation();setAddingQ(true);}} style={{border:"none",background:"#f1f5f9",width:22,height:22,borderRadius:6,cursor:"pointer",fontSize:14,fontFamily:"inherit",marginLeft:4}}>+</button></React.Fragment>}/>
        {quests.map(function(q){return <QuestItem key={q.id} quest={q} tone={qTone} onStart={function(){upQ(q.id,{secs:q.userMin*60,running:true});}} onPause={function(){upQ(q.id,{running:false});}} onResume={function(){upQ(q.id,{running:true});}} onConfirm={function(){upQ(q.id,{secs:0,running:false,done:true,_justDone:true});}} onUndo={function(){handleUndo(q.id,q.baseXp,q.userMin);}} onDelete={function(){deleteQuest(q.id);}} onEditMin={function(m){upQ(q.id,{userMin:m,secs:null,running:false});}} onEditLabel={function(label){upQ(q.id,{label:label});}}/>;}) }
        {addingQ&&(<div style={{marginTop:10,display:"flex",gap:6}}><input autoFocus value={newQL} onChange={function(e){setNewQL(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addQuest();if(e.key==="Escape")setAddingQ(false);}} placeholder="퀘스트 이름..." style={{flex:1,padding:"6px 8px",border:"1px solid "+widgetColors.quest.color,borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none"}}/><button onClick={addQuest} disabled={!newQL.trim()} style={{padding:"4px 12px",border:"none",background:newQL.trim()?widgetColors.quest.color:"#e2e8f0",color:newQL.trim()?"white":"#94a3b8",borderRadius:8,cursor:newQL.trim()?"pointer":"not-allowed",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>추가</button><button onClick={function(){setAddingQ(false);setNewQL("");}} style={{padding:"4px 8px",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>취소</button></div>)}
        <div style={{marginTop:12,background:"#fffbeb",borderRadius:10,padding:"10px 12px",border:"1px solid #fde68a"}}><div style={{fontSize:11,fontWeight:600,color:"#f59e0b",marginBottom:4}}>💡 스마트 XP 계산 예시:</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px",fontSize:11,color:"#64748b"}}><span>• 50분 학습 → 20 XP</span><span>• 단어 20개 → 15 XP</span><span>• 오래 10개 → 10 XP</span><span>• 줄넘기 1회 → 10 XP</span></div></div>
      </div>
    ),
    cal_ai:(
      <div key="cal_ai"
        onDragOver={function(e){e.preventDefault();setDragOverId("cal_ai");}}
        onDrop={function(){onDrop("cal_ai");}}
        onDragLeave={function(){setDragOverId(null);}}
        style={{background:cCard.bg,borderRadius:20,padding:16,display:"flex",flexDirection:"column",gap:14,border:"2px solid "+(dragOverId==="cal_ai"?widgetColors.cal_ai.color:cCard.border),boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"border 0.15s, background 0.3s"}}>
        <KoreanCalendar compact={true}/>
        <div style={{background:aiCfg.bg,borderRadius:14,padding:14,border:"1px solid "+aiCfg.border}}>
          <WidgetHeader wid="cal_ai" emoji="🤖" title="AI 가이드" cardText="#334155"/>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:22}}>{aiCfg.icon}</span><span style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{aiCfg.msg}</span></div>
          <div style={{display:"flex",gap:6,marginTop:10}}>{[{key:"warn",label:"⚠️ 경고"},{key:"xp",label:"✨ XP 팁"},{key:"basic",label:"🔆 기본"}].map(function(t){return <span key={t.key} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:aiMode===t.key?"#fce8f0":"#f1f5f9",color:aiMode===t.key?"#9b3060":"#94a3b8",border:"1px solid "+(aiMode===t.key?"#f0b8d0":"#e2e8f0"),fontWeight:aiMode===t.key?600:400}}>{t.label}</span>;})}</div>
        </div>
      </div>
    ),
    badges:(
      <div key="badges"
        onDragOver={function(e){e.preventDefault();setDragOverId("badges");}}
        onDrop={function(){onDrop("badges");}}
        onDragLeave={function(){setDragOverId(null);}}
        style={{background:bCard.bg,borderRadius:20,padding:18,border:"2px solid "+(dragOverId==="badges"?widgetColors.badges.color:bCard.border),boxShadow:"0 2px 12px rgba(0,0,0,0.06)",gridColumn:"1 / -1",transition:"border 0.15s, background 0.3s"}}>
        <WidgetHeader wid="badges" emoji="🏅" title="배지 컬렉션" cardText={bCard.text} extra={<span style={{fontSize:11,color:bTone.solid?bTone.accent:widgetColors.badges.color,background:widgetColors.badges.color+"18",padding:"2px 8px",borderRadius:20,marginLeft:4}}>{earned.length}/{ALL_BADGES.length} 획득</span>}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          {ALL_BADGES.map(function(b){const ok=b.req(Object.assign({},stats,{xp:xp,level:lvl.level}));return(<div key={b.id} title={b.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:48,height:48,borderRadius:"50%",background:ok?bTone.bg:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"2px solid "+(ok?bTone.border:"#e2e8f0"),filter:ok?"none":"grayscale(1) opacity(0.4)"}}>{b.emoji}</div><span style={{fontSize:9,color:ok?(bTone.solid?bTone.text:widgetColors.badges.color):"#94a3b8",textAlign:"center",lineHeight:1.2,fontWeight:ok?600:400}}>{b.label}</span></div>);})}
        </div>
      </div>
    ),
    report:(
      <div key="report"
        onDragOver={function(e){e.preventDefault();setDragOverId("report");}}
        onDrop={function(){onDrop("report");}}
        onDragLeave={function(){setDragOverId(null);}}
        style={{background:rCard.bg,borderRadius:20,padding:18,border:"2px solid "+(dragOverId==="report"?widgetColors.report.color:rCard.border),boxShadow:"0 2px 12px rgba(0,0,0,0.06)",gridColumn:"1 / -1",transition:"border 0.15s, background 0.3s"}}>
        <WidgetHeader wid="report" emoji="📊" title="월간 리포트" cardText={rCard.text} extra={<span style={{fontSize:12,color:rCard.sub,marginLeft:4}}>{new Date().getFullYear()}년 {new Date().getMonth()+1}월</span>}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>{[{icon:"⚡",label:"총 획득 XP",val:xp+" XP"},{icon:"⏱️",label:"총 학습 시간",val:fmtMin(Math.round(stats.studySecs/60))},{icon:"🔥",label:"연속 기록",val:stats.streak+"일"},{icon:"🏅",label:"획득 배지",val:earned.length+"개"}].map(function(s,i){return <div key={i} style={{background:rTone.bg,borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:4,border:"1px solid "+rTone.border}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:11,color:rTone.solid?"rgba(255,255,255,0.8)":"#64748b"}}>{s.label}</span><span style={{fontSize:18,fontWeight:800,color:rTone.solid?rTone.text:"#1e293b"}}>{s.val}</span></div>;})}</div>
        <div className="chart-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <WeeklyBarChart title="이번 주 획득 XP" barColor={widgetColors.report.color} data={stats.weeklyXP} unit="XP" todayIdx={new Date().getDay()}/>
          <WeeklyBarChart title="이번 주 학습 시간" barColor={widgetColors.report.color} data={stats.weeklyMins} unit="분" todayIdx={new Date().getDay()}/>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:rCard.text,marginBottom:10}}>🏆 월간 랭킹 기준</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{RANKS.map(function(r){const cur2=getRank(xp).name===r.name;return(<div key={r.name} style={{borderRadius:12,padding:14,textAlign:"center",border:"2px solid "+(cur2?r.border:"#e2e8f0"),background:cur2?r.bg:"#f8fafc",opacity:xp>=r.minXP?1:0.5}}><div style={{fontSize:24}}>{r.icon}</div><div style={{fontWeight:700,color:r.color,marginTop:4}}>{r.name}</div><div style={{fontSize:11,color:"#64748b"}}>{r.minXP}+ XP</div>{cur2&&<div style={{fontSize:10,background:"#fde68a",color:"#92400e",padding:"2px 8px",borderRadius:20,fontWeight:600,marginTop:6,display:"inline-block"}}>현재 등급</div>}</div>);})}
        </div>
      </div>
    ),
  };
  const topTwo=widgetOrder.filter(function(id){return id==="quest"||id==="cal_ai";});
  const bottom=widgetOrder.filter(function(id){return id!=="quest"&&id!=="cal_ai";});

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,paddingTop:10}}>
      {praiseMsg&&<div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:th.p,color:"white",borderRadius:16,padding:"13px 24px",fontSize:14,fontWeight:600,zIndex:500,boxShadow:"0 8px 32px rgba(0,0,0,0.25)",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{praiseMsg}</div>}
      <div style={{background:"white",borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,background:th.pl||"#fce8f0",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🌱</div><div><div style={{fontWeight:700,color:"#1e293b"}}>D+Puzzle Lv.{lvl.level}</div><div style={{fontSize:12,color:"#94a3b8"}}>다음 레벨까지 {Math.max(0,xpToNext)} XP 남음</div></div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:th.p}}>{Math.round(progress)}%</div><div style={{fontSize:11,color:"#94a3b8"}}>{xp} / {lvl.maxXP} XP</div></div>
      </div>
      <div style={{background:"#e2e8f0",height:8,borderRadius:9999,marginTop:-8}}><div style={{width:progress+"%",height:"100%",background:xpFlash?"linear-gradient(90deg,#d9d4cc,#ec4899,#d9d4cc)":"linear-gradient(90deg,"+th.p+","+th.p+"88)",borderRadius:9999,transition:"width 0.5s ease"}}/></div>
      <div style={{fontSize:11,color:"#94a3b8",textAlign:"right"}}>⠿ 카드를 드래그해서 순서를 바꿀 수 있어요</div>
      <div className="dash-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {topTwo.map(function(id){return WIDGETS[id];})}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {bottom.map(function(id){return WIDGETS[id];})}
      </div>
    </div>
  );
}


function CelebrationModal({type,value,onClose}){
  const cfgs={level:{icon:"🎉",title:"레벨 업!",sub:"새 레벨에 도달했어요! 계속 성장해보세요 🌱",grad:"linear-gradient(135deg,#1e1e1e,#3d3d3d)"},rank:{icon:"🏆",title:"등급 상승!",sub:"더 높은 등급으로 올라갔어요! ✨",grad:"linear-gradient(135deg,#f59e0b,#ef4444)"},badge:{icon:"🏅",title:"배지 획득!",sub:"새 배지를 획득했어요! 계속 도전해보세요 🎊",grad:"linear-gradient(135deg,#22c55e,#3b82f6)"}};
  const cfg=cfgs[type]||{};
  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{`@keyframes pop{from{transform:scale(0.7) translateY(30px);opacity:0}to{transform:scale(1);opacity:1}}`}</style><div style={{background:"white",borderRadius:24,padding:"40px 44px",textAlign:"center",maxWidth:380,width:"90%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",animation:"pop 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}><div style={{fontSize:64,marginBottom:10}}>{cfg.icon}</div><div style={{fontSize:26,fontWeight:800,color:"#1e293b",marginBottom:6}}>{cfg.title}</div><div style={{fontSize:16,fontWeight:700,marginBottom:8}}>{value}</div><div style={{fontSize:13,color:"#94a3b8",marginBottom:28}}>{cfg.sub}</div><button onClick={onClose} style={{background:"#a05070",color:"white",border:"none",padding:"13px 36px",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>계속하기 🚀</button></div></div>);
}

function DefaultAvatar(props){const size=props.size||40;return(<svg width={size} height={size} viewBox="0 0 100 100" style={{display:"block",borderRadius:"50%"}}><rect width="100" height="100" fill="#c8d3db"/><circle cx="50" cy="37" r="18" fill="#9baab4"/><ellipse cx="50" cy="85" rx="32" ry="22" fill="#9baab4"/></svg>);}
function AvatarImg(props){const src=props.src,size=props.size||36,border=props.border||"2px solid #d4d0ca";const base={width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,display:"block"};if(src)return <img src={src} alt="avatar" style={Object.assign({},base,{objectFit:"cover",border:border})}/>;return <div style={Object.assign({},base,{border:border})}><DefaultAvatar size={size}/></div>;}
function WithdrawButton({onWithdraw}){const [step,setStep]=useState(0);if(step===0)return <button onClick={function(){setStep(1);}} style={{fontSize:12,color:"#ef4444",background:"none",border:"1px solid #fecaca",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>회원 탈퇴</button>;return(<div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:11,color:"#ef4444"}}>정말요?</span><button onClick={onWithdraw} style={{fontSize:12,color:"white",background:"#ef4444",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>탈퇴</button><button onClick={function(){setStep(0);}} style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>취소</button></div>);}

function ProfileModal({profile,onSave,onClose,onLogout,onWithdraw}){
  const [name,setName]=useState(profile.name);
  const [avatarSrc,setAvatarSrc]=useState(profile.avatarSrc||null);
  const [bio,setBio]=useState(profile.bio||"");
  const [goal,setGoal]=useState(profile.goal||"");
  const fileRef=useRef(null);
  const loadFile=function(file){if(!file||!file.type.startsWith("image/"))return;const reader=new FileReader();reader.onload=function(e){setAvatarSrc(e.target.result);};reader.readAsDataURL(file);};
  const inputStyle={width:"100%",padding:"9px 12px",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"white",borderRadius:24,padding:"32px 36px",width:420,maxWidth:"92vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}><div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>프로필 수정</div><button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b"}}>✕</button></div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
            <div style={{width:96,height:96,borderRadius:"50%",overflow:"hidden",border:"3px solid #d4d0ca",margin:"0 auto"}}>{avatarSrc?<img src={avatarSrc} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>:<DefaultAvatar size={96}/>}</div>
            <button onClick={function(){if(fileRef.current)fileRef.current.click();}} style={{position:"absolute",bottom:2,right:2,width:28,height:28,borderRadius:"50%",background:"#1e1e1e",border:"2px solid white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📷</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(e){if(e.target.files&&e.target.files[0])loadFile(e.target.files[0]);}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"이름",val:name,set:setName,ph:"이름을 입력하세요"},{label:"한 줄 소개",val:bio,set:setBio,ph:"나를 한 줄로 표현해보세요"},{label:"학습 목표",val:goal,set:setGoal,ph:"오늘의 목표를 적어보세요"}].map(function(item){return <div key={item.label}><label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:4}}>{item.label}</label><input value={item.val} onChange={function(e){item.set(e.target.value);}} placeholder={item.ph} style={inputStyle}/></div>;}) }
        </div>
        <div style={{display:"flex",gap:10,marginTop:24}}><button onClick={onClose} style={{flex:1,padding:"11px",border:"1px solid #e2e8f0",borderRadius:12,background:"white",fontSize:14,cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>취소</button><button onClick={function(){onSave({name:name.trim()||"학습자",avatarSrc:avatarSrc,bio:bio,goal:goal});onClose();}} style={{flex:2,padding:"11px",border:"none",borderRadius:12,background:"#a05070",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>저장하기 ✓</button></div>
        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #f0e8ec",display:"flex",justifyContent:"space-between",alignItems:"center"}}><button onClick={onLogout} style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>로그아웃</button><WithdrawButton onWithdraw={onWithdraw}/></div>
      </div>
    </div>
  );
}

function Confetti(){const pieces=Array.from({length:40},function(_,i){return {id:i,x:Math.random()*100,delay:Math.random()*1.2,dur:1.4+Math.random()*0.8,size:6+Math.random()*6,color:["#a05070","#ec4899","#f59e0b","#22c55e","#3b82f6"][Math.floor(Math.random()*5)]};});return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:2000,overflow:"hidden"}}><style>{`@keyframes cffall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>{pieces.map(function(p){return <div key={p.id} style={{position:"absolute",left:p.x+"%",top:0,width:p.size,height:p.size,borderRadius:3,background:p.color,animation:"cffall "+p.dur+"s "+p.delay+"s ease-in forwards"}}/>;})}</div>);}

// ── Profile Page ──
function ProfilePage({viewUser,myProfile,posts,follows,onFollow,onBack,darkMode,myStats,myXP,onEditProfile,allBadges}){
  const th=getTheme("default",darkMode||false);
const [otherXP,setOtherXP]=useState(0);
const [otherStats,setOtherStats]=useState(null);
const viewKey=viewUser.id||viewUser.name;
const myKey=myProfile.id||myProfile.name;
const isMe=viewKey===myKey;
const userPosts=posts.filter(function(p){return (p.authorId||p.author)===viewKey;});
const myName=myProfile.name;
const myFollows=(follows[myKey])||[];
const following=myFollows.includes(viewKey);
const theirFollows=(follows[viewKey])||[];
const mutual=following&&theirFollows.includes(myKey);
const followerCount=Object.keys(follows).filter(function(k){return (follows[k]||[]).includes(viewKey);}).length;
const followingCount=theirFollows.length;
  const [selPost,setSelPost]=useState(null);
  const cardBg=darkMode?"#1e1e2e":"white";
  const borderCol=darkMode?"#2d2d4e":th.border;
  const textMain=darkMode?"#e2e8f0":th.text;
  const textSub=darkMode?"#94a3b8":"#64748b";
const displayXP=isMe?myXP:otherXP;
const lvl=getLvl(displayXP);
const rank=getRank(displayXP);
  const earnedBadges=isMe?(allBadges||[]).filter(function(b){return b.req(Object.assign({},myStats,{xp:myXP,level:lvl&&lvl.level}));}):[];
useEffect(function(){
  if(isMe)return;
  const key=viewUser.id||viewUser.name;
  supabase.from('user_stats').select('xp,stats_data').eq('id',key).then(function(res){
    if(res.data&&res.data.length>0){
      setOtherXP(res.data[0].xp||0);
      setOtherStats(res.data[0].stats_data||null);
    }
  });
},[viewUser.id,viewUser.name]);
  return(
    <div style={{minHeight:"100vh",background:darkMode?"#0f0f1a":"#f4f6fb"}}>
      <div style={{background:darkMode?"rgba(15,15,26,0.95)":"rgba(255,255,255,0.95)",borderBottom:"1px solid "+borderCol,padding:"0 20px",height:52,display:"flex",alignItems:"center",gap:14,position:"sticky",top:60,zIndex:50,backdropFilter:"blur(8px)"}}><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:textMain,padding:"4px 8px",display:"flex",alignItems:"center",gap:6}}>← <span style={{fontSize:14,fontWeight:600}}>{viewUser.name}</span></button></div>
      <div style={{maxWidth:640,margin:"0 auto",padding:"0 0 60px"}}>
        <div style={{background:cardBg,padding:"24px 20px 20px",borderRadius:20,margin:"12px 16px",border:"1px solid "+borderCol,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div style={{width:80,height:80,borderRadius:"50%",border:"3px solid "+th.border,overflow:"hidden",background:th.pl,flexShrink:0}}>{viewUser.avatarSrc?<img src={viewUser.avatarSrc} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,background:th.pl}}>👤</div>}</div>
            <div style={{display:"flex",gap:8,marginTop:4}}>{isMe?<button onClick={onEditProfile} style={{padding:"7px 20px",borderRadius:10,border:"1.5px solid "+borderCol,background:darkMode?"#16213e":"#f8fafc",color:textMain,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>프로필 편집</button>:<button onClick={function(){onFollow(viewKey);}}style={{padding:"7px 20px",borderRadius:10,border:"1.5px solid "+(following?borderCol:th.p),background:following?"none":th.p,color:following?textSub:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{mutual?"맞팔 ✓":following?"팔로잉":"팔로우"}</button>}</div>
          </div>
          <div style={{fontSize:18,fontWeight:800,color:textMain,marginBottom:2}}>{viewUser.name}</div>
{rank&&<div style={{fontSize:12,color:th.p,fontWeight:600,marginBottom:6}}>{rank.icon} Lv.{lvl.level} {rank.name} · {displayXP} XP</div>}
          {viewUser.bio&&<p style={{fontSize:13,color:textSub,margin:"0 0 4px",lineHeight:1.6}}>{viewUser.bio}</p>}
          {viewUser.goal&&<p style={{fontSize:12,color:th.p,margin:"0 0 14px"}}>🎯 {viewUser.goal}</p>}
          <div style={{display:"flex",gap:10,marginTop:viewUser.bio||viewUser.goal?8:14}}>
            {[["게시물",userPosts.length],["팔로워",followerCount],["팔로잉",followingCount]].map(function(item,i){return(<div key={i} style={{flex:1,textAlign:"center",background:darkMode?"#16213e":th.pl,borderRadius:14,padding:"12px 8px",border:"1px solid "+borderCol}}><div style={{fontSize:18,fontWeight:800,color:textMain}}>{item[1]}</div><div style={{fontSize:11,color:textSub,marginTop:2}}>{item[0]}</div></div>);}) }
          </div>
        </div>
        {isMe&&(<div style={{background:cardBg,margin:"0 16px 12px",padding:"16px 20px",borderRadius:20,border:"1px solid "+borderCol,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:13,fontWeight:700,color:textMain,marginBottom:12}}>📊 나의 활동</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>{[{icon:"🔥",label:"연속",val:myStats.streak+"일"},{icon:"🎯",label:"퀘스트",val:myStats.questsDone+"회"},{icon:"⏱️",label:"학습",val:fmtMin(Math.round(myStats.studySecs/60))},{icon:"📝",label:"노트",val:myStats.entries+"개"}].map(function(s,i){return <div key={i} style={{background:darkMode?"#16213e":th.pl,borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1px solid "+borderCol}}><div style={{fontSize:18}}>{s.icon}</div><div style={{fontSize:10,color:textSub}}>{s.label}</div><div style={{fontSize:14,fontWeight:800,color:th.p}}>{s.val}</div></div>;}) }</div>
          {earnedBadges.length>0&&(<div><div style={{fontSize:12,color:textSub,marginBottom:8}}>획득한 배지 {earnedBadges.length}개</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{earnedBadges.map(function(b){return <span key={b.id} title={b.label} style={{fontSize:20}}>{b.emoji}</span>;}) }</div></div>)}
        </div>)}
        <div style={{background:cardBg,margin:"0 16px 16px",borderRadius:20,border:"1px solid "+borderCol,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",overflow:"hidden",padding:"16px 0"}}>
          <div style={{fontSize:13,fontWeight:700,color:textMain,padding:"0 20px",marginBottom:12}}>게시물</div>
          {userPosts.length===0&&(<div style={{textAlign:"center",padding:"40px 20px",color:textSub}}><div style={{fontSize:13}}>아직 게시물이 없어요</div></div>)}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
            {userPosts.map(function(post){return(<div key={post.id} onClick={function(){setSelPost(post);}} style={{aspectRatio:"1",cursor:"pointer",position:"relative",overflow:"hidden",background:th.pl}}>{post.image?<img src={post.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:10}}><span style={{fontSize:24}}>{post.quests&&post.quests.length>0?"🎯":"💬"}</span><span style={{fontSize:10,color:th.p,fontWeight:600,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"90%"}}>{post.quests&&post.quests.length>0?post.quests[0].label:post.comment&&post.comment.slice(0,30)}</span></div>}<div style={{position:"absolute",bottom:4,right:6}}><span style={{fontSize:10,color:"white",textShadow:"0 1px 3px rgba(0,0,0,0.8)",fontWeight:600}}>❤️ {post.likes.length}</span></div></div>);}) }
          </div>
        </div>
      </div>
      {selPost&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={function(){setSelPost(null);}}><div onClick={function(e){e.stopPropagation();}} style={{background:cardBg,borderRadius:20,width:440,maxWidth:"94vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.35)"}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid "+borderCol}}><div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",border:"2px solid "+th.border}}>{selPost.avatarSrc?<img src={selPost.avatarSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{fontSize:18,textAlign:"center",lineHeight:"36px"}}>👤</div>}</div><span style={{fontSize:14,fontWeight:700,color:textMain,flex:1}}>{selPost.author}</span><button onClick={function(){setSelPost(null);}} style={{background:"none",border:"none",cursor:"pointer",color:textSub,fontSize:18}}>✕</button></div>{selPost.image&&<img src={selPost.image} alt="" style={{width:"100%",maxHeight:380,objectFit:"cover",display:"block"}}/>}<div style={{padding:"14px 16px"}}>{selPost.quests&&selPost.quests.length>0&&<div style={{background:darkMode?"#16213e":th.pl,borderRadius:10,padding:"10px 12px",marginBottom:10,border:"1px solid "+borderCol}}>{selPost.quests.map(function(q,i){return <div key={i} style={{fontSize:13,fontWeight:700,color:th.p}}>{q.label} <span style={{fontSize:11,color:textSub}}>+{q.xp}XP</span></div>;}) }</div>}{selPost.comment&&<p style={{fontSize:14,color:textMain,margin:"0 0 10px",lineHeight:1.7}}>{selPost.comment}</p>}<div style={{fontSize:11,color:textSub}}>{new Date(selPost.timestamp).toLocaleDateString("ko-KR")}</div></div></div></div>)}
    </div>
  );
}

function CommentSection({postId,postAuthor,postAuthorId,myName,myId,myAvatar,darkMode,th}){
  const [comments,setComments]=useState([]);
  const [showAll,setShowAll]=useState(false);
  const [text,setText]=useState("");
  const [loaded,setLoaded]=useState(false);

  useEffect(function(){
    supabase.from('comments').select('id,comment_data').eq('post_id',postId).order('id',{ascending:true}).then(function(res){
      if(res.data){
        setComments(res.data.map(function(row){return Object.assign({},row.comment_data,{dbId:row.id});}));
      }
      setLoaded(true);
    });
  },[postId]);

  const submitComment=function(){
    if(!text.trim())return;
    const c={author:myName,authorId:myId,avatarSrc:myAvatar,text:text.trim(),timestamp:Date.now()};
    supabase.from('comments').insert([{post_id:postId,comment_data:c}]).select().then(function(res){
      if(res.data&&res.data[0]){
        setComments(comments.concat([Object.assign({},c,{dbId:res.data[0].id})]));
      }
    });
if(postAuthorId&&postAuthorId!==myId){
  supabase.from('notifications').insert([{recipient:postAuthorId,notif_data:{type:'comment',fromUser:myName,fromAvatar:myAvatar,postId:postId,text:text.trim(),timestamp:Date.now()}}]).then();
}
    setText("");
  };

  const deleteComment=function(dbId){
    setComments(comments.filter(function(c){return c.dbId!==dbId;}));
    supabase.from('comments').delete().eq('id',dbId).then();
  };

  const visible=showAll?comments:comments.slice(-2);
  const textSub=darkMode?"#94a3b8":"#64748b";
  const borderCol=darkMode?"#2d2d4e":th.pb;
  const textMain=darkMode?"#e2e8f0":th.pt;

  return(
<div style={{padding:"0 16px 14px",borderTop:comments.length>0?"1px solid "+borderCol:"none"}}>
      {comments.length>2&&!showAll&&(
        <div onClick={function(){setShowAll(true);}} style={{fontSize:12,color:textSub,cursor:"pointer",padding:"8px 0 4px"}}>댓글 {comments.length}개 모두 보기</div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:8}}>
        {visible.map(function(c){
          return(
            <div key={c.dbId} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:th.pl,overflow:"hidden",flexShrink:0}}>
                {c.avatarSrc?<img src={c.avatarSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>👤</div>}
              </div>
              <div style={{flex:1}}>
                <span style={{fontSize:12.5,fontWeight:700,color:textMain,marginRight:6}}>{c.author}</span>
                <span style={{fontSize:12.5,color:textMain}}>{c.text}</span>
              </div>
              {(c.authorId?c.authorId===myId:c.author===myName)&&<button onClick={function(){deleteComment(c.dbId);}} style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:12,padding:0}}>🗑</button>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
        <input value={text} onChange={function(e){setText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")submitComment();}} placeholder="댓글 달기..." style={{flex:1,padding:"7px 10px",border:"1px solid "+borderCol,borderRadius:20,fontSize:12.5,fontFamily:"inherit",outline:"none",background:darkMode?"#16213e":"#f8fafc",color:textMain}}/>
        <button onClick={submitComment} disabled={!text.trim()} style={{background:"none",border:"none",cursor:text.trim()?"pointer":"default",color:text.trim()?th.p:"#cbd5e1",fontSize:12.5,fontWeight:700,fontFamily:"inherit"}}>게시</button>
      </div>
    </div>
  );
}
function NotificationBell({myName,myId,darkMode,th,onViewProfile,onOpenPost}){
  const recipientKeys=[myId,myName].filter(Boolean);
  const [notifs,setNotifs]=useState([]);
  const [open,setOpen]=useState(false);
  const unreadCount=notifs.filter(function(n){return !n.is_read;}).length;

const loadNotifs=function(){
    if(recipientKeys.length===0)return;
    supabase.from('notifications').select('id,notif_data,is_read').in('recipient',recipientKeys).order('id',{ascending:false}).limit(30).then(function(res){
      if(res.data)setNotifs(res.data);
    });
  };

  useEffect(function(){
    loadNotifs();
    const iv=setInterval(loadNotifs,15000);
    return function(){clearInterval(iv);};
},[myId]);

  const openBell=function(){
    setOpen(function(o){return !o;});
    if(!open&&unreadCount>0){
      const ids=notifs.filter(function(n){return !n.is_read;}).map(function(n){return n.id;});
      supabase.from('notifications').update({is_read:true}).in('id',ids).then();
      setNotifs(notifs.map(function(n){return Object.assign({},n,{is_read:true});}));
    }
  };

  const timeAgo=function(ts){
    const diff=Math.floor((Date.now()-ts)/1000);
    if(diff<60)return "방금 전";
    if(diff<3600)return Math.floor(diff/60)+"분 전";
    if(diff<86400)return Math.floor(diff/3600)+"시간 전";
    return Math.floor(diff/86400)+"일 전";
  };

  const msgFor=function(n){
    const d=n.notif_data;
    if(d.type==="like")return d.fromUser+"님이 회원님의 게시물을 좋아합니다";
    if(d.type==="comment")return d.fromUser+"님이 댓글을 남겼습니다: "+(d.text||"");
    if(d.type==="feedback_applied")return "관리자가 회원님의 피드백을 적용했습니다 🎉";
    return "새 알림";
  };

  return(
    <div style={{position:"relative"}}>
      <button onClick={openBell} title="알림" style={{width:36,height:36,borderRadius:10,border:"1.5px solid "+(darkMode?"#2d2d4e":"#e2e8f0"),background:darkMode?"#1e1e2e":"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        🔔
        {unreadCount>0&&<span style={{position:"absolute",top:-2,right:-2,background:"#ef4444",color:"white",fontSize:9,fontWeight:700,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{unreadCount>9?"9+":unreadCount}</span>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:44,right:0,width:320,maxHeight:400,overflowY:"auto",background:darkMode?"#1e1e2e":"white",border:"1px solid "+(darkMode?"#2d2d4e":"#e2e8f0"),borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",zIndex:200}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+(darkMode?"#2d2d4e":"#f1f5f9"),fontSize:13,fontWeight:700,color:darkMode?"#e2e8f0":"#1e293b"}}>알림</div>
          {notifs.length===0&&<div style={{padding:20,textAlign:"center",fontSize:12,color:"#94a3b8"}}>알림이 없어요</div>}
          {notifs.map(function(n){
            return(
              <div key={n.id} onClick={function(){setOpen(false);if(n.notif_data.type==="feedback_applied"){return;}if(onOpenPost)onOpenPost(n.notif_data.postId);}} style={{padding:"10px 16px",borderBottom:"1px solid "+(darkMode?"#2d2d4e":"#f8fafc"),cursor:"pointer",background:n.is_read?"transparent":(darkMode?"#16213e":"#fdf5f8")}}>
                <div style={{fontSize:12.5,color:darkMode?"#e2e8f0":"#334155",lineHeight:1.5}}>{msgFor(n)}</div>
                <div style={{fontSize:10.5,color:"#94a3b8",marginTop:3}}>{timeAgo(n.notif_data.timestamp)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ── Community Page ──
function CommunityPage({profile,quests,xp,darkMode,onViewProfile}){
  const th=getTheme("default",darkMode||false);
  const [posts,setPosts]=useState(function(){return loadLS("bm_community",[]);});
  const [follows,setFollows]=useState(function(){return loadLS("bm_follows",{});});
  const [showPostModal,setShowPostModal]=useState(false);
const [editingPost,setEditingPost]=useState(null);
  const [selQuests,setSelQuests]=useState([]);
  const [comment,setComment]=useState("");
  const [postImg,setPostImg]=useState(null);
  const fileRef=useRef(null);

  // Sync posts when profile changes
  const freshPosts=loadLS("bm_community",[]);
  const freshFollows=loadLS("bm_follows",{});

  const savePosts=function(p){setPosts(p);try{localStorage.setItem("bm_community",JSON.stringify(p));}catch{}};
  const saveFollows=function(f){setFollows(f);try{localStorage.setItem("bm_follows",JSON.stringify(f));}catch{}};
useEffect(function(){
  supabase.from('posts').select('id,post_data').order('id',{ascending:false}).then(function(res){
    if(res.data){
      const loaded=res.data.map(function(row){return Object.assign({},row.post_data,{dbId:row.id});});
      setPosts(loaded);
      try{localStorage.setItem("bm_community",JSON.stringify(loaded));}catch{}
    }
  });
},[]);
useEffect(function(){
  supabase.from('follows').select('follower,following').then(function(res){
    if(res.data){
      const grouped={};
      res.data.forEach(function(row){
        if(!grouped[row.follower])grouped[row.follower]=[];
        grouped[row.follower].push(row.following);
      });
      setFollows(grouped);
      try{localStorage.setItem("bm_follows",JSON.stringify(grouped));}catch{}
    }
  });
},[]);

const myName=profile.name;
const myKey=profile.id||myName;
const myFollows=(freshFollows[myKey])||(freshFollows[myName])||[];
const isFollowing=function(key){return myFollows.includes(key);};
const isMutual=function(key){
  const theirFollows=freshFollows[key]||[];
  return isFollowing(key)&&(theirFollows.includes(myKey)||theirFollows.includes(myName));
};
const toggleFollow=function(key){
  if(key===myKey||key===myName)return;
  const cur=(freshFollows[myKey])||(freshFollows[myName])||[];
  const isFollowingNow=cur.includes(key);
  const updated=isFollowingNow?cur.filter(function(n){return n!==key;}):cur.concat([key]);
  const newF=Object.assign({},freshFollows);
  newF[myKey]=updated;
  saveFollows(newF);
  if(isFollowingNow){
    supabase.from('follows').delete().eq('follower',myKey).eq('following',key).then();
  }else{
    supabase.from('follows').insert([{follower:myKey,following:key}]).then();
  }
};

  const loadImage=function(file){
    if(!file||!file.type.startsWith("image/"))return;
    const reader=new FileReader();
    reader.onload=function(e){setPostImg(e.target.result);};
    reader.readAsDataURL(file);
  };

  const toggleQuestSel=function(q){
    const exists=selQuests.some(function(s){return s.id===q.id;});
    if(exists) setSelQuests(selQuests.filter(function(s){return s.id!==q.id;}));
    else setSelQuests(selQuests.concat([q]));
  };

const submitPost=function(){
  if(!comment.trim()&&!postImg&&selQuests.length===0)return;
  if(editingPost){
    const updatedPost=Object.assign({},editingPost,{
      comment:comment.trim(),
      image:postImg,
    });
    const updatedList=freshPosts.map(function(p){return p.id===editingPost.id?updatedPost:p;});
    savePosts(updatedList);
    setShowPostModal(false);setSelQuests([]);setComment("");setPostImg(null);setEditingPost(null);
supabase.from('posts').update({ post_data: updatedPost }).eq('id',editingPost.dbId).then();
  }
const newPost={
  id:Date.now(),
  author:myName,
  authorId:profile.id,
  avatarSrc:profile.avatarSrc,
    quests:selQuests.map(function(q){return {label:q.label,xp:q.baseXp,status:q.done?"done":"in-progress",pct:q.secs!==null&&!q.done?Math.round(((q.userMin*60-q.secs)/(q.userMin*60))*100):q.done?100:0};}),
    comment:comment.trim(),
    image:postImg,
    likes:[],
    timestamp:Date.now(),
  };
  savePosts([newPost].concat(freshPosts));
  setShowPostModal(false);setSelQuests([]);setComment("");setPostImg(null);
  supabase.from('posts').insert([{ post_data: newPost }]).then();
};
const toggleLike=function(postId,dbId){
  const myId=profile.id||myName;
  const current=loadLS("bm_community",[]);
  let targetPost=null;
  let becameLiked=false;
  const updated=current.map(function(p){
    if(p.id!==postId)return p;
    targetPost=p;
    const liked=p.likes.includes(myId)||p.likes.includes(myName);
    becameLiked=!liked;
    return Object.assign({},p,{likes:liked?p.likes.filter(function(n){return n!==myId&&n!==myName;}):p.likes.concat([myId])});
  });
  savePosts(updated);
  supabase.from('posts').update({post_data:updated.find(function(p){return p.id===postId;})}).eq('id',dbId).then();
if(becameLiked&&targetPost&&(targetPost.authorId?targetPost.authorId!==profile.id:targetPost.author!==myName)){
  supabase.from('notifications').insert([{recipient:targetPost.authorId||targetPost.author,notif_data:{type:'like',fromUser:myName,timestamp:Date.now()}}]).then();
}
};

const deletePost=function(postId,dbId){
  const updated=freshPosts.filter(function(p){return p.id!==postId;});
  savePosts(updated);
  supabase.from('posts').delete().eq('id',dbId).then();
};

  const timeAgo=function(ts){
    const diff=Math.floor((Date.now()-ts)/1000);
    if(diff<60)return "방금 전";
    if(diff<3600)return Math.floor(diff/60)+"분 전";
    if(diff<86400)return Math.floor(diff/3600)+"시간 전";
    return Math.floor(diff/86400)+"일 전";
  };

  const displayPosts=freshPosts;
  const cardBg=darkMode?"#1e1e2e":"white";
  const borderCol=darkMode?"#2d2d4e":th.pb;
  const textMain=darkMode?"#e2e8f0":th.pt;
  const textSub=darkMode?"#94a3b8":"#64748b";

  return(
    <div style={{maxWidth:600,margin:"0 auto",padding:"24px 20px 60px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:textMain,margin:0}}>🌐 커뮤니티</h2>
          <p style={{fontSize:13,color:textSub,margin:"4px 0 0"}}>퀘스트와 일상을 공유하고 서로 응원해요!</p>
        </div>
        <button onClick={()=>setShowPostModal(true)} style={{background:th.p,color:"white",border:"none",borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ 게시하기</button>
      </div>

      {/* Post modal */}
      {showPostModal&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setShowPostModal(false);setEditingPost(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{background:cardBg,borderRadius:20,padding:"24px 28px",width:460,maxWidth:"94vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:17,fontWeight:800,color:textMain,marginBottom:18}}>📸 게시물 만들기</div>

            {/* Image upload */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:textSub,marginBottom:8}}>사진 첨부 (선택)</div>
              {postImg?(
                <div style={{position:"relative",borderRadius:14,overflow:"hidden",background:"#000",marginBottom:8}}>
                  <img src={postImg} alt="post" style={{width:"100%",maxHeight:300,objectFit:"cover",display:"block"}}/>
                  <button onClick={()=>setPostImg(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"white",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
              ):(
                <button onClick={()=>{if(fileRef.current)fileRef.current.click();}} style={{width:"100%",padding:"16px",border:"2px dashed "+borderCol,borderRadius:12,background:darkMode?"#16213e":th.pl,cursor:"pointer",color:textSub,fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span style={{fontSize:22}}>🖼️</span>
                  <span>갤러리에서 사진 선택</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files&&e.target.files[0])loadImage(e.target.files[0]);}}/>
            </div>

            {/* Quest multi-select */}
            <div style={{fontSize:12,fontWeight:600,color:textSub,marginBottom:8}}>퀘스트 연결 <span style={{color:th.p,fontWeight:700}}>(중복 선택 가능)</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14,maxHeight:180,overflowY:"auto"}}>
              {quests.length===0&&<div style={{fontSize:13,color:textSub,textAlign:"center",padding:16}}>대시보드에서 퀘스트를 추가해보세요</div>}
              {quests.map(function(q){
                const active=selQuests.some(function(s){return s.id===q.id;});
                return(
                  <button key={q.id} onClick={()=>toggleQuestSel(q)} style={{textAlign:"left",padding:"9px 12px",borderRadius:10,border:"2px solid "+(active?th.p:borderCol),background:active?th.pl:(darkMode?"#16213e":"#f8fafc"),cursor:"pointer",fontFamily:"inherit",position:"relative"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {active&&<span style={{width:18,height:18,borderRadius:"50%",background:th.p,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",flexShrink:0}}>✓</span>}
                      <span style={{fontSize:13,fontWeight:600,color:active?th.p:textMain,flex:1}}>{q.label}</span>
                      <span style={{fontSize:10,background:q.done?"#dcfce7":"#fef9c3",color:q.done?"#166534":"#854d0e",padding:"2px 7px",borderRadius:20,fontWeight:600}}>{q.done?"✓ 완료":q.secs!==null?"진행중":"미시작"}</span>
                    </div>
                    <div style={{fontSize:11,color:textSub,marginTop:2,marginLeft:active?26:0}}>+{q.baseXp} XP · {q.userMin}분</div>
                  </button>
                );
              })}
            </div>
            {selQuests.length>0&&<div style={{fontSize:12,color:th.p,fontWeight:600,marginBottom:10}}>{selQuests.length}개 선택됨: {selQuests.map(function(q){return q.label;}).join(", ")}</div>}

            {/* Comment */}
            <div style={{fontSize:12,fontWeight:600,color:textSub,marginBottom:6}}>내용</div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="오늘의 학습이나 일상을 공유해보세요! 😊"
              style={{width:"100%",padding:"10px 12px",border:"1.5px solid "+borderCol,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:darkMode?"#16213e":"white",color:textMain,boxSizing:"border-box",marginBottom:16,resize:"vertical",minHeight:80}}/>

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setShowPostModal(false);setPostImg(null);setSelQuests([]);setComment("");}} style={{flex:1,padding:"11px",border:"1px solid "+borderCol,borderRadius:12,background:"none",fontSize:14,cursor:"pointer",color:textSub,fontFamily:"inherit"}}>취소</button>
              <button onClick={submitPost} disabled={!comment.trim()&&!postImg&&selQuests.length===0} style={{flex:2,padding:"11px",border:"none",borderRadius:12,background:(comment.trim()||postImg||selQuests.length>0)?th.p:"#e2e8f0",color:(comment.trim()||postImg||selQuests.length>0)?"white":"#94a3b8",fontSize:14,fontWeight:700,cursor:(comment.trim()||postImg||selQuests.length>0)?"pointer":"not-allowed",fontFamily:"inherit"}}>공유하기 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {displayPosts.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:textSub}}>
          <button onClick={()=>setShowPostModal(true)} style={{width:56,height:56,borderRadius:"50%",background:th.p,border:"none",color:"white",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>+</button>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6,color:textMain}}>아직 게시물이 없어요</div>
          <div style={{fontSize:13}}>첫 게시물을 올려보세요!</div>
        </div>
      )}
      {displayPosts.map(function(post){
const liked=post.likes.includes(profile.id)||post.likes.includes(myName);
const isOwn=post.authorId?post.authorId===profile.id:post.author===myName;
const following=isFollowing(post.authorId||post.author);
const mutual=isMutual(post.authorId||post.author);
        return(
          <div key={post.id} style={{background:cardBg,borderRadius:18,marginBottom:16,border:"1px solid "+borderCol,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px 10px"}}>
              <div onClick={()=>onViewProfile&&onViewProfile({name:post.author,id:post.authorId,avatarSrc:post.avatarSrc,bio:"",goal:""})} style={{width:40,height:40,borderRadius:"50%",background:th.pl,border:"2px solid "+th.pb,overflow:"hidden",flexShrink:0,cursor:"pointer"}}>
                {post.avatarSrc?<img src={post.avatarSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span onClick={()=>onViewProfile&&onViewProfile({name:post.author,id:post.authorId,avatarSrc:post.avatarSrc,bio:"",goal:""})} style={{fontSize:14,fontWeight:700,color:textMain,cursor:"pointer"}}>{post.author}</span>
{mutual&&<span style={{fontSize:9,background:th.p,color:"white",padding:"2px 6px",borderRadius:20,fontWeight:700}}>맞팔</span>}
                  {!mutual&&following&&<span style={{fontSize:9,background:th.pl,color:th.p,padding:"2px 6px",borderRadius:20,fontWeight:600,border:"1px solid "+th.pb}}>팔로잉</span>}
                </div>
                <div style={{fontSize:11,color:textSub}}>{timeAgo(post.timestamp)}</div>
              </div>
              {!isOwn&&(
                <button onClick={()=>toggleFollow(post.authorId||post.author)}style={{fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:20,border:"1.5px solid "+(following?borderCol:th.p),background:following?(darkMode?"#16213e":"#f8fafc"):"none",color:following?textSub:th.p,cursor:"pointer",fontFamily:"inherit"}}>
                  {mutual?"맞팔 ✓":following?"팔로잉":"팔로우"}
                </button>
              )}
{isOwn&&<button onClick={()=>{setEditingPost(post);setComment(post.comment||"");setShowPostModal(true);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:"0 2px"}}>✎</button>}
{isOwn&&<button onClick={()=>deletePost(post.id,post.dbId)}style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:16,padding:"0 2px"}}>🗑</button>}
            </div>

            {post.image&&(
              <div style={{background:"#000",maxHeight:400,overflow:"hidden"}}>
                <img src={post.image} alt="post" style={{width:"100%",maxHeight:400,objectFit:"cover",display:"block"}}/>
              </div>
            )}

            {post.quests&&post.quests.length>0&&(
              <div style={{margin:"0 14px 10px",display:"flex",flexDirection:"column",gap:6}}>
                {post.quests.map(function(q,qi){
                  return(
                    <div key={qi} style={{background:darkMode?"#16213e":th.pl,borderRadius:12,padding:"10px 14px",border:"1px solid "+borderCol}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:q.status==="in-progress"&&q.pct>0?5:0}}>
                        <span style={{fontSize:13,fontWeight:700,color:th.p}}>{q.label}</span>
                        <span style={{fontSize:10,background:q.status==="done"?"#dcfce7":"#fef9c3",color:q.status==="done"?"#166534":"#854d0e",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{q.status==="done"?"✓ 완료":"⏱ 진행중"}</span>
                      </div>
                      {q.status==="in-progress"&&q.pct>0&&(
                        <div>
                          <div style={{height:5,background:darkMode?"#2d2d4e":th.pb,borderRadius:9999,overflow:"hidden"}}>
                            <div style={{width:q.pct+"%",height:"100%",background:th.p,borderRadius:9999}}/>
                          </div>
                          <div style={{fontSize:11,color:textSub,marginTop:2}}>{q.pct}% · +{q.xp} XP</div>
                        </div>
                      )}
                      {q.status==="done"&&<div style={{fontSize:11,color:textSub}}>+{q.xp} XP 획득!</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {post.comment&&<p style={{fontSize:14,color:textMain,margin:"0 16px 10px",lineHeight:1.65}}>{post.comment}</p>}

            <div style={{display:"flex",alignItems:"center",gap:16,padding:"10px 16px 14px",borderTop:"1px solid "+borderCol}}>
<button onClick={()=>toggleLike(post.id,post.dbId)}style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>
                <span style={{fontSize:20,transition:"transform 0.15s",transform:liked?"scale(1.2)":"scale(1)"}}>{liked?"❤️":"🤍"}</span>
                <span style={{fontSize:13,fontWeight:600,color:liked?th.p:textSub}}>{post.likes.length}</span>
              </button>
              <span style={{fontSize:12,color:textSub}}>{post.likes.length>0?post.likes.slice(0,2).join(", ")+(post.likes.length>2?" 외 "+(post.likes.length-2)+"명":"")+" 이 좋아해요":"가장 먼저 좋아요를 눌러보세요!"}</span>
<CommentSection postId={post.id} postAuthor={post.author} postAuthorId={post.authorId} myName={myName} myId={profile.id} myAvatar={profile.avatarSrc} darkMode={darkMode} th={th}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Review Page ──
function ReviewPage({profile,darkMode}){
  const th=getTheme("default",darkMode||false);
  const cardBg=darkMode?"#1e1e2e":"white";
  const borderCol=darkMode?"#2d2d4e":th.border;
  const textMain=darkMode?"#e2e8f0":th.text;
  const textSub=darkMode?"#94a3b8":"#64748b";
  const pageBg=darkMode?"#0f0f1a":"#f4f6fb";

  const [reviews,setReviews]=useState(function(){return loadLS("bm_reviews",[]);});
  const [showForm,setShowForm]=useState(false);
  const [stars,setStars]=useState(0);
  const [hoverStar,setHoverStar]=useState(0);
  const [liked,setLiked]=useState("");
  const [disliked,setDisliked]=useState("");
  const [suggest,setSuggest]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const myName=profile.name;
  const alreadyReviewed=reviews.some(function(r){return r.author===myName;});

  const GOOD_TAGS=["퀘스트 시스템","XP 보상","UI 디자인","노트 기능","캘린더","배지 컬렉션","커뮤니티","스킨 테마","AI 가이드","사용이 쉬움"];
  const BAD_TAGS=["버그 있음","속도 느림","기능 부족","UI 복잡","데이터 손실","알림 없음","모바일 불편","퀘스트 단조로움"];
  const [selGood,setSelGood]=useState([]);
  const [selBad,setSelBad]=useState([]);

  const toggleTag=function(arr,setArr,tag){setArr(arr.includes(tag)?arr.filter(function(t){return t!==tag;}):arr.concat([tag]));};

  const saveReviews=function(r){setReviews(r);try{localStorage.setItem("bm_reviews",JSON.stringify(r));}catch{}};
useEffect(function(){
  supabase.from('reviews').select('id,review_data').order('id',{ascending:false}).then(function(res){
    if(res.data){
      const loaded=res.data.map(function(row){return Object.assign({},row.review_data,{dbId:row.id});});
      setReviews(loaded);
      try{localStorage.setItem("bm_reviews",JSON.stringify(loaded));}catch{}
    }
  });
},[]);

  const submit=function(){
    if(!canSubmit)return;
const r={id:Date.now(),author:myName,authorId:profile.id,avatarSrc:profile.avatarSrc,stars:stars,liked:liked.trim(),disliked:disliked.trim(),suggest:suggest.trim(),goodTags:selGood,badTags:selBad,timestamp:Date.now()};
    saveReviews([r].concat(reviews));
supabase.from('reviews').insert([{ review_data: r }]).then();
    setShowForm(false);setStars(0);setLiked("");setDisliked("");setSuggest("");setSelGood([]);setSelBad([]);
    setSubmitted(true);setTimeout(function(){setSubmitted(false);},3000);
  };

  const avgStars=reviews.length>0?(reviews.reduce(function(a,r){return a+r.stars;},0)/reviews.length).toFixed(1):0;
  const starDist=[5,4,3,2,1].map(function(s){return {s:s,cnt:reviews.filter(function(r){return r.stars===s;}).length};});

  const canSubmit=stars>0||liked.trim()||disliked.trim()||suggest.trim()||selGood.length>0||selBad.length>0;

  const timeAgo=function(ts){const diff=Math.floor((Date.now()-ts)/1000);if(diff<60)return "방금 전";if(diff<3600)return Math.floor(diff/60)+"분 전";if(diff<86400)return Math.floor(diff/3600)+"시간 전";return Math.floor(diff/86400)+"일 전";};
  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px",background:pageBg,minHeight:"100vh"}}>
      {submitted&&<div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:th.p,color:"white",borderRadius:16,padding:"13px 28px",fontSize:14,fontWeight:600,zIndex:500,boxShadow:"0 8px 32px rgba(0,0,0,0.25)"}}>🎉 소중한 피드백 감사해요!</div>}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:textMain,margin:0}}>⭐ 사용자 평가</h2>
          <p style={{fontSize:13,color:textSub,margin:"4px 0 0"}}>D+Puzzle를 사용해보신 소감을 남겨주세요!</p>
        </div>
<button onClick={function(){setShowForm(true);}} style={{background:th.p,color:"white",border:"none",borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✎ 평가 작성</button>
      </div>

      {/* Summary card */}
      <div style={{background:cardBg,borderRadius:20,padding:"20px 24px",marginBottom:20,border:"1px solid "+borderCol,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:52,fontWeight:900,color:th.p,lineHeight:1}}>{avgStars}</div>
            <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(function(i){return <span key={i} style={{fontSize:18,filter:i<=Math.round(Number(avgStars))?"none":"grayscale(1) opacity(0.25)"}}>⭐</span>;})}</div>
            <div style={{fontSize:12,color:textSub,marginTop:4}}>{reviews.length}개의 평가</div>
          </div>
          <div style={{flex:1,minWidth:160}}>
            {starDist.map(function(item){
              const pct=reviews.length>0?Math.round((item.cnt/reviews.length)*100):0;
              return(<div key={item.s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:12,color:textSub,width:16,textAlign:"right"}}>{item.s}</span>
                <span style={{fontSize:10}}>⭐</span>
                <div style={{flex:1,height:8,background:darkMode?"#2d2d4e":"#f1f5f9",borderRadius:9999,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:th.p,borderRadius:9999,transition:"width 0.6s ease"}}/>
                </div>
                <span style={{fontSize:11,color:textSub,width:28,textAlign:"right"}}>{item.cnt}</span>
              </div>);
            })}
          </div>
        </div>
        {/* Most mentioned good tags */}
        {reviews.length>0&&(function(){
          const allGood={};
          reviews.forEach(function(r){(r.goodTags||[]).forEach(function(t){allGood[t]=(allGood[t]||0)+1;});});
          const top=Object.keys(allGood).sort(function(a,b){return allGood[b]-allGood[a];}).slice(0,5);
          if(top.length===0)return null;
          return(<div style={{marginTop:14,paddingTop:14,borderTop:"1px solid "+borderCol}}>
            <div style={{fontSize:11,color:textSub,marginBottom:8}}>👍 많이 언급된 장점</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{top.map(function(t){return <span key={t} style={{fontSize:11,background:th.pl||"#fce8f0",color:th.p,padding:"3px 10px",borderRadius:20,border:"1px solid "+(th.border||"#f0d0e0"),fontWeight:600}}>{t} {allGood[t]}</span>;}) }</div>
          </div>);
        })()}
      </div>

      {/* Write form modal */}
      {showForm&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={function(){setShowForm(false);}}>
          <div onClick={function(e){e.stopPropagation();}} style={{background:cardBg,borderRadius:20,padding:"24px 28px",width:500,maxWidth:"94vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontSize:17,fontWeight:800,color:textMain}}>✎ 평가 작성하기</div>
              <button onClick={function(){setShowForm(false);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:textSub}}>✕</button>
            </div>

            {/* Star rating */}
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:textSub,marginBottom:10}}>전체 만족도</div>
              <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {[1,2,3,4,5].map(function(i){return(
                    <span key={i}
                      style={{fontSize:42,cursor:"pointer",filter:i<=(hoverStar||stars)?"none":"grayscale(1) opacity(0.3)",transition:"filter 0.1s, transform 0.1s",transform:i<=(hoverStar||stars)?"scale(1.15)":"scale(1)",display:"inline-block"}}
                      onMouseEnter={function(){setHoverStar(i);}}
                      onMouseLeave={function(){setHoverStar(0);}}
                      onClick={function(){setStars(i);}}>⭐</span>
                  );})}
                </div>
              {stars>0&&<div style={{marginTop:8,fontSize:13,color:th.p,fontWeight:600}}>{["","별로예요 😔","아쉬워요 😕","보통이에요 😊","좋아요 😄","최고예요 🤩"][stars]}</div>}
            </div>

            {/* Good tags */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:textMain,marginBottom:8}}>👍 좋았던 점 (복수 선택 가능)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {GOOD_TAGS.map(function(tag){const sel=selGood.includes(tag);return(<button key={tag} onClick={function(){toggleTag(selGood,setSelGood,tag);}} style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid "+(sel?th.p:borderCol),background:sel?th.p:"transparent",color:sel?"white":textSub,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{tag}</button>);}) }
              </div>
            </div>

            {/* Bad tags */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:textMain,marginBottom:8}}>👎 아쉬웠던 점 (복수 선택 가능)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {BAD_TAGS.map(function(tag){const sel=selBad.includes(tag);return(<button key={tag} onClick={function(){toggleTag(selBad,setSelBad,tag);}} style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid "+(sel?"#ef4444":borderCol),background:sel?"#ef4444":"transparent",color:sel?"white":textSub,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{tag}</button>);}) }
              </div>
            </div>

            {/* Text areas */}
            {[{label:"💬 자유롭게 좋았던 점",val:liked,set:setLiked,ph:"어떤 점이 특히 좋으셨나요?"},{label:"🔧 개선이 필요한 점",val:disliked,set:setDisliked,ph:"어떤 부분이 아쉬우셨나요?"},{label:"💡 추가 건의사항",val:suggest,set:setSuggest,ph:"있었으면 좋겠다 싶은 기능이나 개선점을 알려주세요!"}].map(function(item){
              return(<div key={item.label} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:textMain,marginBottom:5}}>{item.label}</div>
                <textarea value={item.val} onChange={function(e){item.set(e.target.value);}} placeholder={item.ph} style={{width:"100%",padding:"9px 12px",border:"1.5px solid "+borderCol,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:darkMode?"#16213e":"#f8fafc",color:textMain,boxSizing:"border-box",resize:"vertical",minHeight:64}}/>
              </div>);
            })}

            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button onClick={function(){setShowForm(false);}} style={{flex:1,padding:"11px",border:"1px solid "+borderCol,borderRadius:12,background:"none",fontSize:14,cursor:"pointer",color:textSub,fontFamily:"inherit"}}>취소</button>
              <button onClick={submit} disabled={!canSubmit} style={{flex:2,padding:"11px",border:"none",borderRadius:12,background:canSubmit?th.p:"#e2e8f0",color:canSubmit?"white":"#94a3b8",fontSize:14,fontWeight:700,cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit"}}>평가 제출하기 ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:textSub}}>
          <div style={{fontSize:44,marginBottom:12}}>💬</div>
          <div style={{fontSize:15,fontWeight:600,color:textMain,marginBottom:6}}>아직 평가가 없어요</div>
          <div style={{fontSize:13}}>첫 번째 평가를 남겨주세요!</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {reviews.map(function(r){
          return(
            <div key={r.id} style={{background:cardBg,borderRadius:18,padding:"18px 20px",border:"1px solid "+borderCol,boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:th.pl||"#fce8f0",border:"2px solid "+borderCol,overflow:"hidden",flexShrink:0}}>
                  {r.avatarSrc?<img src={r.avatarSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:textMain}}>{r.author}</div>
                  <div style={{fontSize:11,color:textSub}}>{timeAgo(r.timestamp)}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(function(i){return <span key={i} style={{fontSize:14,filter:i<=r.stars?"none":"grayscale(1) opacity(0.25)"}}>⭐</span>;})}</div>
{(r.authorId?r.authorId===profile.id:r.author===myName)&&<button onClick={function(){saveReviews(reviews.filter(function(rv){return rv.id!==r.id;}));supabase.from('reviews').delete().eq('id',r.dbId).then();}} style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:16,padding:"0 2px",lineHeight:1}} title="삭제">🗑</button>}
{myName===ADMIN_NAME&&(r.authorId?r.authorId!==profile.id:r.author!==myName)&&!r.feedbackApplied&&<button onClick={function(){
  const updated=reviews.map(function(rv){return rv.id===r.id?Object.assign({},rv,{feedbackApplied:true}):rv;});
  saveReviews(updated);
supabase.from('reviews').update({review_data:updated.find(function(rv){return rv.id===r.id;})}).eq('id',r.dbId).then();
  supabase.from('notifications').insert([{recipient:r.authorId||r.author,notif_data:{type:'feedback_applied',timestamp:Date.now()}}]).then();
}} style={{fontSize:11,background:"none",border:"1px solid #86efac",borderRadius:8,padding:"3px 8px",cursor:"pointer",color:"#16a34a",fontFamily:"inherit"}} title="피드백이 적용되었다고 알림 보내기">✓ 피드백 적용됨</button>}
{r.feedbackApplied&&<span style={{fontSize:11,color:"#16a34a",fontWeight:600}}>✓ 적용됨</span>}
                </div>
              </div>
              {(r.goodTags&&r.goodTags.length>0)&&(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{r.goodTags.map(function(t){return <span key={t} style={{fontSize:10,background:th.pl||"#fce8f0",color:th.p,padding:"2px 8px",borderRadius:20,border:"1px solid "+(th.border||"#f0d0e0"),fontWeight:600}}>👍 {t}</span>;}) }</div>)}
              {(r.badTags&&r.badTags.length>0)&&(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{r.badTags.map(function(t){return <span key={t} style={{fontSize:10,background:"#fff1f2",color:"#e11d48",padding:"2px 8px",borderRadius:20,border:"1px solid #fecdd3",fontWeight:600}}>👎 {t}</span>;}) }</div>)}
              {r.liked&&<div style={{fontSize:13,color:textMain,marginBottom:6,lineHeight:1.7}}><span style={{color:th.p,fontWeight:700}}>좋았던 점: </span>{r.liked}</div>}
              {r.disliked&&<div style={{fontSize:13,color:textMain,marginBottom:6,lineHeight:1.7}}><span style={{color:"#ef4444",fontWeight:700}}>아쉬운 점: </span>{r.disliked}</div>}
              {r.suggest&&<div style={{fontSize:13,color:textMain,lineHeight:1.7,padding:"8px 12px",background:darkMode?"#16213e":th.pl||"#fce8f0",borderRadius:10,border:"1px solid "+borderCol}}><span style={{fontWeight:700}}>💡 건의: </span>{r.suggest}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotificationBar({onClose}){
  return(
    <div style={{background:"linear-gradient(90deg,#fce7f3,#f0eee9)",borderBottom:"1px solid #d9d4cc",padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,position:"relative"}}>
      <span style={{fontSize:13,color:"#9d174d"}}>🎉 새로운 등급 <b>'Premium'</b>이 업데이트되었습니다!</span>
      <button style={{fontSize:12,fontWeight:700,color:"#a05070",background:"white",border:"1px solid #c0bab2",borderRadius:20,padding:"2px 12px",cursor:"pointer",fontFamily:"inherit"}}>지금 확인하기</button>
      <button onClick={onClose} style={{position:"absolute",right:16,background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,lineHeight:1}}>✕</button>
    </div>
  );
}

function AuthModal(props){
  const initMode=props.mode||"login",accounts=props.accounts||{},onAuth=props.onAuth,onClose=props.onClose;
  const [mode,setMode]=useState(initMode);
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const validate=function(){
    if(!email.includes("@")||!email.includes("."))return "올바른 이메일 주소를 입력해주세요.";
    if(pw.length<6)return "비밀번호는 최소 6자 이상이어야 합니다.";
    if(mode==="signup"){if(name.trim().length<2)return "이름은 최소 2자 이상이어야 합니다.";if(accounts[email])return "이미 가입된 이메일입니다.";}
    if(mode==="login"){if(!accounts[email])return "등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.";if(accounts[email].pw!==pw)return "비밀번호가 올바르지 않습니다.";}
    return null;
  };
  const submit=function(){
    const e=validate();if(e){setErr(e);return;}
    setLoading(true);
    setTimeout(function(){const res=onAuth({email:email,pw:pw,name:name.trim(),mode:mode});if(res){setErr(res);setLoading(false);}},700);
  };
  const F={width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#f8e6f0"};
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:24,padding:"36px 40px",width:420,maxWidth:"92vw",boxShadow:"0 32px 80px rgba(160,80,112,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-block",background:"#a05070",borderRadius:14,padding:"10px 18px",fontSize:18,fontWeight:900,color:"white",marginBottom:16}}>D+Puzzle</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{mode==="login"?"다시 만나서 반가워요!":"성장을 시작해요 🌱"}</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:6}}>{mode==="login"?"계속하려면 로그인하세요":"무료로 시작, 언제든 취소 가능"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="signup"&&<div><label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>이름</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={F}/></div>}
          <div><label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>이메일</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="hello@example.com" style={F} onKeyDown={e=>{if(e.key==="Enter")submit();}}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>비밀번호</label><input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="6자 이상 입력" style={F} onKeyDown={e=>{if(e.key==="Enter")submit();}}/></div>
        </div>
        {err&&<div style={{marginTop:10,padding:"8px 12px",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:8,fontSize:12,color:"#be123c"}}>{err}</div>}
        <button onClick={submit} style={{width:"100%",marginTop:20,padding:"13px",borderRadius:12,border:"none",background:loading?"#e2e8f0":"#a05070",color:loading?"#94a3b8":"white",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {loading?"처리 중...":(mode==="login"?"로그인":"무료로 시작하기")}
        </button>
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#64748b"}}>
          {mode==="login"?"아직 계정이 없으신가요? ":"이미 계정이 있으신가요? "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("");}} style={{color:"#a05070",fontWeight:700,cursor:"pointer"}}>{mode==="login"?"회원가입":"로그인"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Live Demo Section (auto-playing app simulation) ──
function LiveDemoSection(){
  const TABS=[
    {id:"quest",emoji:"🎯",label:"퀘스트"},
    {id:"note",emoji:"📝",label:"노트"},
    {id:"community",emoji:"🌐",label:"커뮤니티"},
    {id:"review",emoji:"⭐",label:"평가"},
  ];
  const [active,setActive]=useState("quest");

  return(
    <div style={{maxWidth:760,margin:"56px auto 0",padding:"0 20px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"#fce7f3",color:"#a05070",padding:"5px 14px",borderRadius:20,fontSize:11.5,fontWeight:700,marginBottom:14}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",animation:"liveDot 1.4s ease-in-out infinite"}}/>
          실시간 데모 — 실제 작동 화면
        </div>
        <h2 style={{fontSize:24,fontWeight:800,color:"#2d0a1a",marginBottom:8}}>이렇게 자동으로 움직여요</h2>
        <p style={{fontSize:13,color:"#9a7a8a"}}>탭을 눌러 기능별 데모를 확인해보세요</p>
      </div>

      <style>{`
        @keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes demoBurst{0%{transform:scale(0.4);opacity:0}40%{transform:scale(1.15);opacity:1}100%{transform:scale(1.6);opacity:0}}
        @keyframes demoFloat{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-34px);opacity:0}}
        @keyframes demoCheckPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes demoBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes demoSlideIn{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes demoHeartPop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
        @keyframes demoStarPop{0%{transform:scale(0.6) rotate(-15deg);opacity:0}60%{transform:scale(1.25) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
      `}</style>

      {/* Tab selector */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {TABS.map(function(t){
          const isActive=active===t.id;
          return(
            <button key={t.id} onClick={function(){setActive(t.id);}} style={{padding:"8px 16px",borderRadius:20,border:"1.5px solid "+(isActive?"#a05070":"#f0d8e4"),background:isActive?"#a05070":"white",color:isActive?"white":"#a05070",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
              {t.emoji} {t.label}
            </button>
          );
        })}
      </div>

      <div style={{background:"white",borderRadius:20,boxShadow:"0 16px 50px rgba(160,80,112,0.14)",border:"1px solid #f0d8e4",overflow:"hidden"}}>
        <div style={{background:"#faeef4",borderBottom:"1px solid #f0d8e4",padding:"9px 16px",display:"flex",alignItems:"center",gap:6}}>
          {["#ff6b6b","#ffd166","#06d6a0"].map(function(c,i){return <div key={i} style={{width:9,height:9,borderRadius:"50%",background:c,opacity:0.6}}/>;}) }
          <span style={{fontSize:11,color:"#b07090",marginLeft:8}}>D+Puzzle — {TABS.find(function(t){return t.id===active;}).label}</span>
        </div>
        {active==="quest"&&<QuestDemo/>}
        {active==="note"&&<NoteDemo/>}
        {active==="community"&&<CommunityDemo/>}
        {active==="review"&&<ReviewDemoAnim/>}
      </div>
    </div>
  );
}

// ── Shared step-loop hook ──
function useDemoSteps(durations){
  const [step,setStep]=useState(0);
  const [pct,setPct]=useState(0);
  useEffect(function(){
    let raf=null,startTs=null;
    const dur=durations[step];
    function tick(ts){
      if(startTs===null)startTs=ts;
      const elapsed=ts-startTs;
      const p=Math.min(elapsed/dur,1);
      setPct(p*100);
      if(p<1){raf=requestAnimationFrame(tick);}
      else{setStep(function(s){return (s+1)%durations.length;});}
    }
    raf=requestAnimationFrame(tick);
    return function(){if(raf)cancelAnimationFrame(raf);};
  },[step]);
  return [step,pct];
}

// ── Quest Demo ──
function QuestDemo(){
  const DURATIONS=[4200,8200,3400,5200];
  const [step,pct]=useDemoSteps(DURATIONS);
  const [showBurst,setShowBurst]=useState(false);
  useEffect(function(){
    if(step===3){setShowBurst(true);const t=setTimeout(function(){setShowBurst(false);},1400);return function(){clearTimeout(t);};}
  },[step]);
  const questDone=step>=2;
  const xpVal=step<3?240:260;
  const xpPct=step<3?68:82;

  return(
    <div style={{padding:"22px 24px",position:"relative",minHeight:220}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#fce7f3,#fae8ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🌱</div>
          <div><div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>D+Puzzle Lv.3</div><div style={{fontSize:10.5,color:"#94a3b8"}}>{step<2?"학습 진행 중...":"레벨업까지 40 XP 남음"}</div></div>
        </div>
        <div style={{textAlign:"right",position:"relative"}}>
          <div style={{fontSize:17,fontWeight:800,color:"#a05070"}}>{xpVal} XP</div>
          {showBurst&&<div style={{position:"absolute",right:0,top:-4,fontSize:11,fontWeight:800,color:"#22c55e",animation:"demoFloat 1.3s ease-out forwards"}}>+20 XP</div>}
        </div>
      </div>
      <div style={{background:"#f1eef0",height:8,borderRadius:9999,marginBottom:18,overflow:"hidden"}}>
        <div style={{width:xpPct+"%",height:"100%",background:showBurst?"linear-gradient(90deg,#d9d4cc,#ec4899,#d9d4cc)":"linear-gradient(90deg,#1e1e1e,#3d3d3d)",borderRadius:9999,transition:"width 0.8s ease, background 0.3s"}}/>
      </div>
      <div style={{background:questDone?"#f0fdf4":"#f8fafc",borderRadius:12,border:"1px solid "+(questDone?"#86efac":"#e2e8f0"),padding:"13px 15px",transition:"background 0.5s, border 0.5s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:20,height:20,borderRadius:6,border:"2px solid "+(questDone?"#22c55e":"#cbd5e1"),background:questDone?"#22c55e":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.4s"}}>{questDone&&<span style={{color:"white",fontSize:11,animation:"demoCheckPop 0.4s ease"}}>✓</span>}</div>
          <span style={{flex:1,fontSize:13.5,color:questDone?"#94a3b8":"#334155",textDecoration:questDone?"line-through":"none"}}>수학 30분 학습</span>
          <span style={{fontSize:12,color:"#a05070",fontWeight:700}}>+20 XP</span>
        </div>
        {!questDone&&(
          <div style={{marginTop:10}}>
            <div style={{height:5,background:"#e2e8f0",borderRadius:9999,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#1e1e1e,#3d3d3d)",borderRadius:9999}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:7}}>
              <span style={{fontSize:10.5,color:"#94a3b8"}}>{step===0?"시작 대기 중":"30분 중 "+Math.round(pct/100*30)+"분 진행"}</span>
              <span style={{fontSize:10.5,background:step===0?"#a05070":"#f1f5f9",color:step===0?"white":"#64748b",padding:"3px 10px",borderRadius:6,fontWeight:600,transition:"all 0.4s"}}>{step===0?"▶ 시작":"⏸ 진행 중"}</span>
            </div>
          </div>
        )}
        {questDone&&<div style={{marginTop:8,fontSize:11,color:"#22c55e",fontWeight:600}}>✓ 완료! +20 XP 획득</div>}
      </div>
      {showBurst&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{fontSize:54,animation:"demoBurst 1.3s ease-out forwards"}}>🎉</div></div>}
      <DemoDots step={step} count={4}/>
    </div>
  );
}

// ── Note Demo ──
function NoteDemo(){
  const FULL_TEXT="극한의 정의: lim f(x) = L 일 때, 연속함수의 조건은...";
  const DURATIONS=[1600,4200,2400,2600];
  const [step,pct]=useDemoSteps(DURATIONS);
  const charCount=step===1?Math.round((pct/100)*FULL_TEXT.length):(step>=2?FULL_TEXT.length:0);
  const shownText=FULL_TEXT.slice(0,charCount);
  const highlightOn=step>=2;
  const saved=step===3;

  return(
    <div style={{padding:"22px 24px",minHeight:220}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:13,fontWeight:700,color:"#334155"}}>📓 수학 — 미적분 노트</span>
        {saved&&<span style={{fontSize:11,color:"#22c55e",fontWeight:700,animation:"demoSlideIn 0.3s ease"}}>저장됨 ✓</span>}
      </div>
      <div style={{background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",padding:"14px 16px",minHeight:90}}>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {["B","I","U","H1"].map(function(b,i){return <div key={i} style={{padding:"3px 9px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:10,color:"#94a3b8",background:"white",fontWeight:i===0&&highlightOn?700:400}}>{b}</div>;}) }
        </div>
        <div style={{fontSize:13.5,lineHeight:1.9,color:"#334155"}}>
          <span style={{fontWeight:highlightOn?800:400,color:highlightOn?"#a05070":"#334155",transition:"all 0.3s"}}>{shownText.slice(0,15)}</span>
          <span style={{background:highlightOn&&shownText.length>15?"#fef9c3":"transparent",padding:highlightOn&&shownText.length>15?"1px 4px":"0",borderRadius:4,transition:"all 0.3s"}}>{shownText.slice(15)}</span>
          {step===1&&<span style={{display:"inline-block",width:2,height:14,background:"#a05070",marginLeft:1,verticalAlign:"middle",animation:"demoBlink 0.9s step-end infinite"}}/>}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <div style={{padding:"7px 16px",background:"linear-gradient(135deg,#eeece8,#fce7f3)",border:"1px solid #b0aba3",borderRadius:10,fontSize:11,color:"#a05070",fontWeight:600}}>+ 엔트리 추가</div>
        <div style={{padding:"7px 16px",background:saved?"#a05070":"#e9dde2",borderRadius:10,fontSize:11,color:"white",fontWeight:600,transition:"background 0.3s"}}>💾 노트 저장</div>
      </div>
      <DemoDots step={step} count={4}/>
    </div>
  );
}

// ── Community Demo ──
function CommunityDemo(){
  const DURATIONS=[2200,2600,2200,3000];
  const [step,pct]=useDemoSteps(DURATIONS);
  const composing=step===0;
  const posted=step>=2;
  const liked=step===3;

  return(
    <div style={{padding:"22px 24px",minHeight:220}}>
      {!posted&&(
        <div style={{background:"#f8fafc",borderRadius:14,border:"1px solid #e2e8f0",padding:"14px 16px",opacity:step===1?Math.max(0,1-pct/100):1,transition:"opacity 0.3s"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:10}}>📸 게시물 만들기</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,padding:"9px 10px",borderRadius:10,border:"2px solid "+(composing?"#a05070":"#e2e8f0"),background:composing?"#fce7f3":"white",fontSize:11,color:composing?"#a05070":"#94a3b8",fontWeight:composing?700:400,transition:"all 0.3s"}}>🎯 수학 30분 학습 ✓완료</div>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:10}}>오늘 목표 달성! 다들 화이팅 💪</div>
          <div style={{textAlign:"right"}}>
            <span style={{padding:"7px 16px",background:step===1?"#a05070":"#e9dde2",borderRadius:10,fontSize:11,color:"white",fontWeight:700,transition:"background 0.3s"}}>공유하기 🚀</span>
          </div>
        </div>
      )}
      {posted&&(
        <div style={{background:"white",borderRadius:16,border:"1px solid #f0d8e4",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",animation:"demoSlideIn 0.4s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px 8px"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#fce7f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>user</div><div style={{fontSize:10,color:"#94a3b8"}}>방금 전</div></div>
          </div>
          <div style={{margin:"0 14px 8px",background:"#fce7f3",borderRadius:10,padding:"9px 12px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#a05070"}}>🎯 수학 30분 학습</div>
            <div style={{fontSize:10.5,color:"#94a3b8",marginTop:2}}>✓ 완료 · +20 XP</div>
          </div>
          <p style={{fontSize:12.5,color:"#334155",margin:"0 14px 10px"}}>오늘 목표 달성! 다들 화이팅 💪</p>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderTop:"1px solid #f3eef1"}}>
            <span style={{fontSize:18,display:"inline-block",animation:liked?"demoHeartPop 0.4s ease":"none"}}>{liked?"❤️":"🤍"}</span>
            <span style={{fontSize:12,fontWeight:600,color:liked?"#a05070":"#94a3b8"}}>{liked?"3":"2"}</span>
            <span style={{fontSize:10.5,color:"#94a3b8",marginLeft:4}}>{liked?"user님 외 2명이 좋아해요":"user님 외 1명이 좋아해요"}</span>
          </div>
        </div>
      )}
      <DemoDots step={step} count={4}/>
    </div>
  );
}

// ── Review Demo ──
function ReviewDemoAnim(){
  const DURATIONS=[3000,2400,2600,2400];
  const [step,pct]=useDemoSteps(DURATIONS);
  const starCount=step===0?Math.ceil((pct/100)*5):(step>=1?5:0);
  const tagsOn=step>=1;
  const typingOn=step>=2;
  const submitted=step===3;
  const FEEDBACK="퀘스트 시스템이 정말 재밌어요!";
  const typedLen=step===2?Math.round((pct/100)*FEEDBACK.length):(step===3?FEEDBACK.length:0);

  return(
    <div style={{padding:"22px 24px",minHeight:220}}>
      {!submitted&&(
        <div style={{background:"#f8fafc",borderRadius:14,border:"1px solid #e2e8f0",padding:"16px 18px"}}>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>전체 만족도</div>
            <div style={{display:"flex",gap:4,justifyContent:"center"}}>
              {[1,2,3,4,5].map(function(i){return <span key={i} style={{fontSize:22,filter:i<=starCount?"none":"grayscale(1) opacity(0.25)",display:"inline-block",animation:i===starCount&&step===0?"demoStarPop 0.3s ease":"none"}}>⭐</span>;}) }
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
            {["퀘스트 시스템","XP 보상","UI 디자인"].map(function(t,i){return(
              <span key={t} style={{fontSize:10.5,padding:"4px 11px",borderRadius:20,border:"1.5px solid "+(tagsOn?"#a05070":"#e2e8f0"),background:tagsOn?"#a05070":"transparent",color:tagsOn?"white":"#94a3b8",fontWeight:tagsOn?700:400,transition:"all 0.3s",transitionDelay:(i*0.1)+"s"}}>👍 {t}</span>
            );})}
          </div>
          <div style={{fontSize:10.5,color:"#94a3b8",marginBottom:5}}>💬 자유롭게 좋았던 점</div>
          <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 11px",fontSize:11.5,color:"#334155",minHeight:32}}>
            {FEEDBACK.slice(0,typedLen)}
            {step===2&&<span style={{display:"inline-block",width:1.5,height:12,background:"#a05070",marginLeft:1,verticalAlign:"middle",animation:"demoBlink 0.9s step-end infinite"}}/>}
          </div>
        </div>
      )}
      {submitted&&(
        <div style={{animation:"demoSlideIn 0.4s ease"}}>
          <div style={{background:"white",borderRadius:14,border:"1px solid #f0d8e4",padding:"14px 16px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#fce7f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>👤</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>user</div><div style={{fontSize:10,color:"#94a3b8"}}>방금 전</div></div>
              <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(function(i){return <span key={i} style={{fontSize:11}}>⭐</span>;}) }</div>
            </div>
            <span style={{fontSize:10,background:"#fce7f3",color:"#a05070",padding:"2px 8px",borderRadius:20,fontWeight:700}}>👍 퀘스트 시스템</span>
            <p style={{fontSize:12,color:"#334155",margin:"8px 0 0",lineHeight:1.6}}>{FEEDBACK}</p>
          </div>
          <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"#22c55e",fontWeight:700}}>🎉 평가가 등록되었어요!</div>
        </div>
      )}
      <DemoDots step={step} count={4}/>
    </div>
  );
}

function DemoDots({step,count}){
  return(
    <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18}}>
      {Array.from({length:count},function(_,i){return(
        <div key={i} style={{width:step===i?20:6,height:6,borderRadius:9999,background:step===i?"#a05070":"#f0d8e4",transition:"width 0.3s, background 0.3s"}}/>
      );})}
    </div>
  );
}


function HomePage({onStart,onLogin}){
  const [activeFeat,setActiveFeat]=useState("xp");
  const FEATURES=[
    {id:"xp",icon:"✨",title:"실시간 XP 환산",desc:"학습 완료 즉시 XP가 오르는 애니메이션 모드. 공부를 퀘스트 보상처럼 느끼게 합니다."},
    {id:"note",icon:"📝",title:"스마트 성장 노트",desc:"볼드/색상 편집부터 엔트리 접기까지, 복잡한 내용을 체계적으로 정리하는 맞춤형 공간."},
    {id:"streak",icon:"🔥",title:"연속 기록(스트릭)",desc:"멈추지 않는 성장의 증거. 기록이 끊기지 않도록 AI 가이드가 실시간으로 관리해 줍니다."},
    {id:"report",icon:"📊",title:"월간 성장 리포트",desc:"지난달 대비 성장률과 등급 변화를 시각적으로 대조하여 명확한 피드백을 제공합니다."},
    {id:"ai",icon:"🤖",title:"AI 페이스메이커",desc:"축하, 경고, 요약 멘트까지. 외롭지 않은 공부를 위해 상황에 맞게 반응하는 가이드."},
  ];
  const feat=FEATURES.find(function(f){return f.id===activeFeat;})||FEATURES[0];
  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:"#ffffff"}}>
      <div style={{background:"#faeaf2",padding:"96px 20px 80px",textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f2d8ea",border:"1px solid #e8e8ec",borderRadius:20,padding:"5px 15px",fontSize:12,color:"#666666",fontWeight:600,marginBottom:32}}>✦ 학습을 게임처럼, 성장을 수집처럼</div>
          <h1 className="hero-h1" style={{fontSize:52,fontWeight:900,color:"#2d0a1a",lineHeight:1.15,marginBottom:20,letterSpacing:"-1.5px"}}>마침내,<br/><span style={{color:"#a05070"}}>성장이 수집됩니다.</span></h1>
          <p style={{fontSize:15,color:"#8a5068",lineHeight:1.9,maxWidth:460,margin:"0 auto 44px"}}>공부 시간을 경험치(XP)로, 학습 기록을 레벨(Level)로.<br/>당신의 모든 노력이 수치로 증명되는 유일한 공간.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={onStart} style={{background:"#a05070",color:"white",border:"none",padding:"13px 32px",borderRadius:11,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>시작하기 →</button>
            <button onClick={onLogin} style={{background:"white",color:"#333344",border:"1.5px solid #e0e0e8",padding:"13px 28px",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>로그인</button>
          </div>
        </div>
      </div>
      <div style={{background:"#f5e0ec",borderTop:"1px solid #e8c8d8",borderBottom:"1px solid #e8c8d8",padding:"22px 20px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"center",gap:56,flexWrap:"wrap"}}>
          {[["🎯","퀘스트 완료","매일 달성"],["⚡","XP 시스템","자동 적립"],["🏆","등급 4단계","Bronze ~ Premium"],["🤖","AI 가이드","상황 인식"]].map(function(item,i){
            return <div key={i} style={{textAlign:"center"}}><div style={{fontSize:20,marginBottom:5}}>{item[0]}</div><div style={{fontSize:12,fontWeight:700,color:"#2d0a1a"}}>{item[1]}</div><div style={{fontSize:11,color:"#b07090",marginTop:1}}>{item[2]}</div></div>;
          })}
        </div>
      </div>
      <div style={{background:"white",padding:"64px 20px",textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:"#faeaf2",borderRadius:16,padding:"10px 24px",marginBottom:24}}>
            <span style={{fontSize:26,fontWeight:900,color:"#a05070"}}>D+Puzzle</span>
          </div>
          <p style={{fontSize:18,fontWeight:700,color:"#3a1a28",lineHeight:1.7}}>오늘의 할 일, 내일의 할 일,</p>
          <p style={{fontSize:18,fontWeight:700,color:"#a05070",lineHeight:1.7,marginBottom:16}}>하루하루 한 조각의 지식으로 완성해보세요!</p>
          <p style={{fontSize:13.5,color:"#9a7a8a",lineHeight:1.9,maxWidth:480,margin:"0 auto 24px"}}>
            <b style={{color:"#a05070"}}>D</b>는 <b style={{color:"#a05070"}}>Daily</b>(매일)과 <b style={{color:"#a05070"}}>Day</b>(하루)를, <b style={{color:"#a05070"}}>Puzzle</b>은 한 조각씩 맞춰가는 성장을 의미해요.
          </p>
          <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
            {["📅 Daily","🧩 Puzzle","📈 Growth","✨ XP"].map(function(t,i){return <span key={i} style={{background:"#faeaf2",color:"#a05070",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:600,border:"1px solid #f0d0e0"}}>{t}</span>;})}
          </div>
        </div>
      </div>

      <div style={{maxWidth:940,margin:"64px auto",padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,color:"#b07090",letterSpacing:2.5,marginBottom:10,textTransform:"uppercase"}}>Core Features</div>
          <h2 style={{fontSize:28,fontWeight:800,color:"#2d0a1a",marginBottom:10}}>핵심 기능 소개</h2>
          <p style={{fontSize:13.5,color:"#b07090"}}>항목을 클릭하면 기능을 미리 확인할 수 있어요</p>
        </div>
        <div className="feature-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {FEATURES.map(function(f){
              return(
                <button key={f.id} onClick={()=>setActiveFeat(f.id)} style={{textAlign:"left",padding:"14px 18px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeFeat===f.id?"#f2d8ea":"#f8e6f0",borderLeft:activeFeat===f.id?"3px solid #a05070":"3px solid transparent"}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:activeFeat===f.id?"#a05070":"#555566"}}>{f.icon} {f.title}</div>
                  {activeFeat===f.id&&<div style={{fontSize:12,color:"#8a5068",marginTop:5,lineHeight:1.65}}>{f.desc}</div>}
                </button>
              );
            })}
          </div>
          <div style={{background:"white",borderRadius:16,border:"1px solid #e8c8d8",overflow:"hidden",minHeight:240}}>
            <div style={{background:"#f2d8ea",borderBottom:"1px solid #e8c8d8",padding:"10px 16px",display:"flex",gap:6,alignItems:"center"}}>
              {["#ff6b6b","#ffd166","#06d6a0"].map(function(c,i){return <div key={i} style={{width:9,height:9,borderRadius:"50%",background:c,opacity:0.6}}/>;}) }
              <span style={{fontSize:11,color:"#b07090",marginLeft:6}}>D+Puzzle — {feat.title}</span>
            </div>
            <div style={{padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,minHeight:180}}>
              <div style={{fontSize:56}}>{feat.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:"#1a0a12",textAlign:"center"}}>{feat.title}</div>
              <div style={{fontSize:13,color:"#9a7a8a",textAlign:"center",maxWidth:260,lineHeight:1.7}}>{feat.desc}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Demo Section ── */}
      <LiveDemoSection/>

      <div style={{background:"white",padding:"72px 20px",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#a05070",letterSpacing:2.5,marginBottom:14,textTransform:"uppercase"}}>Get Started Free</div>
        <h2 style={{fontSize:28,fontWeight:800,color:"#2d0a1a",marginBottom:12}}>지금 바로 성장을 시작하세요</h2>
        <p style={{fontSize:13.5,color:"#9a7a8a",marginBottom:34}}>무료로 시작하고, 오늘 첫 XP를 획득해보세요 ✨</p>
        <button onClick={onStart} style={{background:"#a05070",color:"white",border:"none",padding:"13px 38px",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>시작하기</button>
      </div>
    </div>
  );
}

export default function BlueMind(){
  const [tab,setTab]=useState("home");
  const [xp,setXP]=useState(function(){return loadLS("bm_xp",0);});
  const [stats,setStats]=useState(function(){return loadLS("bm_stats",{streak:0,questsDone:0,studySecs:0,entries:0,weeklyXP:[0,0,0,0,0,0,0],weeklyMins:[0,0,0,0,0,0,0],lastActiveDate:null,missedDays:0,studyDates:[]});});
  const [celebration,setCelebration]=useState(null);
  const [profile,setProfile]=useState(function(){return loadLS("bm_profile",{name:"학습자",avatarSrc:null,bio:"",goal:""});});
  const [showProfile,setShowProfile]=useState(false);
  const [showNotifBar,setShowNotifBar]=useState(true);
  const [showConfetti,setShowConfetti]=useState(false);
  const [xpFlash,setXpFlash]=useState(false);
  const [authModal,setAuthModal]=useState(null);
  const [loggedIn,setLoggedIn]=useState(function(){return loadLS("bm_loggedIn",false);});
  const [accounts,setAccounts]=useState(function(){return loadLS("bm_accounts",{});});
  const [darkMode,setDarkMode]=useState(function(){return loadLS("bm_dark",false);});
  const [primaryColor,setPrimaryColor]=useState(function(){return loadLS("bm_primary","#a05070");});
  const [showSettings,setShowSettings]=useState(false);
  const [showStreakCal,setShowStreakCal]=useState(false);
  const [profileView,setProfileView]=useState(null);
  const [questsForCommunity,setQuestsForCommunity]=useState([]);
const [refreshBump,setRefreshBump]=useState(0);
  const prevXP=useRef(0);
  const prevBadges=useRef([]);

  useEffect(function(){try{localStorage.setItem("bm_xp",JSON.stringify(xp));}catch{}},[xp]);
  useEffect(function(){try{localStorage.setItem("bm_stats",JSON.stringify(stats));}catch{}},[stats]);
useEffect(function(){
  if(!profile.name)return;
  const key=profile.id||profile.name;
  supabase.from('user_stats').upsert({id:key,name:profile.name,xp:xp,stats_data:stats,avatar_src:profile.avatarSrc},{onConflict:'id'}).then();
},[xp,stats,profile]);
  useEffect(function(){try{localStorage.setItem("bm_profile",JSON.stringify(profile));}catch{}},[profile]);
  useEffect(function(){try{localStorage.setItem("bm_loggedIn",JSON.stringify(loggedIn));}catch{}},[loggedIn]);
  useEffect(function(){try{localStorage.setItem("bm_accounts",JSON.stringify(accounts));}catch{}},[accounts]);
  useEffect(function(){try{localStorage.setItem("bm_dark",JSON.stringify(darkMode));}catch{}},[darkMode]);
  useEffect(function(){try{localStorage.setItem("bm_primary",JSON.stringify(primaryColor));}catch{}},[primaryColor]);
useEffect(function(){if(loggedIn)setTab("dashboard");},[]);
  useEffect(function(){
    const recalced=calcStreak(stats.studyDates||[]);
    if(recalced!==stats.streak){
      setStats(function(s){return Object.assign({},s,{streak:recalced});});
    }
  },[]);

  const handleAuth=function(info){
    const email=info.email,pw=info.pw,name=info.name,mode=info.mode;
    if(mode==="signup"){const newId=String(Date.now())+Math.random().toString(36).slice(2,8);
setAccounts(function(a){const n=Object.assign({},a);n[email]={pw:pw,name:name,id:newId};return n;});
setProfile(function(p){return Object.assign({},p,{name:name,id:newId});});
      setLoggedIn(true);setAuthModal(null);setTab("dashboard");
    } else {
const acc=accounts[email];
if(!acc)return "등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.";
if(acc.pw!==pw)return "비밀번호가 올바르지 않습니다.";
const uid=acc.id||(String(Date.now())+Math.random().toString(36).slice(2,8));
if(!acc.id){setAccounts(function(a){const n=Object.assign({},a);n[email]=Object.assign({},acc,{id:uid});return n;});}
setProfile(function(p){return Object.assign({},p,{name:acc.name,id:uid});});
setLoggedIn(true);setAuthModal(null);setTab("dashboard");
    }
  };

  useEffect(function(){
    const prev=prevXP.current;
    if(xp>prev){setXpFlash(true);setTimeout(function(){setXpFlash(false);},1200);}
    if(xp<=prev){prevXP.current=xp;return;}
    const pL=getLvl(prev),cL=getLvl(xp),pR=getRank(prev),cR=getRank(xp);
    if(cL.level>pL.level){setCelebration({type:"level",value:"Lv."+cL.level+" 달성!"});setShowConfetti(true);setTimeout(function(){setShowConfetti(false);},2800);}
    else if(cR.name!==pR.name){setCelebration({type:"rank",value:cR.icon+" "+cR.name+" 등급 달성!"});setShowConfetti(true);setTimeout(function(){setShowConfetti(false);},2800);}
    prevXP.current=xp;
  },[xp]);

  useEffect(function(){
    if(celebration)return;
    const earned=ALL_BADGES.filter(function(b){return b.req(Object.assign({},stats,{xp:xp,level:getLvl(xp).level}));});
    const newOnes=earned.filter(function(b){return !prevBadges.current.includes(b.id);});
    if(newOnes.length>0)setCelebration({type:"badge",value:newOnes[0].emoji+" "+newOnes[0].label});
    prevBadges.current=earned.map(function(b){return b.id;});
  },[xp,stats]);

  const lvl=getLvl(xp),rank=getRank(xp);
  const isHome=tab==="home";
  const th=getTheme("default",darkMode,primaryColor);

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:"100vh",background:isHome?th.pl:darkMode?"#0f0f1a":"#f4f6fb",color:th.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}button:active{transform:scale(0.97)}@keyframes xpPing{0%{box-shadow:0 0 0 0 rgba(236,72,153,0.5)}70%{box-shadow:0 0 0 8px rgba(236,72,153,0)}100%{box-shadow:0 0 0 0 rgba(236,72,153,0)}}@media(max-width:768px){.dash-grid{grid-template-columns:1fr!important}.chart-grid{grid-template-columns:1fr!important}.feature-grid{grid-template-columns:1fr!important}.hero-h1{font-size:34px!important}}@media(max-width:420px){.hero-h1{font-size:28px!important}}`}</style>
      {showNotifBar&&<NotificationBar onClose={()=>setShowNotifBar(false)}/>}
      {showConfetti&&<Confetti/>}
      <nav style={{background:th.nav,borderBottom:"1px solid "+(darkMode?"#2d2d4e":"rgba(0,0,0,0.06)"),position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1160,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",gap:24}}>
          <button onClick={()=>{setProfileView(null);setTab(loggedIn?"dashboard":"home");}} style={{background:th.p,color:"white",fontWeight:900,fontSize:15,padding:"7px 16px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit"}}>D+Puzzle</button>
          {!isHome&&(
            <div style={{display:"flex",gap:2}}>
              {[{id:"dashboard",label:"대시보드"},{id:"note",label:"노트"},{id:"community",label:"커뮤니티"},{id:"review",label:"⭐ 평가"}].map(function(t){
                return <button key={t.id} onClick={()=>{setProfileView(null);setTab(t.id);}} style={{padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13.5,background:tab===t.id?th.pl:"transparent",color:tab===t.id?th.p:(darkMode?"#94a3b8":"#6b7280"),fontWeight:tab===t.id?700:500,fontFamily:"inherit"}}>{t.label}</button>;
              })}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
            {isHome&&(
              <React.Fragment>
                <button onClick={()=>setAuthModal("login")} style={{padding:"8px 20px",borderRadius:10,border:"1.5px solid "+(darkMode?"#2d2d4e":"#e5e7eb"),background:darkMode?"#1e1e2e":"white",fontSize:13.5,fontWeight:600,cursor:"pointer",color:darkMode?"#e2e8f0":"#111827",fontFamily:"inherit"}}>로그인</button>
                <button onClick={()=>setAuthModal("signup")} style={{padding:"8px 20px",borderRadius:10,border:"none",background:th.p,fontSize:13.5,fontWeight:700,cursor:"pointer",color:"white",fontFamily:"inherit"}}>회원가입</button>
              </React.Fragment>
            )}
            {!isHome&&(
              <React.Fragment>
                <div onClick={function(){setShowStreakCal(function(v){return !v;});}} style={{background:"#fef2f2",color:"#dc2626",padding:"5px 11px",borderRadius:20,fontSize:12.5,fontWeight:600,cursor:"pointer",position:"relative",userSelect:"none"}}>🔥 {stats.streak}일 연속</div>
                <div style={{background:"#fefce8",color:"#854d0e",padding:"5px 11px",borderRadius:20,fontSize:12.5,fontWeight:600,animation:xpFlash?"xpPing 0.6s ease-out":"none"}}>⚡ {xp} XP</div>
                <div style={{background:rank.bg,color:rank.color,padding:"5px 11px",borderRadius:20,fontSize:12.5,border:"1px solid "+rank.border,fontWeight:600}}>{rank.icon} Lv.{lvl.level} {rank.name}</div>
                <button onClick={()=>setProfileView(profile)} style={{display:"flex",alignItems:"center",gap:8,background:darkMode?"#1e1e2e":"white",border:"1.5px solid "+(darkMode?"#2d2d4e":"#e8d9de"),borderRadius:22,padding:"4px 14px 4px 4px",cursor:"pointer",height:38}}>
                  <AvatarImg src={profile.avatarSrc} size={28} border="1.5px solid #e0ccd4"/>
                  <span style={{fontSize:13,fontWeight:600,color:darkMode?"#e2e8f0":"#2d1a22",whiteSpace:"nowrap"}}>{profile.name}</span>
                </button>
              </React.Fragment>
            )}
<NotificationBell myName={profile.name} myId={profile.id} darkMode={darkMode} th={th} onViewProfile={setProfileView} onOpenPost={function(postId){setProfileView(null);setTab("community");}}/>
            <button onClick={()=>setShowSettings(true)} title="설정" style={{width:36,height:36,borderRadius:10,border:"1.5px solid "+(darkMode?"#2d2d4e":"#e2e8f0"),background:darkMode?"#1e1e2e":"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
          </div>
        </div>
      </nav>
      {showStreakCal&&(
        <StreakCalendarWindow studyDates={stats.studyDates||[]} onClose={function(){setShowStreakCal(false);}}/>
      )}
      {tab==="dashboard"&&(
        <div style={{maxWidth:1160,margin:"0 auto",padding:"12px 24px 0"}}>
          <div style={{fontSize:12,color:"#9ca3af"}}>Lv.{lvl.level} 대시보드</div>
          <div style={{fontSize:13,color:darkMode?"#94a3b8":"#6b7280"}}>안녕하세요, <span style={{fontWeight:700,color:th.p}}>{profile.name}</span>님! 오늘도 성장하는 하루 만들어보세요 ✨</div>
        </div>
      )}
      <main>
        {profileView?(
          <ProfilePage
            viewUser={profileView}
            myProfile={profile}
            posts={loadLS("bm_community",[])}
            follows={loadLS("bm_follows",{})}
            onFollow={function(name){
              const cur=(loadLS("bm_follows",{}));
              const myF=(cur[profile.name])||[];
              const updated=myF.includes(name)?myF.filter(function(n){return n!==name;}):myF.concat([name]);
              const nf=Object.assign({},cur);nf[profile.name]=updated;
              try{localStorage.setItem("bm_follows",JSON.stringify(nf));}catch{}
            }}
            onBack={()=>setProfileView(null)}
            darkMode={darkMode}
            myStats={stats}
            myXP={xp}
            onEditProfile={()=>setShowProfile(true)}
            allBadges={ALL_BADGES}
          />
        ):(
          <React.Fragment>
            {tab==="home"&&<HomePage onStart={()=>setAuthModal("signup")} onLogin={()=>setAuthModal("login")} darkMode={darkMode}/>}
            {loggedIn&&(
              <React.Fragment>
                <div style={{display:tab==="dashboard"?"block":"none",maxWidth:960,margin:"0 auto",padding:"0 24px 48px"}}>
                  <Dashboard xp={xp} onXPChange={setXP} stats={stats} setStats={setStats} xpFlash={xpFlash} activeTab={tab} darkMode={darkMode} onQuestsChange={setQuestsForCommunity}/>
                </div>
                <div style={{display:tab==="note"?"block":"none"}}>
                  <NotePage onEntriesChange={function(n){setStats(function(s){return Object.assign({},s,{entries:n});});}}/>
                </div>
                <div style={{display:tab==="community"?"block":"none"}}>
                  <CommunityPage profile={profile} quests={questsForCommunity} xp={xp}  darkMode={darkMode} onViewProfile={setProfileView}/>
                </div>
                <div style={{display:tab==="review"?"block":"none"}}>
                  <ReviewPage profile={profile} darkMode={darkMode}/>
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </main>
      {celebration&&<CelebrationModal type={celebration.type} value={celebration.value} onClose={()=>setCelebration(null)}/>}
      {showProfile&&<ProfileModal profile={profile} onSave={function(p){
        // Update community posts to reflect new name/avatar
        try{
          const oldName=profile.name;
          const posts=loadLS("bm_community",[]);
          const updated=posts.map(function(post){
            return post.author===oldName?Object.assign({},post,{author:p.name,avatarSrc:p.avatarSrc}):post;
          });
          localStorage.setItem("bm_community",JSON.stringify(updated));
          // Update follows keys
          const follows=loadLS("bm_follows",{});
          const nf={};
          Object.keys(follows).forEach(function(k){
            const newKey=k===oldName?p.name:k;
            nf[newKey]=(follows[k]||[]).map(function(n){return n===oldName?p.name:n;});
          });
          localStorage.setItem("bm_follows",JSON.stringify(nf));
        }catch{}
        setProfile(p);
        if(profileView&&profileView.name===profile.name)setProfileView(p);
      }} onClose={()=>setShowProfile(false)}
        onLogout={()=>{setLoggedIn(false);setTab("home");setShowProfile(false);try{localStorage.removeItem("bm_loggedIn");}catch{}}}
        onWithdraw={()=>{
          ["bm_xp","bm_stats","bm_profile","bm_loggedIn","bm_accounts","bm_notebooks","bm_community"].forEach(function(k){try{localStorage.removeItem(k);}catch{}});
          setLoggedIn(false);setAccounts({});setXP(0);
          setStats({streak:0,questsDone:0,studySecs:0,entries:0,weeklyXP:[0,0,0,0,0,0,0],weeklyMins:[0,0,0,0,0,0,0],lastActiveDate:null,missedDays:0,studyDates:[]});
          setProfile({name:"학습자",avatarSrc:null,bio:"",goal:""});setTab("home");setShowProfile(false);
        }}/>}
      {authModal&&<AuthModal mode={authModal} accounts={accounts} onAuth={handleAuth} onClose={()=>setAuthModal(null)}/>}
      {showSettings&&<SettingsModal darkMode={darkMode} onDark={setDarkMode} onClose={()=>setShowSettings(false)}/>}
<Analytics />
    </div>
  );
}