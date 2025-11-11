
const DB_KEY='cc_catalog_v1';
const ORDERS_KEY='cc_orders_v1';
const ADMIN_PASS='Cubaclick2020@*';

function readDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(raw){ try{ return JSON.parse(raw);}catch(e){ console.warn(e);} }
  const seed = JSON.parse(document.getElementById('seed-data').textContent);
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}
function writeDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function money(n){ return '$'+Number(n).toFixed(2); }

let state = {view:'productos', db:readDB(), cart:[]};

function setView(v){
  state.view=v;
  document.querySelectorAll('.pill').forEach(b=>b.classList.toggle('active', b.dataset.view===v));
  renderList();
}

function addToCart(item, qty){
  qty=Number(qty||1);
  if(!qty||qty<1) return;
  const ex=state.cart.find(x=>x.id===item.id);
  if(ex){ ex.qty+=qty; } else { state.cart.push({id:item.id,tipo:item.tipo,nombre:item.nombre,precio:item.precio,qty}); }
  renderCart();
}

function removeFromCart(id){ state.cart = state.cart.filter(x=>x.id!==id); renderCart(); }

function ensureImage(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(src);
    img.onerror=()=>resolve('assets/cover_fallback.jpg');
    img.src=src;
  });
}

async function renderList(){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  if(state.view==='remesas'){ renderRemesas(); return; }
  const items = state.view==='productos' ? state.db.productos : state.db.combos;
  for(const item of items){
    const card=document.createElement('div'); card.className='card';
    const imgSrc = await ensureImage(item.img||'assets/cover.png');
    card.innerHTML = `
      <img src="${imgSrc}" alt="${item.nombre}"/>
      <h4>${item.nombre}</h4>
      <div class="meta">
        <span class="badge">Stock: ${item.stock ?? '—'}</span>
        <strong>${money(item.precio)}</strong>
      </div>
      <div class="counter">
        <input type="number" min="1" value="1" id="q_${item.id}"/>
        <button class="btn" data-id="${item.id}">Agregar</button>
      </div>
      ${item.descripcion?`<p style="margin:8px 0 0; font-size:13px; opacity:.8; white-space:pre-line">${item.descripcion}</p>`:''}
    `;
    card.querySelector('button').addEventListener('click',()=>{
      const q=document.getElementById(`q_${item.id}`).value;
      addToCart(item,q);
    });
    grid.appendChild(card);
  }
}

function renderRemesas(){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  const r=state.db.remesas||{tasa_usd_cup:0,tasa_usd_mlc:0,tasa_mlc_cup:0};
  const card=document.createElement('div'); card.className='card';
  card.innerHTML = `
    <h4>Calculadora de Remesas</h4>
    <div class="meta"><span class="badge">Tasas admin</span>
      <small>USD→CUP: ${r.tasa_usd_cup}, USD→MLC: ${r.tasa_usd_mlc}, MLC→CUP: ${r.tasa_mlc_cup}</small>
    </div>
    <label>Monto</label>
    <input id="rem_monto" type="number" min="1" value="100"/>
    <label>Moneda</label>
    <select id="rem_moneda">
      <option value="USD">USD</option>
      <option value="MLC">MLC</option>
      <option value="CUP">CUP</option>
    </select>
    <div id="rem_res" style="margin-top:10px;font-weight:800"></div>
    <button class="btn" id="rem_add">Agregar al carrito</button>
  `;
  grid.appendChild(card);
  function calc(){
    const monto=Number(document.getElementById('rem_monto').value||0);
    const m=document.getElementById('rem_moneda').value;
    let t='';
    if(m==='USD'){ t=`${monto} USD ≈ ${monto*r.tasa_usd_cup} CUP · ${monto*r.tasa_usd_mlc} MLC`; }
    if(m==='MLC'){ t=`${monto} MLC ≈ ${(monto/r.tasa_usd_mlc).toFixed(2)} USD · ${monto*r.tasa_mlc_cup} CUP`; }
    if(m==='CUP'){ t=`${monto} CUP ≈ ${(monto/r.tasa_usd_cup).toFixed(2)} USD · ${(monto/r.tasa_mlc_cup).toFixed(2)} MLC`; }
    document.getElementById('rem_res').textContent=t;
  }
  document.getElementById('rem_monto').addEventListener('input',calc);
  document.getElementById('rem_moneda').addEventListener('change',calc);
  calc();
  document.getElementById('rem_add').addEventListener('click',()=>{
    const monto=Number(document.getElementById('rem_monto').value||0);
    const mon=document.getElementById('rem_moneda').value;
    addToCart({id:'rem-'+Date.now(),tipo:'remesa',nombre:`Remesa (${mon})`,precio:monto},1);
  });
}

function renderCart(){
  const body=document.getElementById('cart-items'); body.innerHTML='';
  let total=0;
  state.cart.forEach(it=>{
    const row=document.createElement('div'); row.className='cart-item';
    row.innerHTML=`<div><strong>${it.nombre}</strong><br/><small>${it.qty} × ${money(it.precio)}</small></div>
    <button class="btn">✕</button>`;
    row.querySelector('button').onclick=()=>removeFromCart(it.id);
    body.appendChild(row);
    total += it.precio*it.qty;
  });
  document.getElementById('cart-total-amt').textContent=money(total);
}

function openCheckout(){
  if(state.cart.length===0){ alert('El carrito está vacío'); return; }
  document.getElementById('checkout-modal').style.display='flex';
}
function closeCheckout(){ document.getElementById('checkout-modal').style.display='none'; }

function sendWhatsApp(){
  const nombre=document.getElementById('i_nombre').value.trim();
  const tel=document.getElementById('i_tel').value.trim();
  const dir=document.getElementById('i_dir').value.trim();
  const fam=document.getElementById('i_fam').value.trim();
  const nota=document.getElementById('i_nota').value.trim();
  if(!nombre||!tel||!dir||!fam){ alert('Por favor completa nombre, teléfono, dirección y familiar.'); return; }

  let total=0;
  const lines=state.cart.map(it=>{ total+=it.precio*it.qty; return `• ${it.nombre} — ${it.qty} × ${money(it.precio)} = ${money(it.qty*it.precio)}`; }).join('%0A');
  const texto=`Nuevo pedido Cubaclick%0ACliente: ${nombre}%0ATeléfono: ${tel}%0ADirección: ${dir}%0AFamiliar: ${fam}%0ANota: ${nota||'-'}%0A%0AProductos:%0A${lines}%0A%0ATotal: ${money(total)}`;

  const tipos=state.cart.map(i=>i.tipo);
  const t = tipos.includes('remesa') ? 'remesas' : (tipos.includes('combo') ? 'combos' : 'productos');
  const phone=state.db.vendedores?.[t]?.telefono || state.db.vendedores?.soporte?.telefono || '';
  if(!phone){ alert('No hay teléfono configurado para esta sección. Ve a Admin.'); return; }

  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');
  orders.push({id:Date.now(),cliente:{nombre,tel,dir,fam,nota},cart:state.cart,total,when:new Date().toISOString(),routed_to:t});
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  const url=`https://wa.me/${encodeURIComponent(phone)}?text=${texto}`;
  window.open(url,'_blank');
  state.cart=[]; renderCart(); closeCheckout();
}

window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.pill').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.getElementById('cart-toggle').addEventListener('click',()=>document.getElementById('cart-panel').classList.toggle('show'));
  document.getElementById('checkout').addEventListener('click',openCheckout);
  document.getElementById('close-modal').addEventListener('click',closeCheckout);
  document.getElementById('send-wa').addEventListener('click',sendWhatsApp);
  renderList(); renderCart();
});
