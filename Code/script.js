(function(){
var $=function(i){return document.getElementById(i)};
var root=document.documentElement;
var latest=null;
var matrixStep=0, matrixTotal=0, matrixTimer=null;
var HISTORY_KEY="nw-aligner-history-v1";
function showPage(name){
  document.querySelectorAll("[data-page-section]").forEach(function(page){page.classList.toggle("active",page.getAttribute("data-page-section")===name)});
  document.querySelectorAll(".nav-link").forEach(function(link){link.classList.toggle("active",link.getAttribute("data-page")===name)});
  if(location.hash!=="#"+name) history.replaceState(null,"","#"+name);
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="history") renderHistory();
}
document.querySelectorAll("[data-page]").forEach(function(link){link.addEventListener("click",function(e){e.preventDefault();showPage(link.getAttribute("data-page"))})});
document.querySelectorAll("[data-go-page]").forEach(function(button){button.addEventListener("click",function(){showPage(button.getAttribute("data-go-page"))})});
window.addEventListener("hashchange",function(){var name=location.hash.slice(1);if(["home","align","history","how","team"].indexOf(name)>=0)showPage(name)});
$("th").onclick=function(){
  var d=root.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  root.setAttribute("data-theme",d==="dark"?"light":"dark");
};
function esc(c){return "ACGTU".indexOf(c)>-1?c:""}
function align(a,b,ma,mi,gp){
  var n=a.length,m=b.length,F=[],T=[],i,j;
  for(i=0;i<=n;i++){F.push(new Array(m+1).fill(0));}
  for(i=1;i<=n;i++)F[i][0]=i*gp;
  for(j=1;j<=m;j++)F[0][j]=j*gp;
  for(i=1;i<=n;i++)for(j=1;j<=m;j++){
    var d=F[i-1][j-1]+(a[i-1]===b[j-1]?ma:mi),u=F[i-1][j]+gp,l=F[i][j-1]+gp;
    F[i][j]=Math.max(d,u,l);
  }
  var x="",y="",bar="",path={},k=n,q=m;path[k+","+q]=1;
  while(k>0||q>0){
    if(k>0&&q>0&&F[k][q]===F[k-1][q-1]+(a[k-1]===b[q-1]?ma:mi)){
      x=a[k-1]+x;y=b[q-1]+y;bar=(a[k-1]===b[q-1]?"|":"x")+bar;k--;q--;
    }else if(k>0&&F[k][q]===F[k-1][q]+gp){x=a[k-1]+x;y="-"+y;bar=" "+bar;k--;}
    else{x="-"+x;y=b[q-1]+y;bar=" "+bar;q--;}
    path[k+","+q]=1;
  }
  return{F:F,x:x,y:y,bar:bar,path:path,score:F[n][m]};
}
function color(ch,t){return '<span class="'+t+'">'+ch+'</span>'}
function run(){
  var a=$("s1").value.replace(/\s/g,"").toUpperCase(),b=$("s2").value.replace(/\s/g,"").toUpperCase();
  var ma=+$("ma").value,mi=+$("mi").value,gp=+$("gp").value,msg=$("msg");
  msg.textContent="";
  if(!a||!b){msg.textContent="Enter both sequences.";return}
  var type=$("seqType").value;
  var valid=type==="dna"?/^[ACGTU]+$/:/^[ACDEFGHIKLMNPQRSTVWY]+$/;
  if(!valid.test(a)||!valid.test(b)){msg.textContent=type==="dna"?"DNA/RNA sequences may contain only A, C, G, T and U.":"Use standard one-letter amino-acid codes for protein sequences.";return}
  if(!Number.isFinite(ma)||!Number.isFinite(mi)||!Number.isFinite(gp)){msg.textContent="Enter valid numeric scoring values.";return}
  if(a.length>500||b.length>500){msg.textContent="Keep each sequence under 500 characters.";return}
  var r=align(a,b,ma,mi,gp),L=r.x.length,mt=0,mm=0,g=0,l1="",l2="",l3="",i;
  for(i=0;i<L;i++){
    var c=r.bar[i];
    if(c==="|"){mt++;l1+=color(r.x[i],"b");l2+=color("|","b");l3+=color(r.y[i],"b")}
    else if(c==="x"){mm++;l1+=color(r.x[i],"m");l2+=color("·","m");l3+=color(r.y[i],"m")}
    else{g++;l1+=color(r.x[i],r.x[i]==="-"?"g":"");l2+=" ";l3+=color(r.y[i],r.y[i]==="-"?"g":"")}
  }
  latest={a:a,b:b,ma:ma,mi:mi,gp:gp,score:r.score,x:r.x,y:r.y,bar:r.bar,matches:mt,mismatches:mm,gaps:g,identity:L?Math.round(100*mt/L):0};
  var h='<div class="stats"><div><span>Alignment score</span><strong>'+r.score+'</strong></div><div><span>Matches</span><strong>'+mt+'</strong></div><div><span>Mismatches</span><strong>'+mm+'</strong></div><div><span>Gaps</span><strong>'+g+'</strong></div><div><span>Identity</span><strong>'+(L?Math.round(100*mt/L):0)+'%</strong></div></div>';
  h+='<div class="aln"><pre>'+l1+'\n'+l2+'\n'+l3+'</pre></div><p class="legend">Green = match, red = mismatch, grey dash = gap.</p>';
  if(a.length<=20&&b.length<=20){
    matrixTotal=(a.length+1)*(b.length+1);matrixStep=0;
    h+='<div class="mat"><h3>Interactive scoring matrix</h3><p class="legend">Reveal one cell at a time to see how dynamic programming builds the alignment. Purple cells mark the optimal traceback path.</p>';
    h+='<div class="matrix-controls"><button type="button" class="btn alt" id="matrixPrev">← Previous</button><button type="button" class="btn" id="matrixNext">Next cell →</button><button type="button" class="btn alt" id="matrixPlay">Play all</button><button type="button" class="btn alt" id="matrixReset">Reset</button><span id="matrixProgress" class="legend">0 / '+matrixTotal+' cells revealed</span></div>';
    h+='<table class="dp"><tr><th></th><th>∅</th>';
    for(i=0;i<b.length;i++)h+='<th>'+b[i]+'</th>';
    h+='</tr>';var cellStep=0;
    for(i=0;i<=a.length;i++){
      h+='<tr><th>'+(i?a[i-1]:"∅")+'</th>';
      for(var j=0;j<=b.length;j++){
        cellStep++;
        h+='<td data-matrix-step="'+cellStep+'" data-value="'+r.F[i][j]+'"'+(r.path[i+","+j]?' data-path="1"':'')+'><span>·</span></td>';
      }
      h+='</tr>';
    }
    h+='</table><p class="legend" id="matrixHint">Press “Next cell” to begin. The first row and column are initialized using the gap penalty.</p></div>';
  }else h+='<p class="legend">The interactive matrix is available for sequences up to 20 characters each to keep it readable.</p>';
  $("out").innerHTML=h;
  setupMatrix();
}
function stopMatrixPlayback(){if(matrixTimer){clearInterval(matrixTimer);matrixTimer=null;}var play=$("matrixPlay");if(play)play.textContent="Play all";}
function paintMatrix(){
  var cells=document.querySelectorAll("[data-matrix-step]");
  cells.forEach(function(cell){var step=Number(cell.getAttribute("data-matrix-step")),shown=step<=matrixStep;cell.classList.toggle("revealed",shown);cell.classList.toggle("current",step===matrixStep&&matrixStep>0);cell.classList.toggle("p",shown&&cell.getAttribute("data-path")==="1");cell.querySelector("span").textContent=shown?cell.getAttribute("data-value"):"·";});
  var progress=$("matrixProgress");if(progress)progress.textContent=matrixStep+" / "+matrixTotal+" cells revealed";
  var hint=$("matrixHint");if(hint){if(matrixStep===0)hint.textContent="Press “Next cell” to begin. The first row and column are initialized using the gap penalty.";else if(matrixStep===matrixTotal)hint.textContent="Matrix complete! The bottom-right cell contains the optimal global alignment score.";else hint.textContent="Cell "+matrixStep+" of "+matrixTotal+" revealed. The algorithm stores the best score at each position.";}
  var prev=$("matrixPrev"),next=$("matrixNext");if(prev)prev.disabled=matrixStep===0;if(next)next.disabled=matrixStep===matrixTotal;
}
function setupMatrix(){
  stopMatrixPlayback();
  if(!$("matrixNext"))return;
  paintMatrix();
  $("matrixNext").onclick=function(){stopMatrixPlayback();matrixStep=Math.min(matrixTotal,matrixStep+1);paintMatrix();};
  $("matrixPrev").onclick=function(){stopMatrixPlayback();matrixStep=Math.max(0,matrixStep-1);paintMatrix();};
  $("matrixReset").onclick=function(){stopMatrixPlayback();matrixStep=0;paintMatrix();};
  $("matrixPlay").onclick=function(){
    if(matrixTimer){stopMatrixPlayback();return;}
    if(matrixStep>=matrixTotal)matrixStep=0;
    this.textContent="Pause";paintMatrix();
    matrixTimer=setInterval(function(){matrixStep=Math.min(matrixTotal,matrixStep+1);paintMatrix();if(matrixStep>=matrixTotal)stopMatrixPlayback();},180);
  };
}
$("go").onclick=run;
$("ex1").onclick=function(){$("seqType").value="dna";$("s1").value="ACGTTGCA";$("s2").value="ACGGTCA";run()};
$("ex2").onclick=function(){$("seqType").value="protein";$("s1").value="HEAGAWGHEE";$("s2").value="PAWHEAE";run()};
[ "s1","s2","ma","mi","gp" ].forEach(function(id){$(id).addEventListener("keydown",function(e){if(e.key==="Enter")run()})});
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")}catch(e){return []}}
function renderHistory(){
  var list=$("historyList"),items=getHistory();
  if(!items.length){list.innerHTML='<p class="legend">No saved alignments yet.</p>';return}
  list.innerHTML=items.map(function(it,i){
    return '<article class="history-item"><div><strong>'+it.a+' ↔ '+it.b+'</strong><p class="legend">Score: '+it.score+' · Identity: '+it.identity+'% · '+it.date+'</p></div><button class="btn alt" data-load="'+i+'">Load</button></article>';
  }).join("");
  list.querySelectorAll("[data-load]").forEach(function(btn){btn.onclick=function(){
    var it=getHistory()[Number(btn.getAttribute("data-load"))];if(!it)return;
    $("s1").value=it.a;$("s2").value=it.b;$("ma").value=it.ma;$("mi").value=it.mi;$("gp").value=it.gp;run();showPage("align");
  }});
}
$("save").onclick=function(){
  if(!latest){$("msg").textContent="Align two sequences first.";return}
  var items=getHistory();
  items.unshift(Object.assign({date:new Date().toLocaleString()},latest));
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,20)));renderHistory();$("msg").textContent="Result saved in this browser."}
  catch(e){$("msg").textContent="Could not save history in this browser."}
};
$("download").onclick=function(){
  if(!latest){$("msg").textContent="Align two sequences first.";return}
  var r=latest,content="Needleman-Wunsch Global Sequence Alignment\nSequence 1: "+r.a+"\nSequence 2: "+r.b+"\nMatch: "+r.ma+" | Mismatch: "+r.mi+" | Gap: "+r.gp+"\nScore: "+r.score+"\nMatches: "+r.matches+"\nMismatches: "+r.mismatches+"\nGaps: "+r.gaps+"\nIdentity: "+r.identity+"%\n\n"+r.x+"\n"+r.bar+"\n"+r.y+"\n";
  var blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="sequence-alignment.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
};
$("clearHistory").onclick=function(){if(confirm("Clear all saved alignment history?")){localStorage.removeItem(HISTORY_KEY);renderHistory()}};
$("seqType").onchange=function(){if($("seqType").value==="protein"){$("s1").value="HEAGAWGHEE";$("s2").value="PAWHEAE"}else{$("s1").value="GATTACA";$("s2").value="GCATGCT"}run()};
run();renderHistory();
var initialPage=location.hash.slice(1);if(["home","align","history","how","team"].indexOf(initialPage)>=0)showPage(initialPage);
})();
