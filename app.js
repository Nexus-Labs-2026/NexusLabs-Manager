const STORAGE_KEY = "nexuslabs-servers-v1";

const defaultServers = [
  {id:crypto.randomUUID(),name:"Production Node 01",host:"203.0.113.42",protocol:"RDP",port:3389,group:"Production",status:"online",latency:28,notes:"Primary Windows workload"},
  {id:crypto.randomUUID(),name:"Build Runner",host:"198.51.100.18",protocol:"SSH",port:22,group:"CI/CD",status:"online",latency:42,notes:"Linux build environment"},
  {id:crypto.randomUUID(),name:"Finance Desktop",host:"192.0.2.77",protocol:"RDP",port:3389,group:"Finance",status:"warning",latency:91,notes:"Restricted access"},
  {id:crypto.randomUUID(),name:"Lab VNC",host:"192.0.2.105",protocol:"VNC",port:5900,group:"Lab",status:"offline",latency:null,notes:"Maintenance window"}
];

let servers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultServers;
let events = [
  ["✓","Connected to Production Node 01","2 min ago"],
  ["↻","Inventory sync completed","18 min ago"],
  ["!","Finance Desktop latency above threshold","42 min ago"],
  ["+","Build Runner added to CI/CD","1 hr ago"],
  ["⚿","Credential vault unlocked locally","Today"]
];

const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const modal = document.querySelector("#modalBackdrop");
const toast = document.querySelector("#toast");

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(servers)); }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function notify(msg){ toast.textContent=msg; toast.classList.remove("hidden"); setTimeout(()=>toast.classList.add("hidden"),2200); }

function stats(){
  const online=servers.filter(s=>s.status==="online").length;
  const warning=servers.filter(s=>s.status==="warning").length;
  const avg=servers.filter(s=>s.latency).reduce((a,s)=>a+s.latency,0)/(servers.filter(s=>s.latency).length||1);
  return {online,warning,avg:Math.round(avg)};
}

function dashboard(){
  const s=stats();
  return `
    <div class="hero">
      <div><div class="eyebrow">Workspace overview</div><h1>Good morning.</h1><p>Manage your remote endpoints from one clean workspace.</p></div>
      <div class="hero-actions"><button class="btn secondary" id="importBtn">Import</button><button class="btn primary" id="addBtn">＋ Add server</button></div>
    </div>
    <div class="stats">
      <div class="card stat"><div class="stat-head"><span>Total servers</span><span>▣</span></div><div class="stat-value">${servers.length}</div><div class="trend">Across ${new Set(servers.map(x=>x.group)).size} groups</div></div>
      <div class="card stat"><div class="stat-head"><span>Online</span><span>●</span></div><div class="stat-value">${s.online}</div><div class="trend">${servers.length ? Math.round(s.online/servers.length*100) : 0}% availability</div></div>
      <div class="card stat"><div class="stat-head"><span>Attention</span><span>!</span></div><div class="stat-value">${s.warning}</div><div class="trend">${s.warning ? "Review recommended" : "No warnings"}</div></div>
      <div class="card stat"><div class="stat-head"><span>Avg. latency</span><span>⌁</span></div><div class="stat-value">${s.avg}<small> ms</small></div><div class="trend">Last local check</div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-head"><h3>Recent servers</h3><span>${servers.length} endpoints</span></div><div class="server-list">${servers.slice(0,6).map(serverRow).join("") || '<div class="empty">No servers yet.</div>'}</div></div>
      <div class="card"><div class="card-head"><h3>Recent activity</h3><span>Local audit</span></div><div class="activity">${events.slice(0,5).map(e=>`<div class="event"><div class="event-icon">${e[0]}</div><div><strong>${esc(e[1])}</strong><small>${e[2]}</small></div></div>`).join("")}</div></div>
    </div>`;
}

function serverRow(s){
  return `<div class="server-row ${s.status}">
    <div><div class="server-name">${esc(s.name)}</div><div class="server-host">${esc(s.host)}:${esc(s.port)}</div></div>
    <div><span class="badge">${esc(s.protocol)}</span></div>
    <div><span class="badge ${s.status}"><i class="dot"></i>${s.status}</span></div>
    <div class="hide-md"><span class="badge">${s.latency ? s.latency+" ms" : "—"}</span></div>
    <div class="row-actions">
      <button class="btn small" data-connect="${s.id}">Connect</button>
      <button class="btn small secondary" data-edit="${s.id}">Edit</button>
      <button class="btn small danger" data-delete="${s.id}">Delete</button>
    </div>
  </div>`;
}
function serversView(){
 return `<div class="hero"><div><div class="eyebrow">Endpoint inventory</div><h1>Servers</h1><p>Store connection profiles locally and launch your preferred client.</p></div><button class="btn primary" id="addBtn">＋ Add server</button></div>
 <div class="card"><div class="card-head"><h3>All endpoints</h3><span>${servers.length} total</span></div>
 <div class="toolbar"><div class="search"><input id="serverSearch" placeholder="Search name, IP, group or protocol…"></div><select class="select" id="groupFilter"><option value="">All groups</option>${[...new Set(servers.map(s=>s.group))].map(g=>`<option>${esc(g)}</option>`).join("")}</select></div>
 <div class="server-list" id="serverList">${servers.map(serverRow).join("") || '<div class="empty">No servers added. Use “Add server” to create a profile.</div>'}</div></div>`;
}

function sessionsView(){
 return `<div class="hero"><div><div class="eyebrow">Remote access</div><h1>Sessions</h1><p>Active connection shortcuts and session history.</p></div></div>
 <div class="card"><div class="card-head"><h3>Connection history</h3><span>Browser-local demo</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Server</th><th>Protocol</th><th>Started</th><th>Duration</th><th>Status</th></tr></thead><tbody>
 ${events.filter(e=>e[1].toLowerCase().includes("connect")).map(e=>`<tr><td>${esc(e[1].replace("Connected to ",""))}</td><td>RDP</td><td>${e[2]}</td><td>—</td><td><span class="badge"><i class="dot"></i>Closed</span></td></tr>`).join("") || '<tr><td colspan="5" class="empty">No session history.</td></tr>'}
 </tbody></table></div></div>`;
}

function credentialsView(){
 return `<div class="hero"><div><div class="eyebrow">Security</div><h1>Credentials</h1><p>Connection secrets are intentionally not stored by this static demo.</p></div></div>
 <div class="settings"><div class="card setting"><h3>Local credential vault</h3><p>For production use, connect this UI to a server-side secret manager. Never put reusable passwords in frontend source or localStorage.</p><div class="toggle"><span>Vault status</span><span class="badge"><i class="dot"></i> Local UI only</span></div><div class="toggle"><span>Auto-lock</span><span class="switch on"></span></div></div>
 <div class="card setting"><h3>Connection security</h3><p>Use TLS, MFA, short-lived credentials and least-privilege accounts when deploying this dashboard.</p><div class="toggle"><span>Require MFA</span><span class="switch on"></span></div><div class="toggle"><span>Audit connections</span><span class="switch on"></span></div></div></div>`;
}

function activityView(){
 return `<div class="hero"><div><div class="eyebrow">Audit trail</div><h1>Activity</h1><p>Recent local UI events and connection actions.</p></div><button class="btn secondary" id="clearActivity">Clear</button></div>
 <div class="card"><div class="activity">${events.map(e=>`<div class="event"><div class="event-icon">${e[0]}</div><div><strong>${esc(e[1])}</strong><small>${e[2]}</small></div></div>`).join("") || '<div class="empty">Activity is empty.</div>'}</div></div>`;
}

function settingsView(){
 return `<div class="hero"><div><div class="eyebrow">Preferences</div><h1>Settings</h1><p>Customize the local dashboard experience.</p></div></div>
 <div class="settings"><div class="card setting"><h3>Appearance</h3><p>Interface preferences stored in your browser.</p><div class="toggle"><span>Compact tables</span><span class="switch"></span></div><div class="toggle"><span>Animations</span><span class="switch on"></span></div></div>
 <div class="card setting"><h3>Data</h3><p>Export or clear your locally stored server profiles.</p><button class="btn secondary" id="exportBtn">Export JSON</button> <button class="btn danger" id="wipeBtn">Clear local data</button></div></div>`;
}

function render(view="dashboard"){
  const titles={dashboard:"Dashboard",servers:"Servers",sessions:"Sessions",credentials:"Credentials",activity:"Activity",settings:"Settings"};
  pageTitle.textContent=titles[view]||"Dashboard";
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  content.innerHTML={dashboard,servers:serversView,sessions:sessionsView,credentials:credentialsView,activity:activityView,settings:settingsView}[view]();
  bindView(view);
}

let editingServerId = null;

function openModal(server=null){
  editingServerId = server?.id || null;
  document.querySelector("#modalTitle").textContent = server ? "Edit server" : "Add server";
  const form=document.querySelector("#serverForm");
  form.reset();
  if(server){
    Object.entries(server).forEach(([key,value])=>{
      const field=form.elements[key];
      if(field && value !== undefined && value !== null) field.value=value;
    });
  }
  modal.classList.remove("hidden");
  document.querySelector("#serverForm input[name=name]").focus();
}

function closeModal(){
  modal.classList.add("hidden");
  editingServerId = null;
  document.querySelector("#modalTitle").textContent = "Add server";
  document.querySelector("#serverForm").reset();
}

function bindView(view){
  document.querySelectorAll("[data-connect]").forEach(b=>b.onclick=()=>{
    const s=servers.find(x=>x.id===b.dataset.connect);
    if(s){ events.unshift(["✓",`Connected to ${s.name}`, "just now"]); notify(`Connection handoff prepared for ${s.name}`); }
  });

  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{
    const s=servers.find(x=>x.id===b.dataset.edit);
    if(s) openModal(s);
  });

  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{
    const s=servers.find(x=>x.id===b.dataset.delete);
    if(!s) return;
    if(confirm(`Delete "${s.name}" (${s.host})? This cannot be undone.`)){
      servers=servers.filter(x=>x.id!==s.id);
      save();
      events.unshift(["−",`Deleted ${s.name}`, "just now"]);
      render(view);
      notify(`Deleted ${s.name}`);
    }
  });

  document.querySelector("#addBtn")?.addEventListener("click",()=>openModal());
  if(view==="servers"){
    const filter=()=>{const q=document.querySelector("#serverSearch").value.toLowerCase(),g=document.querySelector("#groupFilter").value;
      document.querySelector("#serverList").innerHTML=servers.filter(s=>(!q||`${s.name} ${s.host} ${s.group} ${s.protocol}`.toLowerCase().includes(q))&&(!g||s.group===g)).map(serverRow).join("")||'<div class="empty">No matching servers.</div>';
      bindView("servers");
    };
    document.querySelector("#serverSearch")?.addEventListener("input",filter); document.querySelector("#groupFilter")?.addEventListener("change",filter);
  }
  if(view==="activity") document.querySelector("#clearActivity")?.addEventListener("click",()=>{events=[];render("activity")});
  if(view==="settings"){
    document.querySelector("#exportBtn")?.addEventListener("click",()=>{
      const blob=new Blob([JSON.stringify(servers,null,2)],{type:"application/json"}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="nexuslabs-servers.json";a.click();URL.revokeObjectURL(a.href);
    });
    document.querySelector("#wipeBtn")?.addEventListener("click",()=>{if(confirm("Clear all locally stored server profiles?")){servers=[];save();render("settings");notify("Local server data cleared")}});
  }
}

document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>{render(b.dataset.view);document.querySelector("#sidebar").classList.remove("open")}));
document.querySelector("#menuBtn").onclick=()=>document.querySelector("#sidebar").classList.toggle("open");
document.querySelector("#themeBtn").onclick=()=>document.body.classList.toggle("light");
document.querySelector("#notifyBtn").onclick=()=>notify("No new notifications");
document.querySelector("#profileBtn").onclick=()=>notify("NexusLabs local workspace");
document.querySelector("#modalClose").onclick=closeModal;
document.querySelector("#cancelModal").onclick=closeModal;
document.querySelector("#serverForm").addEventListener("submit",e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(e.target));
  const profile={
    name:d.name.trim(),
    host:d.host.trim(),
    protocol:d.protocol,
    port:Number(d.port),
    group:d.group?.trim() || "General",
    notes:d.notes?.trim() || ""
  };

  if(editingServerId){
    const index=servers.findIndex(s=>s.id===editingServerId);
    if(index!==-1){
      servers[index]={...servers[index],...profile};
      events.unshift(["✎",`Updated ${profile.name}`, "just now"]);
      save(); closeModal(); render("servers"); notify("Server profile updated");
      return;
    }
  }

  servers.unshift({
    id:crypto.randomUUID(),
    ...profile,
    status:"online",
    latency:Math.floor(20+Math.random()*70)
  });
  save();
  events.unshift(["+","Added server profile", "just now"]);
  closeModal();
  render("servers");
  notify("Server profile added");
});
render();
