import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react"

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
  { id:"xp1200",   emoji:"💎", label:"Premium",    req:s=>s.xp>=1200 },
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
  { id:"lv7",      emoji:"🏆", label:"최고 레벨",   req:s=>s.level>=7 },
];

const LEVELS=[
  {level:1,minXP:0,   maxXP:100},
  {level:2,minXP:100, maxXP:300},
  {level:3,minXP:300, maxXP:600},
  {level:4,minXP:600, maxXP:700},
  {level:5,minXP:700, maxXP:1000},
  {level:6,minXP:1000,maxXP:1200},
  {level:7,minXP:1200,maxXP:99999},
];
const RANKS=[
  {name:"Bronze", minXP:0,   icon:"🥉",color:"#d97706",bg:"#fef3c7",border:"#fcd34d"},
  {name:"Silver", minXP:300, icon:"🥈",color:"#475569",bg:"#f1f5f9",border:"#94a3b8"},
  {name:"Gold",   minXP:700, icon:"🥇",color:"#b45309",bg:"#fffbeb",border:"#fde68a"},
  {name:"Premium",minXP:1200,icon:"💎",color:"#a05070",bg:"#f5f4f2",border:"#b0aba3"},
];

const getLvl=xp=>{for(let i=LEVELS.length-1;i>=0;i--)if(xp>=LEVELS[i].minXP)return LEVELS[i];return LEVELS[0];};
const getRank=xp=>{for(let i=RANKS.length-1;i>=0;i--)if(xp>=RANKS[i].minXP)return RANKS[i];return RANKS[0];};
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

// ── Entry Editor ──
function EntryEditor({entry,onUpdate,onDelete}){
  const ref=useRef(null);
  const [collapsed,setCollapsed]=useState(false);
  const [isEmpty,setIsEmpty]=useState(!entry.content);
  const [entryTitle,setEntryTitle]=useState(entry.entryTitle||"");
  const COLORS=["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a05070","#ec4899","#1e293b"];

  useEffect(()=>{
    if(ref.current && entry.content){
      ref.current.innerHTML=entry.content;
      setIsEmpty(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const exec=(c,v)=>{ref.current?.focus();document.execCommand(c,false,v||null);};

  const handleInput=e=>{
    const html=e.currentTarget.innerHTML;
    const text=e.currentTarget.innerText.trim();
    setIsEmpty(text==="");
    onUpdate({content:html,title:text.slice(0,40)});
  };

  return(
    <div style={{background:"white",borderRadius:14,border:"1px solid #f1f5f9",marginBottom:12,boxShadow:"0 2px 8px rgba(99,102,241,0.06)",position:"relative"}}>
      <div style={{position:"absolute",top:8,right:10,display:"flex",gap:5,zIndex:2}}>
        <button onClick={()=>setCollapsed(c=>!c)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"3px 9px",cursor:"pointer",fontSize:11,color:"#64748b",fontFamily:"inherit",whiteSpace:"nowrap"}}>{collapsed?"∨":"∧"} {collapsed?"펼치기":"접기"}</button>
        <button onClick={onDelete} style={{background:"#fff0f0",border:"1px solid #fecaca",borderRadius:7,padding:"4px 8px",cursor:"pointer",color:"#ef4444",fontFamily:"inherit",fontSize:13}}>🗑</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",paddingRight:130,borderBottom:collapsed?"none":"1px solid #f1f5f9"}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#eeece8,#fae8ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#a05070",border:"2px solid #d4d0ca",flexShrink:0}}>{entry.num}</div>
        {collapsed
          ? <span style={{fontSize:13,color:"#334155",fontWeight:500}}>{entryTitle||entry.title||"제목 없음"}</span>
          : <input
              value={entryTitle}
              onChange={e=>{setEntryTitle(e.target.value);onUpdate({entryTitle:e.target.value});}}
              placeholder="제목을 입력하세요..."
              style={{flex:1,border:"none",outline:"none",fontSize:13,fontWeight:600,color:"#334155",background:"transparent",fontFamily:"inherit",padding:"2px 0"}}
            />
        }
      </div>
      {!collapsed&&(
        <div style={{padding:"10px 14px 14px"}}>
          <div style={{display:"flex",gap:3,marginBottom:8,padding:6,background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",flexWrap:"wrap",alignItems:"center"}}>
            {[["B","bold",{fontWeight:800}],["I","italic",{fontStyle:"italic"}],["U","underline",{textDecoration:"underline"}],["S","strikeThrough",{textDecoration:"line-through"}]].map(([l,c,s])=>(
              <button key={c} onMouseDown={e=>{e.preventDefault();exec(c);}} style={{...s,background:"white",border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:12,minWidth:26,fontFamily:"inherit"}}>{l}</button>
            ))}
            <div style={{width:1,height:18,background:"#e2e8f0",margin:"0 2px"}}/>
            {COLORS.map(c=>(
              <button key={c} onMouseDown={e=>{e.preventDefault();exec("foreColor",c);}} style={{width:18,height:18,borderRadius:"50%",background:c,border:"2px solid white",cursor:"pointer",boxShadow:"0 0 0 1px #e2e8f0",flexShrink:0}}/>
            ))}
            <div style={{width:1,height:18,background:"#e2e8f0",margin:"0 2px"}}/>
            {[["H1","formatBlock","h3"],["H2","formatBlock","h4"],["•","insertUnorderedList",null],["1.","insertOrderedList",null]].map(([l,c,v])=>(
              <button key={l} onMouseDown={e=>{e.preventDefault();exec(c,v);}} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 7px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
          <div style={{position:"relative"}}>
            {isEmpty&&(
              <div style={{position:"absolute",top:10,left:10,fontSize:14,color:"#cbd5e1",pointerEvents:"none",userSelect:"none"}}>
                여기에 공부 내용을 작성해보세요! ✨
              </div>
            )}
            <div
              ref={ref}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onFocus={()=>setIsEmpty(false)}
              onBlur={e=>{
                const text=e.currentTarget.innerText.trim();
                setIsEmpty(text==="");
                onUpdate({content:e.currentTarget.innerHTML,title:text.slice(0,40)});
              }}
              style={{minHeight:90,outline:"none",fontSize:14,lineHeight:1.8,color:"#334155",padding:10,border:"1px solid #e2e8f0",borderRadius:10,fontFamily:"inherit"}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chapter inline rename (싱글클릭으로 수정) ──
function ChapterNameInput({name,onRename}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(name);
  if(editing){
    return(
      <input autoFocus value={val}
        onChange={e=>setVal(e.target.value)}
        onBlur={()=>{onRename(val.trim()||name);setEditing(false);}}
        onKeyDown={e=>{if(e.key==="Enter"){onRename(val.trim()||name);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
        onClick={e=>e.stopPropagation()}
        style={{flex:1,border:"none",borderBottom:"1.5px solid #a05070",outline:"none",fontSize:13,fontWeight:600,color:"#7a2848",background:"transparent",fontFamily:"inherit",minWidth:0,padding:"1px 0"}}
      />
    );
  }
  return(
    <span
      onClick={e=>{e.stopPropagation();setEditing(true);}}
      title="클릭하여 이름 수정"
      style={{fontSize:13,fontWeight:600,color:"#7a2848",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text"}}
    >{name}</span>
  );
}

// ── Page inline rename (싱글클릭으로 수정) ──
function PageNameInput({name,onRename,isSelected}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(name);
  if(editing){
    return(
      <input autoFocus value={val}
        onChange={e=>setVal(e.target.value)}
        onBlur={()=>{onRename(val.trim()||name);setEditing(false);}}
        onKeyDown={e=>{if(e.key==="Enter"){onRename(val.trim()||name);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
        onClick={e=>e.stopPropagation()}
        style={{flex:1,border:"none",borderBottom:`1.5px solid ${isSelected?"#a05070":"#c0a0b0"}`,outline:"none",fontSize:12,color:"#7a2848",background:"transparent",fontFamily:"inherit",minWidth:0,padding:"1px 0"}}
      />
    );
  }
  return(
    <span
      onClick={e=>{e.stopPropagation();setEditing(true);}}
      title="클릭하여 이름 수정"
      style={{fontSize:12,color:isSelected?"#7a2848":"#6a5060",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text"}}
    >{name}</span>
  );
}

// ── Note Page ──
function NotePage({onEntriesChange}){
  const [notebooks,setNotebooks]=useState(()=>{
    try{const v=localStorage.getItem("bm_notebooks");return v?JSON.parse(v):[];}catch{return[];}
  });
  const [selNb,setSelNb]=useState(null);
  const [selCh,setSelCh]=useState(null);
  const [selPg,setSelPg]=useState(null);
  const [addingNb,setAddingNb]=useState(false);
  const [newNbName,setNewNbName]=useState("");
  const [saveMsg,setSaveMsg]=useState("");
  const nb=notebooks.find(n=>n.id===selNb);
  const chapter=nb?.chapters.find(c=>c.id===selCh);
  const page=chapter?.pages.find(p=>p.id===selPg);

  useEffect(()=>{
    const t=notebooks.reduce((a,n)=>a+n.chapters.reduce((b,c)=>b+c.pages.reduce((d,p)=>d+p.entries.length,0),0),0);
    onEntriesChange(t);
  });

  const saveNotebooks=()=>{
    try{localStorage.setItem("bm_notebooks",JSON.stringify(notebooks));setSaveMsg("저장됨 ✓");setTimeout(()=>setSaveMsg(""),2000);}
    catch{setSaveMsg("저장 실패");setTimeout(()=>setSaveMsg(""),2000);}
  };

  const upNbs=fn=>setNotebooks(fn);
  const addNb=()=>{
    if(!newNbName.trim())return;
    const n={id:Date.now(),name:newNbName.trim(),chapters:[]};
    upNbs(p=>[...p,n]);setSelNb(n.id);setSelCh(null);setSelPg(null);setNewNbName("");setAddingNb(false);
  };
  const addChapter=()=>{
    if(!selNb)return;
    const ch={id:Date.now(),name:`챕터 ${(nb?.chapters.length||0)+1}`,pages:[]};
    upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:[...n.chapters,ch]}:n));
    setSelCh(ch.id);setSelPg(null);
  };
  const addPage=chId=>{
    const ch=nb?.chapters.find(c=>c.id===chId);
    const pg={id:Date.now(),name:`예시 ${(ch?.pages.length||0)+1}) 페이지`,entries:[]};
    upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===chId?{...c,pages:[...c.pages,pg]}:c)}:n));
    setSelCh(chId);setSelPg(pg.id);
  };
  const addEntry=()=>{
    if(!selPg)return;
    upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===selCh?{...c,pages:c.pages.map(pg=>{
      if(pg.id!==selPg)return pg;
      return{...pg,entries:[...pg.entries,{id:Date.now(),content:"",title:"",num:pg.entries.length+1}]};
    })}:c)}:n));
  };
  const updateEntry=(id,data)=>upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===selCh?{...c,pages:c.pages.map(pg=>pg.id===selPg?{...pg,entries:pg.entries.map(e=>e.id===id?{...e,...data}:e)}:pg)}:c)}:n));
  const deleteEntry=id=>upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===selCh?{...c,pages:c.pages.map(pg=>pg.id===selPg?{...pg,entries:pg.entries.filter(e=>e.id!==id).map((e,i)=>({...e,num:i+1}))}:pg)}:c)}:n));
  const deleteNb=id=>{upNbs(p=>p.filter(n=>n.id!==id));if(selNb===id){setSelNb(null);setSelCh(null);setSelPg(null);}};
  const deleteChapter=chId=>{upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.filter(c=>c.id!==chId)}:n));if(selCh===chId){setSelCh(null);setSelPg(null);}};
  const deletePage=(chId,pgId)=>{upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===chId?{...c,pages:c.pages.filter(pg=>pg.id!==pgId)}:c)}:n));if(selPg===pgId)setSelPg(null);};
  const renameChapter=(chId,name)=>upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===chId?{...c,name}:c)}:n));
  const renamePage=(chId,pgId,name)=>upNbs(p=>p.map(n=>n.id===selNb?{...n,chapters:n.chapters.map(c=>c.id===chId?{...c,pages:c.pages.map(pg=>pg.id===pgId?{...pg,name}:pg)}:c)}:n));

  const ES={flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:"#94a3b8",textAlign:"center"};

  return(
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>
      {/* Col 1 */}
      <div style={{width:210,borderRight:"1px solid #ede8ec",background:"white",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white",borderBottom:"1px solid #ede8ec"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#5a3a4a",letterSpacing:"-0.2px"}}> 노트북</span>
          <button onClick={()=>setAddingNb(true)} style={{background:"#a05070",color:"white",border:"none",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
        </div>
        {addingNb&&(
          <div style={{padding:"8px 12px",borderBottom:"1px solid #f1f5f9"}}>
            <input autoFocus value={newNbName} onChange={e=>setNewNbName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addNb();if(e.key==="Escape")setAddingNb(false);}}
              placeholder="노트북 이름..." style={{width:"100%",padding:"6px 8px",border:"1px solid #1e1e1e",borderRadius:8,fontSize:13,boxSizing:"border-box",fontFamily:"inherit",outline:"none"}}/>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
          {notebooks.length===0&&<div style={{padding:16,textAlign:"center",fontSize:12,color:"#94a3b8"}}>위 + 버튼으로<br/>노트북을 만들어보세요</div>}
          {notebooks.map(n=>(
            <div key={n.id} onClick={()=>{setSelNb(n.id);setSelCh(null);setSelPg(null);}}
              style={{padding:"10px 12px",cursor:"pointer",fontSize:13,fontWeight:500,borderRadius:10,marginBottom:3,display:"flex",alignItems:"center",gap:6,background:selNb===n.id?"linear-gradient(135deg,#eeece8,#fce7f3)":"#f8fafc",color:selNb===n.id?"#a05070":"#475569",border:`1px solid ${selNb===n.id?"#d4d0ca":"#f1f5f9"}`,transition:"all 0.15s"}}>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name}</span>
              <button onClick={e=>{e.stopPropagation();deleteNb(n.id);}} title="노트북 삭제"
                style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:13,padding:"0 2px",lineHeight:1,flexShrink:0,opacity:0.7}}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* Col 2 */}
      <div style={{width:290,borderRight:"1px solid #ede8ec",background:"#fdf5f8",display:"flex",flexDirection:"column"}}>
        {!nb?<div style={ES}>
          <div style={{width:48,height:48,borderRadius:12,background:"#f0e0e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#a05070",fontWeight:300,marginBottom:4}}>+</div>
          <div style={{fontSize:13,fontWeight:600,color:"#5a3a4a"}}>노트북을 선택해주세요</div>
          <div style={{fontSize:11,color:"#c0a0b0"}}>왼쪽에서 노트북을 클릭하세요</div>
        </div>:(
          <>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #ede8ec",background:"white"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#a05070",flexShrink:0}}/>
                <span style={{fontWeight:600,color:"#3a1a28",fontSize:13,letterSpacing:"-0.2px"}}>{nb.name}</span>
              </div>
              <div style={{fontSize:11,color:"#b09aa8",marginTop:2}}>{nb.chapters.length}개의 챕터</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"8px 8px 0"}}>
              {nb.chapters.map(ch=>(
                <div key={ch.id} style={{marginBottom:4}}>
                  <div onClick={()=>{setSelCh(ch.id);setSelPg(null);}}
                    style={{padding:"9px 12px",borderRadius:10,cursor:"pointer",background:selCh===ch.id?"#fce8f0":"#f8eaf2",border:`1px solid ${selCh===ch.id?"#e0b8cc":"#ede0e8"}`,display:"flex",alignItems:"center",gap:8,transition:"all 0.15s"}}>
                    <ChapterNameInput name={ch.name} onRename={name=>renameChapter(ch.id,name)}/>
                    <span style={{fontSize:10,color:"#c0a0b0",flexShrink:0}}>{ch.pages.length}p</span>
                    <button onClick={e=>{e.stopPropagation();deleteChapter(ch.id);}} title="챕터 삭제"
                      style={{background:"none",border:"none",cursor:"pointer",color:"#e0a0b8",fontSize:12,padding:"0 2px",lineHeight:1,flexShrink:0}}>🗑</button>
                  </div>
                  {ch.pages.map(pg=>(
                    <div key={pg.id} onClick={()=>{setSelCh(ch.id);setSelPg(pg.id);}}
                      style={{padding:"7px 12px 7px 24px",borderRadius:10,cursor:"pointer",background:selPg===pg.id?"#f5e0ea":"white",marginTop:3,marginLeft:10,border:`1px solid ${selPg===pg.id?"#d4a8bc":"#ede8ec"}`,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                      <PageNameInput name={pg.name} isSelected={selPg===pg.id} onRename={name=>renamePage(ch.id,pg.id,name)}/>
                      {pg.entries.length>0&&<span style={{fontSize:10,background:"#f5e0ea",color:"#a05070",padding:"1px 6px",borderRadius:20,flexShrink:0}}>{pg.entries.length}</span>}
                      <button onClick={e=>{e.stopPropagation();deletePage(ch.id,pg.id);}} title="페이지 삭제"
                        style={{background:"none",border:"none",cursor:"pointer",color:"#e0a0b8",fontSize:11,padding:"0 2px",lineHeight:1,flexShrink:0}}>🗑</button>
                    </div>
                  ))}
                  {selCh===ch.id&&<button onClick={()=>addPage(ch.id)} style={{display:"block",width:"calc(100% - 10px)",marginLeft:10,marginTop:3,background:"white",border:"1px dashed #d4b8c8",borderRadius:8,padding:"6px",cursor:"pointer",fontSize:11,color:"#a05070",fontFamily:"inherit"}}>+ 페이지 추가</button>}
                </div>
              ))}
            </div>
            <div style={{padding:"10px 8px",borderTop:"1px solid #ede8ec"}}>
              <button onClick={addChapter} style={{width:"100%",padding:"10px",fontFamily:"inherit",background:"white",border:"1px solid #e0c8d4",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,color:"#a05070"}}>+ 챕터 추가</button>
            </div>
          </>
        )}
      </div>

      {/* Col 3 */}
      <div style={{flex:1,background:"#fafafa",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {!page?<div style={ES}>
          <div style={{width:48,height:48,borderRadius:12,background:"#f0e8ec",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#a05070",fontWeight:300,marginBottom:4}}>+</div>
          <div style={{fontSize:14,fontWeight:600,color:"#3a2030"}}>페이지를 선택하거나 새로 만들어보세요</div>
          <div style={{fontSize:12,color:"#b09aa8"}}>먼저 왼쪽에서 노트북을 만들어주세요</div>
        </div>:(
          <>
            <div style={{padding:"11px 20px",background:"white",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:12,color:"#94a3b8"}}>
                <span style={{fontWeight:500,color:"#64748b"}}>{nb.name}</span>
                <span style={{color:"#c0bab2",margin:"0 6px"}}>›</span>
                <span style={{fontWeight:500,color:"#64748b"}}>{chapter?.name}</span>
                <span style={{color:"#c0bab2",margin:"0 6px"}}>›</span>
                <span style={{fontWeight:700,color:"#334155"}}>{page.name}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {saveMsg&&<span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>{saveMsg}</span>}
                <span style={{fontSize:11,background:"#eeece8",color:"#a05070",padding:"2px 10px",borderRadius:20}}>{page.entries.length}개의 항목</span>
                <button onClick={saveNotebooks} style={{padding:"5px 14px",background:"#a05070",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>💾 저장</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:20}}>
              {page.entries.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:60}}>아래 버튼으로 첫 엔트리를 추가해보세요! ✨</div>}
              {page.entries.map(e=><EntryEditor key={e.id} entry={e} onUpdate={d=>updateEntry(e.id,d)} onDelete={()=>deleteEntry(e.id)}/>)}
            </div>
            <div style={{padding:"12px 20px",borderTop:"1px solid #e2e8f0",background:"white",display:"flex",gap:10,alignItems:"center"}}>
              <button onClick={addEntry} style={{padding:"10px 24px",fontFamily:"inherit",background:"linear-gradient(135deg,#eeece8,#fce7f3)",border:"1px solid #b0aba3",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:600,color:"#a05070"}}>+ 엔트리 추가</button>
              <button onClick={saveNotebooks} style={{padding:"10px 20px",fontFamily:"inherit",background:"#a05070",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:600,color:"white"}}>💾 노트 저장</button>
              {saveMsg&&<span style={{fontSize:12,color:"#22c55e",fontWeight:600}}>{saveMsg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Quest Item (display only — timer state lives in Dashboard) ──
function QuestItem({quest,onStart,onPause,onResume,onUndo,onDelete,onEditMin,onEditLabel}){
  const [editingMin,setEditingMin]=useState(false);
  const [localMin,setLocalMin]=useState(quest.userMin);
  const [editingLabel,setEditingLabel]=useState(false);
  const [localLabel,setLocalLabel]=useState(quest.label);
  const {done,running,secs,userMin}=quest;
  const total=userMin*60;
  const pct=secs!==null?((total-secs)/total)*100:0;

  return(
    <div style={{background:done?"#f0fdf4":"#f8fafc",borderRadius:12,border:`1px solid ${done?"#86efac":"#e2e8f0"}`,padding:"11px 13px",transition:"all 0.25s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${done?"#22c55e":"#cbd5e1"}`,background:done?"#22c55e":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {done&&<span style={{color:"white",fontSize:10}}>✓</span>}
        </div>
        {editingLabel && !done ? (
          <input autoFocus value={localLabel}
            onChange={e=>setLocalLabel(e.target.value)}
            onBlur={()=>{onEditLabel(localLabel.trim()||quest.label);setEditingLabel(false);}}
            onKeyDown={e=>{if(e.key==="Enter"){onEditLabel(localLabel.trim()||quest.label);setEditingLabel(false);}if(e.key==="Escape")setEditingLabel(false);}}
            style={{flex:1,border:"none",borderBottom:"1.5px solid #a05070",outline:"none",fontSize:13,background:"transparent",fontFamily:"inherit",padding:"1px 0"}}
          />
        ) : (
          <span
            onDoubleClick={()=>!done&&!running&&setEditingLabel(true)}
            title={done?"":"더블클릭하여 이름 수정"}
            style={{flex:1,fontSize:13,color:done?"#94a3b8":"#334155",textDecoration:done?"line-through":"none",cursor:done||running?"default":"text"}}
          >{quest.label}</span>
        )}
        {!done&&(editingMin
          ?<input type="number" value={localMin} min={1} max={300} autoFocus
              onChange={e=>setLocalMin(Math.max(1,+e.target.value||1))}
              onBlur={()=>{onEditMin(localMin);setEditingMin(false);}}
              onKeyDown={e=>{if(e.key==="Enter"){onEditMin(localMin);setEditingMin(false);}}}
              style={{width:52,padding:"2px 6px",border:"1px solid #1e1e1e",borderRadius:6,fontSize:12,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
          :<span onClick={()=>!running&&!done&&setEditingMin(true)} title="클릭하여 시간 수정"
              style={{fontSize:12,color:"#a05070",background:"#eeece8",padding:"2px 8px",borderRadius:20,cursor:"pointer"}}>{userMin}분 ✎</span>
        )}
        <span style={{fontSize:12,color:"#a05070",fontWeight:700}}>+{quest.baseXp} XP</span>
        {!done&&!running&&<button onClick={onDelete} title="퀘스트 삭제" style={{background:"none",border:"none",cursor:"pointer",color:"#fca5a5",fontSize:13,padding:"0 2px",lineHeight:1,opacity:0.8}}>🗑</button>}
      </div>
      {!done&&(
        <div style={{marginTop:8}}>
          <div style={{height:4,background:"#e2e8f0",borderRadius:9999}}>
            <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#1e1e1e,#3d3d3d)",borderRadius:9999,transition:"width 1s linear"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5}}>
            <span style={{fontSize:11,color:"#94a3b8"}}>{secs!==null?`${fmt(secs)} 남음`:`목표 ${fmt(total)}`}</span>
            <div style={{display:"flex",gap:5}}>
              {!running&&secs===null&&<button onClick={onStart} style={SB("#a05070","white")}>▶ 시작</button>}
              {running&&<button onClick={onPause} style={SB("#f1f5f9","#64748b","#e2e8f0")}>⏸ 일시정지</button>}
              {!running&&secs!==null&&secs>0&&<button onClick={onResume} style={SB("#a05070","white")}>▶ 재개</button>}
            </div>
          </div>
        </div>
      )}
      {done&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
          <span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>✓ 완료! +{quest.baseXp} XP 획득</span>
          <button onClick={onUndo} style={{fontSize:11,background:"white",border:"1px solid #fecaca",borderRadius:6,padding:"2px 8px",cursor:"pointer",color:"#ef4444",fontFamily:"inherit"}}>↩ XP 취소</button>
        </div>
      )}
    </div>
  );
}

const SB=(bg,color,bc)=>({fontSize:11,background:bg,color,border:bc?`1px solid ${bc}`:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"});

// ── Study Timer ──
function StudyTimerCard({onStudySecs}){
  const [secs,setSecs]=useState(0);
  const [running,setRunning]=useState(false);
  const [tot,setTot]=useState(0);
  const iv=useRef(null);
  useEffect(()=>{
    if(running)iv.current=setInterval(()=>setSecs(s=>s+1),1000);
    else clearInterval(iv.current);
    return()=>clearInterval(iv.current);
  },[running]);
  const reset=()=>{setRunning(false);if(secs>0){setTot(t=>t+secs);onStudySecs(secs);}setSecs(0);};
  return(
    <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{alignSelf:"flex-start",fontSize:14,fontWeight:600,color:"#334155"}}>📚 학습 타이머</div>
      <div style={{width:110,height:110,borderRadius:"50%",border:"4px solid #eeece8",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8e6f0",boxShadow:"0 0 0 8px #f1f5f9"}}>
        <span style={{fontSize:24,fontWeight:800,color:"#334155",letterSpacing:2}}>{fmt(secs)}</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setRunning(r=>!r)} style={{background:running?"#ef4444":"#a05070",color:"white",border:"none",padding:"8px 18px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{running?"⏸ 일시정지":"▶ 시작"}</button>
        <button onClick={reset} style={{background:"#f1f5f9",border:"none",width:36,borderRadius:10,cursor:"pointer",fontSize:16,color:"#64748b"}}>↺</button>
      </div>
      <div style={{display:"flex",width:"100%",borderTop:"1px solid #f1f5f9",paddingTop:8}}>
        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:"#94a3b8"}}>오늘 학습 시간</div><div style={{fontSize:15,fontWeight:700,color:"#334155"}}>{fmt(tot+secs)}</div></div>
        <div style={{flex:1,textAlign:"center",borderLeft:"1px solid #f1f5f9"}}><div style={{fontSize:10,color:"#94a3b8"}}>현재 세션</div><div style={{fontSize:15,fontWeight:700,color:"#334155"}}>{fmt(secs)}</div></div>
      </div>
    </div>
  );
}

// ── 한국 법정 공휴일 (고정) ──
const KR_FIXED = {
  "01-01": "신정", "03-01": "삼일절", "05-05": "어린이날",
  "06-06": "현충일", "08-15": "광복절", "10-03": "개천절",
  "10-09": "한글날", "12-25": "크리스마스",
  "2026-01-28": "설날 연휴", "2026-01-29": "설날", "2026-01-30": "설날 연휴",
  "2026-05-24": "부처님오신날",
  "2026-09-24": "추석 연휴", "2026-09-25": "추석", "2026-09-26": "추석 연휴",
  "2025-01-28": "설날 연휴", "2025-01-29": "설날", "2025-01-30": "설날 연휴",
  "2025-05-05": "어린이날/부처님오신날",
  "2025-10-05": "추석 연휴", "2025-10-06": "추석", "2025-10-07": "추석 연휴",
};

function KoreanCalendar({ compact = false }) {
  const today = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [extra, setExtra] = useState({});
  const [fetchState, setFetchState] = useState("idle");
  const fetchedYears = useRef(new Set());

  const { year, month } = cur;
  const allHolidays = { ...KR_FIXED, ...extra };

  const getHoliday = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return allHolidays[`${y}-${mm}-${dd}`] || allHolidays[`${mm}-${dd}`] || null;
  };
  const isTempHoliday = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return !!extra[`${y}-${mm}-${dd}`];
  };

  const fetchTemp = async (y) => {
    if (fetchedYears.current.has(y)) return;
    fetchedYears.current.add(y);
    setFetchState("loading");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `당신은 한국 임시 공휴일 정보를 JSON으로만 반환하는 봇입니다.
응답은 반드시 다음 형식의 JSON 배열만 출력하세요. 다른 텍스트, 마크다운, 설명은 절대 포함하지 마세요:
[{"date":"YYYY-MM-DD","name":"공휴일 이름"}, ...]
임시 공휴일이 없으면 빈 배열 []을 반환하세요.`,
          messages: [{ role: "user", content: `${y}년 대한민국 임시 공휴일(정부 지정 임시공휴일, 대체공휴일 포함)을 웹에서 검색하고 JSON 배열로만 반환하세요. 설날·추석·법정 공휴일은 제외하고 임시·대체 공휴일만 포함하세요.` }]
        })
      });
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr) && arr.length > 0) {
          const merged = {};
          arr.forEach(({ date, name }) => { if (date && name) merged[date] = name; });
          setExtra(prev => ({ ...prev, ...merged }));
        }
      }
      setFetchState("done");
    } catch (e) { setFetchState("error"); }
  };

  useEffect(() => { fetchTemp(year); }, [year]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const DAY_KR = ["일","월","화","수","목","금","토"];
  const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  for (let d = 1; d <= 42 - cells.length; d++) cells.push({ day: d, current: false });

  return (
    <div style={{ background: "white", borderRadius: 14, padding: compact ? 12 : 16, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: compact ? 8 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: compact ? 12 : 14, fontWeight: 700, color: "#334155" }}>📅 캘린더</span>
          {fetchState === "loading" && (
            <span style={{ fontSize: 9, color: "#a05070", background: "#eeece8", padding: "1px 6px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#a05070", animation: "calPulse 1s infinite" }} />
              검색 중...
            </span>
          )}
          {fetchState === "done" && Object.keys(extra).length > 0 && (
            <span style={{ fontSize: 9, color: "#059669", background: "#d1fae5", padding: "1px 6px", borderRadius: 20 }}>✓ 반영됨</span>
          )}
          {fetchState === "error" && (
            <span style={{ fontSize: 9, color: "#ef4444", background: "#fee2e2", padding: "1px 6px", borderRadius: 20, cursor: "pointer" }}
              onClick={() => { fetchedYears.current.delete(year); fetchTemp(year); }}>
              ⚠️ 재시도
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 8 }}>
          <button onClick={() => setCur(c => { const m = c.month === 0 ? 11 : c.month-1; const y = c.month === 0 ? c.year-1 : c.year; return {year:y,month:m}; })}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: compact?22:26, height: compact?22:26, cursor: "pointer", fontSize: compact?11:14, color: "#64748b" }}>‹</button>
          <span style={{ fontSize: compact ? 11 : 14, fontWeight: 700, color: "#334155", minWidth: compact?60:70, textAlign: "center" }}>{year}년 {MONTH_NAMES[month]}</span>
          <button onClick={() => setCur(c => { const m = c.month === 11 ? 0 : c.month+1; const y = c.month === 11 ? c.year+1 : c.year; return {year:y,month:m}; })}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: compact?22:26, height: compact?22:26, cursor: "pointer", fontSize: compact?11:14, color: "#64748b" }}>›</button>
          <button onClick={() => setCur({ year: today.getFullYear(), month: today.getMonth() })}
            style={{ background: "#eeece8", border: "none", borderRadius: 6, padding: compact?"2px 7px":"3px 10px", cursor: "pointer", fontSize: compact?10:11, fontWeight: 600, color: "#a05070" }}>오늘</button>
        </div>
      </div>
      <style>{`@keyframes calPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
        {DAY_KR.map((d,i) => (
          <div key={d} style={{ textAlign:"center", fontSize: compact?9:11, fontWeight:700, padding: compact?"2px 0":"4px 0",
            color: i===0?"#ef4444":i===6?"#3b82f6":"#64748b" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
        {cells.map((cell, idx) => {
          const col = idx % 7;
          const isSun = col === 0, isSat = col === 6;
          const holiday = cell.current ? getHoliday(year, month, cell.day) : null;
          const isTemp = cell.current ? isTempHoliday(year, month, cell.day) : false;
          const isRed = isSun || (!!holiday && !isTemp);
          const isBlue = isSat && !holiday;
          const isAmber = isTemp && !isSun;
          const isToday = cell.current && year===today.getFullYear() && month===today.getMonth() && cell.day===today.getDate();
          const circleSize = compact ? 24 : 30;
          return (
            <div key={idx} title={holiday||undefined} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding: compact?"2px 0":"3px 0", position:"relative",
            }}>
              <div style={{
                width:circleSize, height:circleSize, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                background: isToday ? "#a05070"
                  : isTemp && cell.current ? "#fef9c3"
                  : "transparent",
                flexShrink:0,
              }}>
                <span style={{
                  fontSize: compact?10:12, fontWeight: isToday?800:cell.current?500:400,
                  color: isToday?"white" : !cell.current?"#d1d5db"
                    : isRed?"#ef4444" : isAmber?"#d97706" : isBlue?"#3b82f6" : "#334155",
                  lineHeight:1,
                }}>{cell.day}</span>
              </div>
              {!isToday && cell.current && isTemp && (
                <div style={{ width:3,height:3,borderRadius:"50%",background:"#f59e0b",marginTop:1 }}/>
              )}
              {!isToday && cell.current && holiday && !isTemp && (
                <div style={{ width:3,height:3,borderRadius:"50%",background:"#ef4444",marginTop:1 }}/>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div style={{ display:"flex",gap:12,marginTop:12,paddingTop:10,borderTop:"1px solid #f1f5f9",flexWrap:"wrap" }}>
          {[
            { dot:<div style={{width:10,height:10,borderRadius:"50%",background:"#a05070"}}/>, label:"오늘" },
            { dot:<div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444"}}/>, label:"공휴일/일요일" },
            { dot:<div style={{width:8,height:8,borderRadius:"50%",background:"#3b82f6"}}/>, label:"토요일" },
            { dot:<div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>, label:"임시 공휴일 (AI)" },
          ].map((l,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>{l.dot}<span style={{fontSize:10,color:"#64748b"}}>{l.label}</span></div>
          ))}
        </div>
      )}

      {compact && (
        <div style={{ display:"flex",gap:8,marginTop:8,flexWrap:"wrap" }}>
          {[
            { c:"#ef4444", label:"공휴일" },
            { c:"#3b82f6", label:"토요일" },
            { c:"#f59e0b", label:"임시" },
          ].map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:l.c}}/>
              <span style={{fontSize:9,color:"#94a3b8"}}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {!compact && (() => {
        const list = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const h = getHoliday(year, month, d);
          if (h) list.push({ day: d, name: h, isTemp: isTempHoliday(year, month, d) });
        }
        if (list.length === 0) return null;
        return (
          <div style={{ marginTop:10,padding:"8px 10px",background:"#f8e6f0",borderRadius:8,border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#475569",marginBottom:5 }}>이 달의 공휴일</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {list.map((u,i) => (
                <span key={i} style={{
                  fontSize:10,padding:"2px 8px",borderRadius:20,
                  background: u.isTemp?"#fef9c3":"#fff1f2",
                  color: u.isTemp?"#92400e":"#9f1239",
                  border:`1px solid ${u.isTemp?"#fde68a":"#fecdd3"}`,
                }}>
                  {month+1}/{u.day} {u.name}{u.isTemp?" ★임시":""}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Weekly Bar Chart ──
const DAY_LABELS=["일","월","화","수","목","금","토"];

function getWeekLabel(){
  const now=new Date();
  const month=now.getMonth()+1;
  const firstDay=new Date(now.getFullYear(),now.getMonth(),1).getDay();
  const weekNum=Math.ceil((now.getDate()+firstDay)/7);
  return `${month}월 ${weekNum}주차`;
}

function getDayDate(dayIdx){
  const now=new Date();
  const todayIdx=now.getDay();
  const diff=dayIdx-todayIdx;
  const d=new Date(now);
  d.setDate(d.getDate()+diff);
  return `${d.getMonth()+1}/${d.getDate()}`;
}

function WeeklyBarChart({title,barColor,data,unit,todayIdx}){
  const max=Math.max(...data,1);
  const [hovered,setHovered]=useState(null);
  return(
    <div style={{background:"white",borderRadius:12,padding:"14px 16px",border:"1px solid #ede8ec"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:"#3a2030"}}>{title}</span>
        <span style={{fontSize:10,color:"#b09aa8",background:"#f5eaf0",padding:"2px 8px",borderRadius:20}}>{getWeekLabel()}</span>
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
        {data.map((val,i)=>{
          const pct=Math.max((val/max)*100,2);
          const isToday=i===todayIdx;
          const isHov=hovered===i;
          return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",position:"relative",cursor:"default"}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
              {isHov&&(
                <div style={{position:"absolute",top:-38,left:"50%",transform:"translateX(-50%)",background:"#2d1a22",color:"white",fontSize:10,fontWeight:600,padding:"4px 8px",borderRadius:7,whiteSpace:"nowrap",zIndex:10,lineHeight:1.5,textAlign:"center"}}>
                  <div style={{color:"#e8b8cc",fontSize:9}}>{getDayDate(i)}</div>
                  <div>{val>0?`${val}${unit}`:`-`}</div>
                </div>
              )}
              <div style={{
                width:"100%", height:`${pct}%`,
                borderRadius:"5px 5px 0 0",
                background: isToday ? barColor : "#f0e0e8",
                transition:"height 0.4s ease",
                opacity: isHov ? 0.75 : 1,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:6,marginTop:6}}>
        {DAY_LABELS.map((d,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",fontSize:10,fontWeight:i===todayIdx?700:400,color:i===todayIdx?"#a05070":"#c0aab8"}}>
            {d}
          </div>
        ))}
      </div>
      <div style={{marginTop:10,borderTop:"1px solid #f0e8ec",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#b09aa8"}}>이번 주 합계</span>
        <span style={{fontSize:13,fontWeight:700,color:"#3a2030"}}>{data.reduce((a,b)=>a+b,0)}{unit}</span>
      </div>
    </div>
  );
}

// ── Dashboard ──
function Dashboard({xp,onXPChange,stats,setStats,xpFlash,activeTab}){
  const [quests,setQuests]=useState(()=>INIT_QUESTS.map(q=>({
    ...q, userMin:q.suggestedMin, secs:null, running:false, done:false,
  })));
  const [addingQ,setAddingQ]=useState(false);
  const [newQL,setNewQL]=useState("");

  useEffect(()=>{
    if(activeTab!=="dashboard"){
      setQuests(p=>p.map(q=>q.running?{...q,running:false}:q));
    }
  },[activeTab]);

  const ivRef=useRef(null);
  useEffect(()=>{
    ivRef.current=setInterval(()=>{
      setQuests(prev=>{
        let changed=false;
        const next=prev.map(q=>{
          if(!q.running||q.done)return q;
          changed=true;
          const newSecs=q.secs-1;
          if(newSecs<=0) return{...q,secs:0,running:false,done:true,_justDone:true};
          return{...q,secs:newSecs};
        });
        return changed?next:prev;
      });
    },1000);
    return()=>clearInterval(ivRef.current);
  },[]);

  useEffect(()=>{
    const today=new Date().getDay();
    quests.forEach(q=>{
      if(q._justDone){
        onXPChange(x=>x+q.baseXp);
        setStats(s=>{
          const wXP=[...s.weeklyXP]; wXP[today]=(wXP[today]||0)+q.baseXp;
          const wM=[...s.weeklyMins]; wM[today]=(wM[today]||0)+q.userMin;
          return{...s,questsDone:s.questsDone+1,studySecs:s.studySecs+q.userMin*60,weeklyXP:wXP,weeklyMins:wM};
        });
        setQuests(p=>p.map(qq=>qq.id===q.id?{...qq,_justDone:false}:qq));
      }
    });
  },[quests]);

  const upQ=(id,patch)=>setQuests(p=>p.map(q=>q.id===id?{...q,...patch}:q));

  const lvl=getLvl(xp);
  const rank=getRank(xp);
  const xpInLevel=xp-lvl.minXP;
  const xpNeeded=lvl.maxXP-lvl.minXP;
  const progress=Math.min((xpInLevel/xpNeeded)*100,100);
  const xpToNext=lvl.maxXP-xp;
  const qDone=quests.filter(q=>q.done).length;
  const earned=ALL_BADGES.filter(b=>b.req({...stats,xp,level:lvl.level}));

  const aiMode=xpToNext<=30?"xp":qDone===0?"warn":"basic";
  const aiCfg={
    warn: {msg:"아직 퀘스트를 완료하지 않았어요! 오늘 학습을 시작해보세요. 💪",bg:"#fdf0f4",border:"#f0c8d8",icon:"😤"},
    xp:   {msg:`레벨업까지 ${xpToNext} XP만 남았어요! 지금 학습하면 레벨업! 🎉`,bg:"#fce8f0",border:"#f0b8d0",icon:"🤩"},
    basic:{msg:"오늘도 잘게 성장해요! 퀘스트를 완료해보세요. 😊",bg:"#fdf0f5",border:"#f0c8d8",icon:"😊"},
  }[aiMode];

  const handleUndo=(qid,xpAmt,userMin)=>{
    const today=new Date().getDay();
    upQ(qid,{done:false,secs:null,running:false});
    onXPChange(x=>Math.max(0,x-xpAmt));
    setStats(s=>{
      const wXP=[...s.weeklyXP]; wXP[today]=Math.max(0,(wXP[today]||0)-xpAmt);
      const wM=[...s.weeklyMins]; wM[today]=Math.max(0,(wM[today]||0)-userMin);
      return{...s,questsDone:Math.max(0,s.questsDone-1),studySecs:Math.max(0,s.studySecs-userMin*60),weeklyXP:wXP,weeklyMins:wM};
    });
  };
  const deleteQuest=qid=>setQuests(p=>p.filter(q=>q.id!==qid));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,paddingTop:10}}>
      <div style={{background:"white",borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,background:"linear-gradient(135deg,#eeece8,#fae8ff)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🌱</div>
          <div><div style={{fontWeight:700,color:"#1e293b"}}>D+Puzzle Lv.{lvl.level}</div><div style={{fontSize:12,color:"#94a3b8"}}>다음 레벨까지 {Math.max(0,xpToNext)} XP 남음</div></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:"#a05070"}}>{Math.round(progress)}%</div><div style={{fontSize:11,color:"#94a3b8"}}>{xp} / {lvl.maxXP} XP</div></div>
      </div>
      <div style={{background:"#e2e8f0",height:8,borderRadius:9999,marginTop:-8}}>
        <div style={{width:`${progress}%`,height:"100%",background:xpFlash?"linear-gradient(90deg,#d9d4cc,#ec4899,#d9d4cc)":"linear-gradient(90deg,#1e1e1e,#3d3d3d)",borderRadius:9999,transition:"width 0.5s ease, background 0.4s ease",boxShadow:xpFlash?"0 0 10px rgba(236,72,153,0.6)":"none"}}/>
      </div>

      <div className="dash-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #e2e8f0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:14,fontWeight:600,color:"#334155"}}>🎯 오늘의 퀘스트</span>
            <span style={{marginLeft:"auto",fontSize:11,color:"#a05070",background:"#eeece8",padding:"2px 8px",borderRadius:20}}>{qDone}/{quests.length} 완료</span>
            <button onClick={()=>setAddingQ(true)} style={{border:"none",background:"#f1f5f9",width:22,height:22,borderRadius:6,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>+</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {quests.map(q=>(
              <QuestItem key={q.id} quest={q}
                onStart={()=>upQ(q.id,{secs:q.userMin*60,running:true})}
                onPause={()=>upQ(q.id,{running:false})}
                onResume={()=>upQ(q.id,{running:true})}
                onUndo={()=>handleUndo(q.id,q.baseXp,q.userMin)}
                onDelete={()=>deleteQuest(q.id)}
                onEditMin={m=>upQ(q.id,{userMin:m,secs:null,running:false})}
                onEditLabel={label=>upQ(q.id,{label})}
              />
            ))}
          </div>
          {addingQ&&(
            <div style={{marginTop:10,display:"flex",gap:6}}>
              <input autoFocus value={newQL} onChange={e=>setNewQL(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&newQL.trim()){setQuests(p=>[...p,{id:Date.now(),label:newQL.trim(),baseXp:10,suggestedMin:15,userMin:15,secs:null,running:false,done:false}]);setNewQL("");setAddingQ(false);}if(e.key==="Escape")setAddingQ(false);}}
                placeholder="퀘스트 이름..." style={{flex:1,padding:"6px 8px",border:"1px solid #1e1e1e",borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
              <button onClick={()=>setAddingQ(false)} style={{padding:"4px 8px",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>취소</button>
            </div>
          )}
          <div style={{marginTop:12,background:"#fffbeb",borderRadius:10,padding:"10px 12px",border:"1px solid #fde68a"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#f59e0b",marginBottom:4}}>💡 스마트 XP 계산 예시:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px",fontSize:11,color:"#64748b"}}>
              <span>• 50분 학습 → 20 XP</span><span>• 단어 20개 → 15 XP</span>
              <span>• 오래 10개 → 10 XP</span><span>• 줄넘기 1회 → 10 XP</span>
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <KoreanCalendar compact/>
          <div style={{background:aiCfg.bg,borderRadius:14,padding:14,border:`1px solid ${aiCfg.border}`}}>
            <div style={{fontSize:14,fontWeight:600,color:"#334155",marginBottom:8}}>🤖 AI 가이드</div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:22}}>{aiCfg.icon}</span>
              <span style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{aiCfg.msg}</span>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              {[
                {key:"warn",label:"⚠️ 경고", bg:"#fce8f0",col:"#9b3060",bc:"#f0b8d0"},
                {key:"xp",  label:"✨ XP 팁",bg:"#fce8f0",col:"#9b3060",bc:"#f0b8d0"},
                {key:"basic",label:"🔆 기본",bg:"#fce8f0",col:"#a05070",bc:"#f0b8d0"},
              ].map(t=>(
                <span key={t.key} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:aiMode===t.key?t.bg:"#f1f5f9",color:aiMode===t.key?t.col:"#94a3b8",border:`1px solid ${aiMode===t.key?t.bc:"#e2e8f0"}`,fontWeight:aiMode===t.key?600:400,transition:"all 0.3s"}}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:14,fontWeight:600,color:"#334155"}}>🏅 배지 컬렉션</span>
          <span style={{marginLeft:"auto",fontSize:11,color:"#a05070",background:"#eeece8",padding:"2px 8px",borderRadius:20}}>{earned.length}/{ALL_BADGES.length} 획득</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          {ALL_BADGES.map(b=>{
            const ok=b.req({...stats,xp,level:lvl.level});
            return(
              <div key={b.id} title={b.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:ok?"linear-gradient(135deg,#eeece8,#fae8ff)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`2px solid ${ok?"#b0aba3":"#e2e8f0"}`,filter:ok?"none":"grayscale(1) opacity(0.4)",transition:"all 0.3s",boxShadow:ok?"0 2px 8px rgba(99,102,241,0.2)":"none"}}>{b.emoji}</div>
                <span style={{fontSize:9,color:ok?"#a05070":"#94a3b8",textAlign:"center",lineHeight:1.2,fontWeight:ok?600:400}}>{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:14,fontWeight:600,color:"#334155"}}>📊 월간 리포트</span>
          <span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto"}}>{new Date().getFullYear()}년 {new Date().getMonth()+1}월</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
          {[
            {icon:"⚡",label:"총 획득 XP",   val:`${xp} XP`},
            {icon:"⏱️",label:"총 학습 시간", val:`${Math.round(stats.studySecs/60)}분`},
            {icon:"🔥",label:"연속 기록",    val:`${stats.streak}일`},
            {icon:"🏅",label:"획득 배지",    val:`${earned.length}개`},
          ].map((s,i)=>(
            <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:4,border:"1px solid #e2e8f0"}}>
              <span style={{fontSize:18}}>{s.icon}</span>
              <span style={{fontSize:11,color:"#64748b"}}>{s.label}</span>
              <span style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{s.val}</span>
            </div>
          ))}
        </div>

        <div className="chart-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <WeeklyBarChart title="이번 주 획득 XP" barColor="#a05070" data={stats.weeklyXP} unit="XP" todayIdx={new Date().getDay()}/>
          <WeeklyBarChart title="이번 주 학습 시간" barColor="#c07090" data={stats.weeklyMins} unit="분" todayIdx={new Date().getDay()}/>
        </div>

        <div style={{fontSize:13,fontWeight:600,color:"#334155",marginBottom:10}}>🏆 월간 랭킹 기준</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {RANKS.map(r=>{
            const cur=getRank(xp).name===r.name;
            return(
              <div key={r.name} style={{borderRadius:12,padding:14,textAlign:"center",border:`2px solid ${cur?r.border:"#e2e8f0"}`,background:cur?r.bg:"#f8fafc",opacity:xp>=r.minXP?1:0.5,transition:"all 0.3s"}}>
                <div style={{fontSize:24}}>{r.icon}</div>
                <div style={{fontWeight:700,color:r.color,marginTop:4}}>{r.name}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{r.minXP}+ XP</div>
                {cur&&<div style={{fontSize:10,background:"#fde68a",color:"#92400e",padding:"2px 8px",borderRadius:20,fontWeight:600,marginTop:6,display:"inline-block"}}>현재 등급</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Celebration Modal ──
function CelebrationModal({type,value,onClose}){
  const cfg={
    level:{icon:"🎉",title:"레벨 업!",    sub:"새 레벨에 도달했어요! 계속 성장해보세요 🌱",grad:"linear-gradient(135deg,#1e1e1e,#3d3d3d)"},
    rank: {icon:"🏆",title:"등급 상승!",  sub:"더 높은 등급으로 올라갔어요! 대단해요! ✨", grad:"linear-gradient(135deg,#f59e0b,#ef4444)"},
    badge:{icon:"🏅",title:"배지 획득!",  sub:"새 배지를 획득했어요! 계속 도전해보세요 🎊",grad:"linear-gradient(135deg,#22c55e,#3b82f6)"},
  }[type]||{};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes pop{from{transform:scale(0.7) translateY(30px);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{background:"white",borderRadius:24,padding:"40px 44px",textAlign:"center",maxWidth:380,width:"90%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",animation:"pop 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{fontSize:64,marginBottom:10}}>{cfg.icon}</div>
        <div style={{fontSize:26,fontWeight:800,color:"#1e293b",marginBottom:6}}>{cfg.title}</div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8,background:cfg.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{value}</div>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:28}}>{cfg.sub}</div>
        <button onClick={onClose} style={{background:cfg.grad,color:"white",border:"none",padding:"13px 36px",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(160,80,112,0.15)"}}>계속하기 🚀</button>
      </div>
    </div>
  );
}

function DefaultAvatar({size=40, style={}}){
  return(
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display:"block",borderRadius:"50%",...style}}>
      <rect width="100" height="100" fill="#c8d3db"/>
      <circle cx="50" cy="37" r="18" fill="#9baab4"/>
      <ellipse cx="50" cy="85" rx="32" ry="22" fill="#9baab4"/>
    </svg>
  );
}

function AvatarImg({src, size=36, border="2px solid #d4d0ca", style={}}){
  const base={width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,display:"block",...style};
  if(src){
    return <img src={src} alt="avatar" style={{...base,objectFit:"cover",border}}/>;
  }
  return(
    <div style={{...base,border}}>
      <DefaultAvatar size={size}/>
    </div>
  );
}

function ProfileModal({profile,onSave,onClose,onLogout,onWithdraw}){
  const [name,setName]=useState(profile.name);
  const [avatarSrc,setAvatarSrc]=useState(profile.avatarSrc||null);
  const [bio,setBio]=useState(profile.bio||"");
  const [goal,setGoal]=useState(profile.goal||"");
  const fileRef=useRef(null);
  const [dragOver,setDragOver]=useState(false);

  const loadFile=file=>{
    if(!file||!file.type.startsWith("image/"))return;
    const reader=new FileReader();
    reader.onload=e=>setAvatarSrc(e.target.result);
    reader.readAsDataURL(file);
  };

  const inputStyle={width:"100%",padding:"9px 12px",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border 0.15s"};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:24,padding:"32px 36px",width:420,maxWidth:"92vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>
        <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{animation:"slideUp 0.25s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>프로필 수정</div>
            <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b"}}>✕</button>
          </div>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
              <div style={{width:96,height:96,borderRadius:"50%",overflow:"hidden",border:"3px solid #d4d0ca",boxShadow:"0 4px 18px rgba(99,102,241,0.2)",margin:"0 auto"}}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  : <DefaultAvatar size={96}/>
                }
              </div>
              <button onClick={()=>fileRef.current?.click()}
                style={{position:"absolute",bottom:2,right:2,width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#1e1e1e,#3d3d3d)",border:"2px solid white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                📷
              </button>
            </div>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);loadFile(e.dataTransfer.files[0]);}}
              onClick={()=>fileRef.current?.click()}
              style={{border:`2px dashed ${dragOver?"#a05070":"#d4d0ca"}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",background:dragOver?"#f5f4f2":"#f8fafc",transition:"all 0.2s"}}>
              <div style={{fontSize:20,marginBottom:4}}>🖼️</div>
              <div style={{fontSize:12,color:"#a05070",fontWeight:600}}>클릭 또는 이미지를 드래그하세요</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>JPG, PNG, GIF 지원</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e=>loadFile(e.target.files[0])}/>
            {avatarSrc&&(
              <button onClick={()=>setAvatarSrc(null)}
                style={{marginTop:8,background:"none",border:"none",fontSize:12,color:"#94a3b8",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>
                기본 이미지로 초기화
              </button>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:4}}>이름</label>
              <input value={name} onChange={e=>setName(e.target.value)} maxLength={20} style={inputStyle}
                onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                placeholder="이름을 입력하세요"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:4}}>한 줄 소개</label>
              <input value={bio} onChange={e=>setBio(e.target.value)} maxLength={40} style={inputStyle}
                onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                placeholder="나를 한 줄로 표현해보세요"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:4}}>학습 목표</label>
              <input value={goal} onChange={e=>setGoal(e.target.value)} maxLength={40} style={inputStyle}
                onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                placeholder="오늘의 목표를 적어보세요"/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",border:"1px solid #e2e8f0",borderRadius:12,background:"white",fontSize:14,cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>취소</button>
            <button onClick={()=>{onSave({name:name.trim()||"학습자",avatarSrc,bio,goal});onClose();}}
              style={{flex:2,padding:"11px",border:"none",borderRadius:12,background:"#a05070",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              저장하기 ✓
            </button>
          </div>
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #f0e8ec",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={onLogout}
                style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>
                로그아웃
              </button>
              <WithdrawButton onWithdraw={onWithdraw}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawButton({onWithdraw}){
  const [step,setStep]=useState(0);
  if(step===0) return(
    <button onClick={()=>setStep(1)}
      style={{fontSize:12,color:"#ef4444",background:"none",border:"1px solid #fecaca",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>
      회원 탈퇴
    </button>
  );
  return(
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <span style={{fontSize:11,color:"#ef4444"}}>정말요?</span>
      <button onClick={onWithdraw}
        style={{fontSize:12,color:"white",background:"#ef4444",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
        탈퇴
      </button>
      <button onClick={()=>setStep(0)}
        style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>
        취소
      </button>
    </div>
  );
}

function Confetti(){
  const pieces=Array.from({length:48},(_,i)=>({
    id:i,x:Math.random()*100,delay:Math.random()*1.2,dur:1.4+Math.random()*0.8,
    size:6+Math.random()*7,color:["#a05070","#a05070","#ec4899","#f59e0b","#22c55e","#3b82f6"][Math.floor(Math.random()*6)],
    rot:Math.random()*360,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:2000,overflow:"hidden"}}>
      <style>{`@keyframes cffall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map(p=>(
        <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:0,width:p.size,height:p.size,borderRadius:p.id%3===0?"50%":3,background:p.color,animation:`cffall ${p.dur}s ${p.delay}s ease-in forwards`,transform:`rotate(${p.rot}deg)`}}/>
      ))}
    </div>
  );
}

function NotificationBar({onClose}){
  return(
    <div style={{background:"linear-gradient(90deg,#fce7f3,#f0eee9)",borderBottom:"1px solid #d9d4cc",padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,position:"relative"}}>
      <span style={{fontSize:13,color:"#9d174d"}}>🎉 새로운 등급 <b>'Premium'</b>이 업데이트되었습니다!</span>
      <button onClick={()=>{}} style={{fontSize:12,fontWeight:700,color:"#a05070",background:"white",border:"1px solid #c0bab2",borderRadius:20,padding:"2px 12px",cursor:"pointer",fontFamily:"inherit"}}>지금 확인하기</button>
      <button onClick={onClose} style={{position:"absolute",right:16,background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,lineHeight:1}}>✕</button>
    </div>
  );
}

const FEATURES=[
  {id:"xp",icon:"✨",title:"실시간 XP 환산",desc:"학습 완료 즉시 XP가 오르는 애니메이션 모드. 공부를 퀘스트 보상처럼 느끼게 합니다.",
   visual:(<div style={{padding:20}}><div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #e2e8f0",marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:"#334155",marginBottom:8}}>D+Puzzle Lv.3 — 68%</div><div style={{background:"#e2e8f0",height:10,borderRadius:99,overflow:"hidden"}}><div style={{width:"68%",height:"100%",background:"linear-gradient(90deg,#d9d4cc,#ec4899)",borderRadius:99,boxShadow:"0 0 8px rgba(236,72,153,0.5)",animation:"xpGlow 1.5s ease-in-out infinite alternate"}}/></div><style>{`@keyframes xpGlow{from{opacity:0.7;box-shadow:0 0 4px rgba(236,72,153,0.3)}to{opacity:1;box-shadow:0 0 16px rgba(236,72,153,0.7)}}`}</style></div><div style={{display:"flex",gap:8}}>{[{l:"수학 30분",xp:"+20 XP",done:true},{l:"영단어 20개",xp:"+15 XP",done:false}].map((q,i)=>(<div key={i} style={{flex:1,background:q.done?"#f0fdf4":"#f8fafc",borderRadius:10,padding:"10px 12px",border:`1px solid ${q.done?"#86efac":"#e2e8f0"}`}}><div style={{fontSize:11,fontWeight:600,color:q.done?"#15803d":"#334155"}}>{q.l}</div><div style={{fontSize:10,color:"#a05070",marginTop:2}}>{q.xp}</div></div>))}</div></div>)},
  {id:"note",icon:"📝",title:"스마트 성장 노트",desc:"볼드/색상 편집부터 엔트리 접기까지, 복잡한 내용을 체계적으로 정리하는 맞춤형 공간.",
   visual:(<div style={{padding:20}}><div style={{background:"white",borderRadius:14,padding:14,border:"1px solid #e2e8f0"}}><div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:8}}>📓 수학 — 미적분 노트</div><div style={{fontSize:13,lineHeight:1.9,color:"#334155"}}><span style={{fontWeight:800}}>극한의 정의:</span> lim f(x) = L<br/><span style={{color:"#a05070"}}>연속 함수</span>의 조건은 세 가지...<br/><span style={{background:"#fef9c3",padding:"1px 4px",borderRadius:4}}>★ 시험 출제 포인트!</span></div><div style={{marginTop:10,padding:"6px 10px",background:"#f8fafc",borderRadius:8,fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}><span>∧ 접기</span><span style={{color:"#c0bab2"}}>|</span><span>2번 항목 (접힘)</span></div></div></div>)},
  {id:"streak",icon:"🔥",title:"연속 기록(스트릭)",desc:"멈추지 않는 성장의 증거. 기록이 끊기지 않도록 AI 가이드가 실시간으로 관리해 줍니다.",
   visual:(<div style={{padding:20}}><div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:14,padding:16,border:"1px solid #fde68a",textAlign:"center"}}><div style={{fontSize:48,marginBottom:4,animation:"flicker 0.8s ease-in-out infinite alternate"}}>🔥</div><style>{`@keyframes flicker{from{transform:scale(1)}to{transform:scale(1.12)}}`}</style><div style={{fontSize:22,fontWeight:800,color:"#92400e"}}>7일 연속!</div><div style={{marginTop:12,background:"#fff7ed",borderRadius:10,padding:"10px 14px",border:"1px solid #fed7aa",fontSize:13,color:"#c2410c"}}>😤 AI: "기록을 지켜주세요! 오늘 학습 안 하면 XP 차감됩니다."</div></div></div>)},
  {id:"report",icon:"📊",title:"월간 성장 리포트",desc:"지난달 대비 성장률과 등급 변화를 시각적으로 대조하여 명확한 피드백을 제공합니다.",
   visual:(<div style={{padding:20}}><div style={{background:"white",borderRadius:14,padding:14,border:"1px solid #e2e8f0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:"#334155"}}>이번 달 성장</span><span style={{fontSize:12,fontWeight:800,color:"#22c55e"}}>+45% ↑</span></div><div style={{display:"flex",gap:8,marginBottom:10}}>{["Bronze","Gold"].map((r,i)=>(<div key={r} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,background:i===0?"#f1f5f9":"#fffbeb",border:`1px solid ${i===0?"#e2e8f0":"#fde68a"}`}}><div style={{fontSize:20}}>{i===0?"🥉":"🥇"}</div><div style={{fontSize:11,fontWeight:700,color:i===0?"#64748b":"#b45309",marginTop:2}}>{r}</div></div>))}</div><div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f0fdf4",borderRadius:8,border:"1px solid #86efac"}}><span style={{fontSize:16}}>🎊</span><span style={{fontSize:11,color:"#15803d"}}>Bronze → Gold 등급 상승!</span></div></div></div>)},
  {id:"ai",icon:"🤖",title:"AI 페이스메이커",desc:"축하, 경고, 요약 멘트까지. 외롭지 않은 공부를 위해 상황에 맞게 반응하는 가이드.",
   visual:(<div style={{padding:20}}><div style={{background:"linear-gradient(135deg,#fdf4ff,#eff6ff)",borderRadius:14,padding:14,border:"1px solid #ece8e2"}}><div style={{fontSize:13,fontWeight:700,color:"#334155",marginBottom:8}}>🤖 AI 가이드</div>{[{icon:"🎉",msg:"레벨업 달성! 정말 대단해요! 이 기세로 계속 go!",bg:"#f0fdf4",bc:"#86efac"},{icon:"😤",msg:"오늘 퀘스트 아직 안 했어요. 10분만 시작해볼까요?",bg:"#fffbeb",bc:"#fde68a"},{icon:"😊",msg:"오늘도 잘게 성장해요! 퀘스트를 완료해보세요.",bg:"#eff6ff",bc:"#bfdbfe"}].map((m,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 10px",borderRadius:8,background:m.bg,border:`1px solid ${m.bc}`,marginBottom:6}}><span style={{fontSize:16,flexShrink:0}}>{m.icon}</span><span style={{fontSize:11,color:"#334155",lineHeight:1.5}}>{m.msg}</span></div>))}</div></div>)},
];

function HomePage({onStart,onLogin}){
  const [activeFeat,setActiveFeat]=useState("xp");
  const feat=FEATURES.find(f=>f.id===activeFeat)||FEATURES[0];
  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:"#ffffff"}}>
      <div style={{background:"#faeaf2",padding:"96px 20px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-120,left:"5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(160,80,112,0.04) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-140,right:"5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(160,80,112,0.03) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f2d8ea",border:"1px solid #e8e8ec",borderRadius:20,padding:"5px 15px",fontSize:12,color:"#666666",fontWeight:600,marginBottom:32}}>✦ 학습을 게임처럼, 성장을 수집처럼</div>
          <h1 style={{fontSize:52,fontWeight:900,color:"#2d0a1a",lineHeight:1.15,marginBottom:20,letterSpacing:"-1.5px"}}>마침내,<br/><span style={{color:"#a05070"}}>성장이 수집됩니다.</span></h1>
          <p style={{fontSize:15,color:"#8a5068",lineHeight:1.9,marginBottom:44,maxWidth:460,margin:"0 auto 44px"}}>공부 시간을 경험치(XP)로, 학습 기록을 레벨(Level)로.<br/>당신의 모든 노력이 수치로 증명되는 유일한 공간.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={onStart} style={{background:"#a05070",color:"white",border:"none",padding:"13px 32px",borderRadius:11,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 14px rgba(160,80,112,0.15)",letterSpacing:"-0.2px"}}>무료로 시작하기 →</button>
            <button onClick={onLogin} style={{background:"white",color:"#333344",border:"1.5px solid #e0e0e8",padding:"13px 28px",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>로그인</button>
          </div>
        </div>
      </div>
      <div style={{background:"#f5e0ec",borderTop:"1px solid #e8c8d8",borderBottom:"1px solid #e8c8d8",padding:"22px 20px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"center",gap:56}}>
          {[["🎯","퀘스트 완료","매일 달성"],["⚡","XP 시스템","자동 적립"],["🏆","등급 4단계","Bronze ~ Premium"],["🤖","AI 가이드","상황 인식"]].map(([ic,t,s],i)=>(
            <div key={i} style={{textAlign:"center"}}><div style={{fontSize:20,marginBottom:5}}>{ic}</div><div style={{fontSize:12,fontWeight:700,color:"#2d0a1a"}}>{t}</div><div style={{fontSize:11,color:"#b07090",marginTop:1}}>{s}</div></div>
          ))}
        </div>
      </div>
      <div style={{background:"white",padding:"64px 20px",textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:"#faeaf2",borderRadius:16,padding:"10px 24px",marginBottom:24}}>
            <span style={{fontSize:26,fontWeight:900,color:"#a05070",letterSpacing:"-0.5px"}}>D</span>
            <span style={{fontSize:26,fontWeight:900,color:"#c07090",letterSpacing:"-0.5px"}}>+</span>
            <span style={{fontSize:26,fontWeight:900,color:"#a05070",letterSpacing:"-0.5px"}}>Puzzle</span>
          </div>
          <p style={{fontSize:18,fontWeight:700,color:"#3a1a28",lineHeight:1.7,letterSpacing:"-0.3px"}}>오늘의 할 일, 내일의 할 일,</p>
          <p style={{fontSize:18,fontWeight:700,color:"#a05070",lineHeight:1.7,letterSpacing:"-0.3px",marginBottom:16}}>하루하루 한 조각의 지식으로 완성해보세요!</p>
          <p style={{fontSize:13.5,color:"#9a7a8a",lineHeight:1.9,maxWidth:480,margin:"0 auto"}}><b style={{color:"#a05070"}}>D</b>는 <b style={{color:"#a05070"}}>Daily</b>(매일)과 <b style={{color:"#a05070"}}>Day</b>(하루)를, <b style={{color:"#a05070"}}>Puzzle</b>은 한 조각씩 맞춰가는 성장을 의미해요.<br/>매일 하루하루, 퍼즐을 완성하듯 당신의 지식을 쌓아가세요.</p>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:28,flexWrap:"wrap"}}>
            {["📅 Daily","🧩 Puzzle","📈 Growth","✨ XP"].map((t,i)=>(<span key={i} style={{background:"#faeaf2",color:"#a05070",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:600,border:"1px solid #f0d0e0"}}>{t}</span>))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:940,margin:"64px auto",padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,color:"#b07090",letterSpacing:2.5,marginBottom:10,textTransform:"uppercase"}}>Core Features</div>
          <h2 style={{fontSize:28,fontWeight:800,color:"#2d0a1a",marginBottom:10,letterSpacing:"-0.5px"}}>핵심 기능 소개</h2>
          <p style={{fontSize:13.5,color:"#b07090"}}>항목을 클릭하면 기능을 미리 확인할 수 있어요</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {FEATURES.map(f=>(
              <button key={f.id} onClick={()=>setActiveFeat(f.id)} style={{textAlign:"left",padding:"14px 18px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeFeat===f.id?"#f2d8ea":"#f8e6f0",borderLeft:activeFeat===f.id?"3px solid #a05070":"3px solid transparent",transition:"all 0.15s"}}>
                <div style={{fontSize:13.5,fontWeight:700,color:activeFeat===f.id?"#a05070":"#555566"}}>{f.icon} {f.title}</div>
                {activeFeat===f.id&&<div style={{fontSize:12,color:"#8a5068",marginTop:5,lineHeight:1.65}}>{f.desc}</div>}
              </button>
            ))}
          </div>
          <div style={{background:"white",borderRadius:16,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1px solid #e8c8d8",overflow:"hidden",minHeight:300,transition:"all 0.25s"}}>
            <div style={{background:"#f2d8ea",borderBottom:"1px solid #e8c8d8",padding:"10px 16px",display:"flex",gap:6,alignItems:"center"}}>
              {["#ff6b6b","#ffd166","#06d6a0"].map((c,i)=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:c,opacity:0.6}}/>)}
              <span style={{fontSize:11,color:"#b07090",marginLeft:6}}>D+Puzzle — {feat.title}</span>
            </div>
            {feat.visual}
          </div>
        </div>
      </div>
      <div style={{background:"linear-gradient(160deg,#2d0a1a 0%,#3d1428 60%,#4a1e35 100%)",padding:"72px 20px",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#a05070",letterSpacing:2.5,marginBottom:14,textTransform:"uppercase"}}>Get Started Free</div>
        <h2 style={{fontSize:28,fontWeight:800,color:"white",marginBottom:12,letterSpacing:"-0.4px",lineHeight:1.3}}>지금 바로 성장을 시작하세요</h2>
        <p style={{fontSize:13.5,color:"rgba(255,255,255,0.42)",marginBottom:34}}>무료로 시작하고, 오늘 첫 XP를 획득해보세요 ✨</p>
        <button onClick={onStart} style={{background:"#a05070",color:"white",border:"none",padding:"13px 38px",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(160,80,112,0.15)"}}>무료로 시작하기 🚀</button>
      </div>
    </div>
  );
}

function AuthModal({mode:initMode="login",accounts={},onAuth,onClose}){
  const [mode,setMode]=useState(initMode);
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const validate=()=>{
    if(!email.includes("@")||!email.includes(".")) return "올바른 이메일 주소를 입력해주세요.";
    if(pw.length<6) return "비밀번호는 최소 6자 이상이어야 합니다.";
    if(mode==="signup"){
      if(name.trim().length<2) return "이름은 최소 2자 이상이어야 합니다.";
      if(accounts[email]) return "이미 가입된 이메일입니다. 로그인해주세요.";
    }
    if(mode==="login"){
      if(!accounts[email]) return "등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.";
      if(accounts[email].pw!==pw) return "비밀번호가 올바르지 않습니다.";
    }
    return null;
  };

  const submit=()=>{
    const e=validate(); if(e){setErr(e);return;}
    setLoading(true);
    setTimeout(()=>{
      const res=onAuth({email,pw,name:name.trim(),mode});
      if(res){setErr(res);setLoading(false);}
    },700);
  };

  const F={width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border 0.15s",background:"#f8e6f0"};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <style>{`@keyframes authIn{from{transform:translateY(24px) scale(0.97);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:24,padding:"36px 40px",width:420,maxWidth:"92vw",boxShadow:"0 32px 80px rgba(160,80,112,0.15)",animation:"authIn 0.28s cubic-bezier(0.22,1,0.36,1)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-block",background:"#a05070",borderRadius:14,padding:"10px 18px",fontSize:18,fontWeight:900,color:"white",letterSpacing:"-0.3px",marginBottom:16}}>D+Puzzle</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{mode==="login"?"다시 만나서 반가워요!":"성장을 시작해요 🌱"}</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:6}}>{mode==="login"?"계속하려면 로그인하세요":"무료로 시작, 언제든 취소 가능"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="signup"&&(
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>이름</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={F}
                onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>
          )}
          <div>
            <label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>이메일</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="hello@example.com" style={F}
              onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <label style={{fontSize:12,fontWeight:600,color:"#475569"}}>비밀번호</label>
              {mode==="login"&&<span style={{fontSize:11,color:"#a05070",cursor:"pointer"}}>비밀번호를 잊으셨나요?</span>}
            </div>
            <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="6자 이상 입력" style={F}
              onFocus={e=>e.target.style.borderColor="#a05070"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
        </div>
        {err&&<div style={{marginTop:10,padding:"8px 12px",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:8,fontSize:12,color:"#be123c"}}>{err}</div>}
        <button onClick={submit} style={{width:"100%",marginTop:20,padding:"13px",borderRadius:12,border:"none",background:loading?"#e2e8f0":"#a05070",color:loading?"#94a3b8":"white",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
          {loading?"처리 중...":(mode==="login"?"로그인":"무료로 시작하기")}
        </button>
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#64748b"}}>
          {mode==="login"?"아직 계정이 없으신가요? ":"이미 계정이 있으신가요? "}
          <span onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{color:"#a05070",fontWeight:700,cursor:"pointer"}}>
            {mode==="login"?"회원가입":"로그인"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BlueMind(){
  const [tab,setTab]=useState("home");
  const loadLS=(key,fallback)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}};
  const [xp,setXP]=useState(()=>loadLS("bm_xp",0));
  const [stats,setStats]=useState(()=>loadLS("bm_stats",{streak:0,questsDone:0,studySecs:0,entries:0,weeklyXP:[0,0,0,0,0,0,0],weeklyMins:[0,0,0,0,0,0,0],lastActiveDate:null,missedDays:0}));
  const [celebration,setCelebration]=useState(null);
  const [profile,setProfile]=useState(()=>loadLS("bm_profile",{name:"학습자",avatarSrc:null,bio:"",goal:""}));
  const [showProfile,setShowProfile]=useState(false);
  const [showNotifBar,setShowNotifBar]=useState(true);
  const [showConfetti,setShowConfetti]=useState(false);
  const [xpFlash,setXpFlash]=useState(false);
  const [authModal,setAuthModal]=useState(null);
  const [loggedIn,setLoggedIn]=useState(()=>loadLS("bm_loggedIn",false));
  const [accounts,setAccounts]=useState(()=>loadLS("bm_accounts",{}));
  const prevXP=useRef(0);
  const prevBadges=useRef([]);

  useEffect(()=>{try{localStorage.setItem("bm_xp",JSON.stringify(xp));}catch{}},[xp]);
  useEffect(()=>{try{localStorage.setItem("bm_stats",JSON.stringify(stats));}catch{}},[stats]);
  useEffect(()=>{try{localStorage.setItem("bm_profile",JSON.stringify(profile));}catch{}},[profile]);
  useEffect(()=>{try{localStorage.setItem("bm_loggedIn",JSON.stringify(loggedIn));}catch{}},[loggedIn]);
  useEffect(()=>{try{localStorage.setItem("bm_accounts",JSON.stringify(accounts));}catch{}},[accounts]);
  useEffect(()=>{if(loggedIn) setTab("dashboard");},[]);

  const handleAuth=({email,name,pw,mode})=>{
    if(mode==="signup"){
      setAccounts(a=>({...a,[email]:{pw,name}}));
      setProfile(p=>({...p,name}));
      setLoggedIn(true); setAuthModal(null); setTab("dashboard");
    } else {
      const acc=accounts[email];
      if(!acc) return "등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.";
      if(acc.pw!==pw) return "비밀번호가 올바르지 않습니다.";
      setProfile(p=>({...p,name:acc.name}));
      setLoggedIn(true); setAuthModal(null); setTab("dashboard");
      return null;
    }
  };

  useEffect(()=>{
    const prev=prevXP.current;
    if(xp>prev){setXpFlash(true);setTimeout(()=>setXpFlash(false),1200);}
    if(xp<=prev){prevXP.current=xp;return;}
    const pL=getLvl(prev),cL=getLvl(xp);
    const pR=getRank(prev),cR=getRank(xp);
    if(cL.level>pL.level){setCelebration({type:"level",value:`Lv.${cL.level} 달성!`});setShowConfetti(true);setTimeout(()=>setShowConfetti(false),2800);}
    else if(cR.name!==pR.name){setCelebration({type:"rank",value:`${cR.icon} ${cR.name} 등급 달성!`});setShowConfetti(true);setTimeout(()=>setShowConfetti(false),2800);}
    prevXP.current=xp;
  },[xp]);

  useEffect(()=>{
    if(celebration)return;
    const earned=ALL_BADGES.filter(b=>b.req({...stats,xp,level:getLvl(xp).level}));
    const newOnes=earned.filter(b=>!prevBadges.current.includes(b.id));
    if(newOnes.length>0)setCelebration({type:"badge",value:`${newOnes[0].emoji} ${newOnes[0].label}`});
    prevBadges.current=earned.map(b=>b.id);
  },[xp,stats]);

  const lvl=getLvl(xp),rank=getRank(xp);
  const isHome=tab==="home";
  const navTabs=isHome?[]:[{id:"dashboard",label:"대시보드"},{id:"note",label:"노트"}];

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:"100vh",background:isHome?"#faeaf2":"#f4f6fb"}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
      <style>{`
        *{box-sizing:border-box}
        button:active{transform:scale(0.97)}
        @keyframes xpPing{0%{box-shadow:0 0 0 0 rgba(236,72,153,0.5)}70%{box-shadow:0 0 0 8px rgba(236,72,153,0)}100%{box-shadow:0 0 0 0 rgba(236,72,153,0)}}
        @keyframes slideRight{from{width:0;opacity:1}to{width:100%;opacity:0}}
        html{-webkit-text-size-adjust:100%}
        @media(max-width:768px){.dash-grid{grid-template-columns:1fr !important}.badge-grid{grid-template-columns:repeat(3,1fr) !important}.stat-grid{grid-template-columns:repeat(2,1fr) !important}.rank-grid{grid-template-columns:repeat(2,1fr) !important}.chart-grid{grid-template-columns:1fr !important}.feature-grid{grid-template-columns:1fr !important}.stats-strip{gap:24px !important;flex-wrap:wrap !important}.hero-h1{font-size:32px !important}.hero-sub{font-size:13px !important}}
        @media(max-width:480px){.badge-grid{grid-template-columns:repeat(3,1fr) !important}}
      `}</style>

      {showNotifBar&&<NotificationBar onClose={()=>setShowNotifBar(false)}/>}
      {showConfetti&&<Confetti/>}

      <nav style={{background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1160,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",gap:24}}>
          <button onClick={()=>setTab("home")} style={{background:"#a05070",color:"white",fontWeight:900,fontSize:15,padding:"7px 16px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",letterSpacing:"-0.3px"}}>D+Puzzle</button>
          {!isHome&&(
            <div style={{display:"flex",gap:2}}>
              {navTabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13.5,background:tab===t.id?"#f0eee9":"transparent",color:tab===t.id?"#2d0a1a":"#6b7280",fontWeight:tab===t.id?700:500,fontFamily:"inherit",transition:"all 0.15s"}}>{t.label}</button>
              ))}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
            {isHome&&<>
              <button onClick={()=>setAuthModal("login")} style={{padding:"8px 20px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"white",fontSize:13.5,fontWeight:600,cursor:"pointer",color:"#111827",fontFamily:"inherit"}}>로그인</button>
              <button onClick={()=>setAuthModal("signup")} style={{padding:"8px 20px",borderRadius:10,border:"none",background:"#a05070",fontSize:13.5,fontWeight:700,cursor:"pointer",color:"white",fontFamily:"inherit"}}>무료로 시작하기</button>
            </>}
            {!isHome&&<>
              <div style={{background:"#fef2f2",color:"#dc2626",padding:"5px 11px",borderRadius:20,fontSize:12.5,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>🔥 {stats.streak}일 연속</div>
              <div style={{background:"#fefce8",color:"#854d0e",padding:"5px 11px",borderRadius:20,fontSize:12.5,display:"flex",alignItems:"center",gap:4,fontWeight:600,animation:xpFlash?"xpPing 0.6s ease-out":"none"}}>⚡ {xp} XP</div>
              <div style={{background:rank.bg,color:rank.color,padding:"5px 11px",borderRadius:20,fontSize:12.5,border:`1px solid ${rank.border}`,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>{rank.icon} Lv.{lvl.level} {rank.name}</div>
              <button onClick={()=>setShowProfile(true)} style={{display:"flex",alignItems:"center",gap:8,background:"white",border:"1.5px solid #e8d9de",borderRadius:22,padding:"4px 14px 4px 4px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",height:38,lineHeight:1}}>
                <AvatarImg src={profile.avatarSrc} size={28} border="1.5px solid #e0ccd4"/>
                <span style={{fontSize:13,fontWeight:600,color:"#2d1a22",whiteSpace:"nowrap"}}>{profile.name}</span>
              </button>
            </>}
          </div>
        </div>
      </nav>

      {tab==="dashboard"&&xpFlash&&<div style={{position:"fixed",top:60,left:0,right:0,height:3,background:"linear-gradient(90deg,#d9d4cc,#ec4899,#d9d4cc)",zIndex:99,animation:"slideRight 1s ease-out forwards"}}/>}

      {tab==="dashboard"&&(
        <div style={{maxWidth:1160,margin:"0 auto",padding:"12px 24px 0"}}>
          <div style={{fontSize:12,color:"#9ca3af",fontWeight:500}}>Lv.{lvl.level} 대시보드</div>
          <div style={{fontSize:13,color:"#6b7280"}}>안녕하세요, <span style={{fontWeight:700,color:"#a05070"}}>{profile.name}</span>님! 오늘도 성장하는 하루 만들어보세요 ✨</div>
        </div>
      )}

      <main style={{position:"relative"}}>
        {tab==="home" && <HomePage onStart={()=>setAuthModal("signup")} onLogin={()=>setAuthModal("login")}/>}
        {loggedIn && (
          <>
            <div style={{display:tab==="dashboard"?"block":"none",maxWidth:960,margin:"0 auto",padding:"0 24px 48px"}}>
              <Dashboard xp={xp} onXPChange={setXP} stats={stats} setStats={setStats} xpFlash={xpFlash} activeTab={tab}/>
            </div>
            <div style={{display:tab==="note"?"block":"none"}}>
              <NotePage onEntriesChange={n=>setStats(s=>({...s,entries:n}))}/>
            </div>
          </>
        )}
      </main>

      {celebration&&<CelebrationModal {...celebration} onClose={()=>setCelebration(null)}/>}
      {showProfile&&<ProfileModal
        profile={profile}
        onSave={p=>setProfile(p)}
        onClose={()=>setShowProfile(false)}
        onLogout={()=>{setLoggedIn(false);setTab("home");setShowProfile(false);try{localStorage.removeItem("bm_loggedIn");}catch{}}}
        onWithdraw={()=>{
          ["bm_xp","bm_stats","bm_profile","bm_loggedIn","bm_accounts","bm_notebooks"].forEach(k=>{try{localStorage.removeItem(k);}catch{}});
          setLoggedIn(false);setAccounts({});setXP(0);
          setStats({streak:0,questsDone:0,studySecs:0,entries:0,weeklyXP:[0,0,0,0,0,0,0],weeklyMins:[0,0,0,0,0,0,0],lastActiveDate:null,missedDays:0});
          setProfile({name:"학습자",avatarSrc:null,bio:"",goal:""});
          setTab("home");setShowProfile(false);
        }}
      />}
      {authModal&&<AuthModal mode={authModal} accounts={accounts} onAuth={handleAuth} onClose={()=>setAuthModal(null)}/>}
    <Analytics />
    </div>
  );
}