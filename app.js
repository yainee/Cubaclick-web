/* ====== CARGA DE DATOS (JSON primero, data.js de respaldo) ====== */
window.CATEGORIES = window.CATEGORIES || [
  "Carnes y embutidos","Bebidas","Desayunos","Chuche",
  "Granos y pastas","Aseo","Ingredientes de cocina","Otros"
];

// Configura tu WhatsApp (opcional): "53xxxxxxxxx" o "" para usar sin número
const WA_NUMBER = ""; // ejemplo: "5355555555"

async function loadJSON(url){
  try{
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok) throw new Error("no ok");
    return await r.json();
  }catch(e){ return null; }
}

async function ensureCatalog(){
  const pj = await loadJSON("productos.json");
  if(pj && Array.isArray(pj)) window.CATALOG = pj;
  // respaldo si no hay productos.json: usa data.js
  if(!window.CATALOG) window.CATALOG = [];
  const cj = await loadJSON("combos.json");
  if(cj && Array.isArray(cj)) window.COMBOS = cj;
  if(!window.COMBOS) window.COMBOS = [];
}
