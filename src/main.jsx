import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {createClient} from "@supabase/supabase-js";
import {
  ShoppingCart, Package, BarChart3, Settings, Plus, Trash2, Edit3, Wallet,
  Banknote, Smartphone, CreditCard, LockOpen, Lock, ArrowDownToLine,
  ArrowUpFromLine, Search, Save, X, RotateCcw, LogOut, Cloud, UserRound,
  RefreshCw, KeyRound, Eye, EyeOff
} from "lucide-react";
import "./styles.css";

const KEY="pdv_acai_v1";
const CLOUD_KEY="pdv_acai_cloud_config_v1";
const CLOUD_OWNER_KEY="pdv_acai_cloud_owner_v1";
const DEFAULT_URL="https://jntwfiuchdxmwwftyvqp.supabase.co";
const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const initial={
  products:[
    {id:"a1",name:"Açaí",category:"Açaí",price:34.90,unit:"kg",stock:999,low:1,active:true,image:""},
    {id:"p1",name:"Água 500ml",category:"Bebidas",price:4,unit:"un",stock:30,low:5,active:true,image:""},
    {id:"p2",name:"Refrigerante lata",category:"Bebidas",price:7,unit:"un",stock:20,low:5,active:true,image:""}
  ],
  additions:[
    {id:"ad1",name:"Leite em pó",price:3,stock:50,low:10,active:true},
    {id:"ad2",name:"Granola",price:3,stock:50,low:10,active:true},
    {id:"ad3",name:"Morango",price:4,stock:30,low:5,active:true}
  ],
  sales:[],
  cash:{open:false,openedAt:null,initial:0,movements:[]},
  settings:{priceKg:34.90,storeName:"Minha Açaíteria"}
};

function cloneInitial(){return JSON.parse(JSON.stringify(initial));}
function loadLocal(){
  try{return JSON.parse(localStorage.getItem(KEY))||cloneInitial()}catch{return cloneInitial()}
}
function getCloudConfig(){
  try{return JSON.parse(localStorage.getItem(CLOUD_KEY))||{url:DEFAULT_URL,key:""}}catch{return {url:DEFAULT_URL,key:""}}
}
function getSupabaseClient(){
  const cfg=getCloudConfig();
  const url=import.meta.env.VITE_SUPABASE_URL || cfg.url;
  const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || cfg.key;
  if(!url || !key) return null;
  try{return createClient(url,key)}catch{return null}
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!file) return resolve("");
    if(!file.type.startsWith("image/")) return reject(new Error("Selecione uma imagem válida."));
    if(file.size>2.5*1024*1024) return reject(new Error("A imagem deve ter no máximo 2,5 MB."));
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>reject(new Error("Não foi possível carregar a imagem."));
    r.readAsDataURL(file);
  });
}

function normalizeDb(d){
  const x=d||cloneInitial();
  return {
    products:(x.products||[]).map(p=>({...p,image:p.image||""})),
    additions:x.additions||[],
    sales:x.sales||[],
    cash:x.cash||cloneInitial().cash,
    settings:x.settings||cloneInitial().settings
  };
}

function Login({client,onLogged}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const submit=async e=>{
    e.preventDefault(); setError("");
    if(!email.trim()||password.length<6){setError("Informe um e-mail e uma senha com pelo menos 6 caracteres.");return}
    setBusy(true);
    try{
      const res=mode==="login"
        ? await client.auth.signInWithPassword({email:email.trim(),password})
        : await client.auth.signUp({email:email.trim(),password});
      if(res.error) throw res.error;
      if(mode==="signup" && !res.data.session){
        setError("Cadastro criado. Se a confirmação de e-mail estiver ativada no Supabase, confirme o e-mail antes de entrar.");
      }else{
        onLogged(res.data.session?.user||null);
      }
    }catch(err){setError(err?.message||"Não foi possível entrar.")}
    finally{setBusy(false)}
  };

  return <div className="authPage">
    <div className="authCard">
      <div className="authLogo">🍧</div>
      <h1>PDV Açaí</h1>
      <p>{mode==="login"?"Entre para acessar seus dados de qualquer dispositivo.":"Crie sua conta para sincronizar o PDV na nuvem."}</p>
      <form onSubmit={submit}>
        <label>E-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></label>
        <label>Senha<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label>
        {error&&<div className="errorBox">{error}</div>}
        <button className="primary wide" disabled={busy}>{busy?<RefreshCw className="spin"/>:<UserRound/>}{busy?"Aguarde...":mode==="login"?"Entrar":"Criar conta"}</button>
      </form>
      <button className="linkButton" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>
        {mode==="login"?"Ainda não tenho conta → Criar cadastro":"← Já tenho conta → Entrar"}
      </button>
    </div>
  </div>
}

function CloudSetup({onSave}){
  const [url,setUrl]=useState(getCloudConfig().url||DEFAULT_URL);
  const [key,setKey]=useState(getCloudConfig().key||"");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");

  const save=()=>{
    const u=url.trim().replace(/\/+$/,"");
    if(!/^https:\/\/.+\.supabase\.co$/.test(u)){setError("Confira a Project URL do Supabase.");return}
    if(!key.trim()){setError("Cole a Publishable key do Supabase.");return}
    localStorage.setItem(CLOUD_KEY,JSON.stringify({url:u,key:key.trim()}));
    onSave();
  };
  return <div className="authPage">
    <div className="authCard setupCard">
      <div className="authLogo">☁️</div>
      <h1>Conectar ao Supabase</h1>
      <p>Faça esta configuração uma vez neste aparelho. A chave <b>Publishable</b> é apropriada para uso no navegador quando o RLS está configurado.</p>
      <label>Project URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://seu-projeto.supabase.co"/></label>
      <label>Publishable key<div className="passwordRow"><input type={show?"text":"password"} value={key} onChange={e=>setKey(e.target.value)} placeholder="sb_publishable_..."/><button type="button" className="icon" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
      {error&&<div className="errorBox">{error}</div>}
      <button className="primary wide" onClick={save}><Cloud/>Conectar</button>
      <small>Não use a Secret key aqui.</small>
    </div>
  </div>
}

function App(){
  const [client,setClient]=useState(()=>getSupabaseClient());
  const [configVersion,setConfigVersion]=useState(0);
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [db,setDb]=useState(()=>normalizeDb(loadLocal()));
  const [loadedCloud,setLoadedCloud]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [tab,setTab]=useState("vendas");
  const [cart,setCart]=useState([]);
  const [productModal,setProductModal]=useState(null);
  const [addModal,setAddModal]=useState(null);
  const [search,setSearch]=useState("");
  const [notice,setNotice]=useState("");
  const [discount,setDiscount]=useState(0);

  useEffect(()=>{
    const c=getSupabaseClient();
    setClient(c);
    if(!c){setAuthLoading(false);return}
    let alive=true;
    c.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setAuthLoading(false)}}).catch(()=>setAuthLoading(false));
    const {data:{subscription}}=c.auth.onAuthStateChange((_event,s)=>{setSession(s)});
    return ()=>{alive=false;subscription.unsubscribe()};
  },[configVersion]);

  useEffect(()=>{
    if(!client||!session?.user||loadedCloud)return;
    let cancelled=false;
    (async()=>{
      setSyncing(true);
      try{
        const {data,error}=await client.from("pdv_data").select("data").eq("user_id",session.user.id).maybeSingle();
        if(error) throw error;
        if(cancelled)return;
        if(data?.data){
          const cloudDb=normalizeDb(data.data);
          setDb(cloudDb);
          localStorage.setItem(KEY,JSON.stringify(cloudDb));
        }else{
          const previousOwner=localStorage.getItem(CLOUD_OWNER_KEY);
          // Só migra o cache local se ele pertencer à mesma conta (ou se ainda não houver conta vinculada).
          // Isso evita que uma segunda conta no mesmo aparelho receba os dados da primeira.
          const localDb=previousOwner && previousOwner!==session.user.id ? cloneInitial() : normalizeDb(loadLocal());
          await client.from("pdv_data").upsert({user_id:session.user.id,data:localDb,updated_at:new Date().toISOString()},{onConflict:"user_id"});
          setDb(localDb);
          localStorage.setItem(KEY,JSON.stringify(localDb));
        }
        localStorage.setItem(CLOUD_OWNER_KEY,session.user.id);
        setLoadedCloud(true);
      }catch(err){
        setNotice("Não foi possível carregar a nuvem: "+(err?.message||"erro"));
      }finally{setSyncing(false)}
    })();
    return ()=>{cancelled=true};
  },[client,session?.user?.id,loadedCloud]);

  useEffect(()=>{
    if(!session?.user||!loadedCloud)return;
    localStorage.setItem(KEY,JSON.stringify(db));
    const timer=setTimeout(async()=>{
      if(!client)return;
      setSyncing(true);
      try{
        const {error}=await client.from("pdv_data").upsert({
          user_id:session.user.id,
          data:db,
          updated_at:new Date().toISOString()
        },{onConflict:"user_id"});
        if(error)throw error;
      }catch(err){setNotice("Alteração local salva, mas a nuvem falhou: "+(err?.message||"erro"))}
      finally{setSyncing(false)}
    },450);
    return ()=>clearTimeout(timer);
  },[db,session?.user?.id,loadedCloud,client]);

  const notify=m=>{setNotice(m);setTimeout(()=>setNotice(""),3000)};

  const signOut=async()=>{
    if(client) await client.auth.signOut();
    setSession(null);setLoadedCloud(false);setCart([]);setDiscount(0);
  };

  if(!client) return <CloudSetup onSave={()=>setConfigVersion(x=>x+1)}/>;
  if(authLoading) return <div className="authPage"><div className="authCard"><RefreshCw className="spin" size={34}/><p>Conectando...</p></div></div>;
  if(!session) return <Login client={client} onLogged={user=>{setSession({user});setLoadedCloud(false)}}/>;
  if(!loadedCloud) return <div className="authPage"><div className="authCard"><Cloud size={40}/><h2>Carregando seu PDV...</h2><p>Buscando produtos, vendas, estoque e caixa na nuvem.</p><RefreshCw className="spin" size={28}/></div></div>;

  const activeProducts=db.products.filter(p=>p.active && p.name.toLowerCase().includes(search.toLowerCase()));
  const activeAdds=db.additions.filter(p=>p.active);
  const subtotal=cart.reduce((s,i)=>s+i.total,0);
  const discountAmount=Math.min(Math.max(Number(discount)||0,0),subtotal);
  const discountPct=subtotal>0?(discountAmount/subtotal)*100:0;
  const total=Math.max(0,subtotal-discountAmount);

  const addToCart=(p,qty=1)=>{
    if(p.unit==="kg"){
      const grams=prompt("Informe o peso em gramas (ex.: 500):","500");
      const g=Number(grams);
      if(!g||g<=0)return;
      const unitPrice=Number(p.price||db.settings.priceKg);
      const item={id:uid(),kind:"weight",productId:p.id,name:p.name,qty:g/1000,displayQty:`${g} g`,unitPrice,total:(g/1000)*unitPrice,additions:[]};
      setCart(c=>[...c,item]); return;
    }
    const item={id:uid(),kind:"unit",productId:p.id,name:p.name,qty,total:p.price*qty,unitPrice:p.price,additions:[]};
    setCart(c=>[...c,item]);
  };
  const addAddition=(item,a)=>{
    if(item.kind!=="weight")return;
    if(a.stock<=0){notify("Adicional sem estoque.");return}
    setCart(c=>c.map(x=>x.id===item.id?{...x,additions:[...x.additions,a],total:x.total+a.price}:x));
  };
  const removeItem=id=>setCart(c=>c.filter(x=>x.id!==id));

  const pay=method=>{
    if(!db.cash.open){notify("Abra o caixa antes de vender.");return}
    if(!cart.length){notify("Carrinho vazio.");return}
    if(method==="Dinheiro"){
      const raw=prompt(`Total ${money(total)}\nInforme o valor recebido:`,"");
      if(raw===null)return;
      const got=Number(String(raw).replace(",","."));
      if(!got||got<total){notify("Valor recebido insuficiente.");return}
      finishSale(method,got,got-total);
    }else finishSale(method,total,0);
  };
  const finishSale=(method,received,change)=>{
    const sale={id:uid(),date:new Date().toISOString(),items:cart,subtotal,discount:discountAmount,total,method,received,change};
    setDb(d=>{
      const products=d.products.map(p=>{
        const used=cart.filter(i=>i.productId===p.id&&i.kind==="unit").reduce((s,i)=>s+i.qty,0);
        return {...p,stock:Math.max(0,p.stock-used)};
      });
      const additions=d.additions.map(a=>{
        const used=cart.flatMap(i=>i.additions||[]).filter(x=>x.id===a.id).length;
        return {...a,stock:Math.max(0,a.stock-used)};
      });
      return {...d,products,additions,sales:[...d.sales,sale]};
    });
    setCart([]);setDiscount(0);notify(`Venda registrada. Troco: ${money(change)}`);
  };

  const movement=(type)=>{
    if(!db.cash.open){notify("Abra o caixa primeiro.");return}
    const raw=prompt(type==="sangria"?"Valor da sangria:":"Valor do suprimento:","");
    if(raw===null)return;
    const value=Number(String(raw).replace(",","."));
    if(!value||value<=0)return;
    setDb(d=>({...d,cash:{...d.cash,movements:[...d.cash.movements,{id:uid(),type,value,date:new Date().toISOString()}]}}));
    notify(type==="sangria"?"Sangria registrada.":"Suprimento registrado.");
  };

  const openCash=()=>{
    const raw=prompt("Valor inicial do caixa (fundo de troco):","100");
    if(raw===null)return;
    const v=Number(String(raw).replace(",","."));
    if(v<0||Number.isNaN(v))return;
    setDb(d=>({...d,cash:{...d.cash,open:true,openedAt:new Date().toISOString(),initial:v,movements:[]}}));
    notify("Caixa aberto.");
  };
  const closeCash=()=>{
    const sums=paymentSummary(db.sales.filter(s=>s.date.slice(0,10)===today()));
    const sang=db.cash.movements.filter(m=>m.type==="sangria").reduce((s,m)=>s+m.value,0);
    const sup=db.cash.movements.filter(m=>m.type==="suprimento").reduce((s,m)=>s+m.value,0);
    const dinheiro=sums.Dinheiro||0;
    const expected=db.cash.initial+dinheiro+sup-sang;
    if(confirm(`Fechar caixa?\nEsperado em dinheiro: ${money(expected)}\nTotal vendido hoje: ${money(Object.values(sums).reduce((a,b)=>a+b,0))}`)){
      setDb(d=>({...d,cash:{...d.cash,open:false}}));notify("Caixa fechado.");
    }
  };

  return <div className="app">
    <header className="top">
      <div><small>PDV • ☁️ sincronizado</small><h1>{db.settings.storeName}</h1></div>
      <div className="topRight">
        <span className={db.cash.open?"badge ok":"badge"}>{db.cash.open?"CAIXA ABERTO":"CAIXA FECHADO"}</span>
        <button className="userBtn" onClick={signOut} title="Sair"><LogOut size={18}/></button>
      </div>
    </header>
    {notice&&<div className="toast">{notice}</div>}
    {syncing&&<div className="syncBar"><Cloud size={14}/> Sincronizando...</div>}

    {tab==="vendas"&&<Sales {...{db,cart,subtotal,total,discount,discountAmount,discountPct,setDiscount,activeProducts,activeAdds,search,setSearch,addToCart,addAddition,removeItem,pay,notify}}/>}
    {tab==="estoque"&&<Inventory {...{db,setDb,setProductModal,setAddModal,notify}}/>}
    {tab==="caixa"&&<Cash {...{db,openCash,closeCash,movement}}/>}
    {tab==="relatorios"&&<Reports db={db}/>}
    {tab==="config"&&<Config db={db} setDb={setDb} notify={notify}/>}

    <nav className="nav">
      {[
        ["vendas",ShoppingCart,"Vendas"],["estoque",Package,"Estoque"],["caixa",Wallet,"Caixa"],["relatorios",BarChart3,"Relatórios"],["config",Settings,"Config."]
      ].map(([id,I,label])=><button className={tab===id?"navbtn active":"navbtn"} onClick={()=>setTab(id)} key={id}><I size={20}/><span>{label}</span></button>)}
    </nav>

    {productModal&&<ProductForm value={productModal==="new"?null:productModal} onClose={()=>setProductModal(null)} onSave={p=>{
      setDb(d=>{
        const products=p.id?d.products.map(x=>x.id===p.id?p:x):[...d.products,{...p,id:uid(),active:true}];
        const settings=p.unit==="kg"?{...d.settings,priceKg:Number(p.price)}:d.settings;
        return {...d,products,settings};
      });
      setProductModal(null);notify("Produto salvo.");
    }}/>}
    {addModal&&<AddForm value={addModal==="new"?null:addModal} onClose={()=>setAddModal(null)} onSave={p=>{
      setDb(d=>({...d,additions:p.id?d.additions.map(x=>x.id===p.id?p:x):[...d.additions,{...p,id:uid(),active:true}]}));
      setAddModal(null);notify("Adicional salvo.");
    }}/>}
  </div>
}

function Sales({db,cart,subtotal,total,discount,discountAmount,discountPct,setDiscount,activeProducts,activeAdds,search,setSearch,addToCart,addAddition,removeItem,pay,notify}){
 return <main className="page sales">
  <div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..."/></div>
  <section><div className="sectionTitle"><h2>Produtos</h2><span>Toque para vender</span></div><div className="grid">
    {activeProducts.map(p=><button className="product" key={p.id} onClick={()=>addToCart(p)}>{p.image?<img className="productImg" src={p.image} alt=""/>:<div className="productImg placeholder">📷</div>}<b>{p.name}</b><span>{p.unit==="kg"?money(db.settings.priceKg)+"/kg":money(p.price)}</span></button>)}
  </div></section>
  <section className="cartBox"><div className="sectionTitle"><h2>Pedido</h2><button className="link" onClick={()=>cart.length&&notify("Use o X para remover itens.")}>Limpar</button></div>
   {!cart.length?<div className="empty">Nenhum item no pedido.</div>:cart.map(i=><div className="cartItem" key={i.id}><div><b>{i.name}</b><small>{i.kind==="weight"?i.displayQty:`${i.qty} un`} × {money(i.unitPrice)}</small>
      {i.additions?.map((a,n)=><small key={n}>+ {a.name} {money(a.price)}</small>)}
      {i.kind==="weight"&&<div className="addRow">{activeAdds.map(a=><button key={a.id} onClick={()=>addAddition(i,a)}>+ {a.name}</button>)}</div>}
    </div><strong>{money(i.total)}</strong><button className="icon danger" onClick={()=>removeItem(i.id)}><Trash2 size={17}/></button></div>)}
   <div className="discountBox">
    <div className="discountLine"><span>Subtotal</span><b>{money(subtotal)}</b></div>
    <div className="discountLine"><span>Desconto</span><b className="discountValue">{discount>0?`-${money(discountAmount)} (${discountPct.toFixed(2).replace(".",",")}%)`:"Nenhum"}</b></div>
    <button className="discountBtn" onClick={()=>{
      const mode=prompt("Tipo de desconto: digite 1 para R$ ou 2 para %","1");
      if(mode===null)return;
      if(mode!=="1"&&mode!=="2"){notify("Escolha 1 para R$ ou 2 para %.");return}
      const raw=prompt(mode==="2"?"Informe a porcentagem de desconto (0 a 100):":"Informe o desconto em R$ (ex.: 5,00):","0");
      if(raw===null)return;
      const value=Number(String(raw).replace(",","."));
      if(Number.isNaN(value)||value<0){notify("Desconto inválido.");return}
      if(mode==="2"){
        if(value>100){notify("O desconto percentual não pode passar de 100%.");return}
        setDiscount(subtotal*(value/100));
      }else setDiscount(Math.min(value,subtotal));
    }}>🏷️ <span>{discount>0?"Editar desconto":"Aplicar desconto"}</span></button>
    {discount>0&&<button className="removeDiscount" onClick={()=>setDiscount(0)}>Remover desconto</button>}
   </div>
   <div className="total"><span>Total a pagar</span><b>{money(total)}</b></div>
   <div className="payments"><button onClick={()=>pay("Dinheiro")}><Banknote/>Dinheiro</button><button onClick={()=>pay("PIX")}><Smartphone/>PIX</button><button onClick={()=>pay("Cartão de Crédito")}><CreditCard/>Crédito</button><button onClick={()=>pay("Cartão de Débito")}><CreditCard/>Débito</button></div>
  </section>
 </main>
}

function Inventory({db,setProductModal,setAddModal,notify,setDb}){
 const low=[...db.products,...db.additions].filter(x=>x.stock<=x.low);
 const delProduct=id=>{if(confirm("Excluir este produto?")){setDb(d=>({...d,products:d.products.filter(x=>x.id!==id)}));notify("Produto excluído.");}};
 const delAdd=id=>{if(confirm("Excluir este adicional?")){setDb(d=>({...d,additions:d.additions.filter(x=>x.id!==id)}));notify("Adicional excluído.");}};
 return <main className="page"><div className="sectionTitle"><h2>Produtos & Insumos</h2></div>
  {low.length>0&&<div className="alert">⚠️ Estoque baixo: {low.map(x=>x.name).join(", ")}</div>}
  <div className="actions"><button className="primary" onClick={()=>setProductModal("new")}><Plus/>Produto</button><button className="secondary" onClick={()=>setAddModal("new")}><Plus/>Adicional</button></div>
  <h3>Produtos vendidos</h3>{db.products.map(p=><div className="listItem" key={p.id}><div className="listMain">{p.image?<img className="listThumb" src={p.image} alt=""/>:<div className="listThumb placeholder">📷</div>}<div><b>{p.name}</b><small>{p.unit==="kg"?"Açaí / peso":"Unidade"} · Estoque: {p.stock}</small></div></div><strong>{money(p.unit==="kg"?db.settings.priceKg:p.price)}</strong><button className="icon" onClick={()=>setProductModal(p)}><Edit3 size={17}/></button><button className="icon danger" onClick={()=>delProduct(p.id)}><Trash2 size={17}/></button></div>)}
  <h3>Acompanhamentos</h3>{db.additions.map(a=><div className="listItem" key={a.id}><div><b>{a.name}</b><small>Estoque: {a.stock}</small></div><strong>{money(a.price)}</strong><button className="icon" onClick={()=>setAddModal(a)}><Edit3 size={17}/></button><button className="icon danger" onClick={()=>delAdd(a.id)}><Trash2 size={17}/></button></div>)}
 </main>
}

function Cash({db,openCash,closeCash,movement}){
 const todaySales=db.sales.filter(s=>s.date.slice(0,10)===today());
 const sum=todaySales.reduce((s,x)=>s+x.total,0);
 return <main className="page"><div className="cashCard"><div className="cashStatus"><Wallet size={30}/><div><small>Status</small><b>{db.cash.open?"CAIXA ABERTO":"CAIXA FECHADO"}</b></div></div>
  <div className="big">{money(sum)}</div><small>Vendas de hoje</small>
  {!db.cash.open?<button className="primary wide" onClick={openCash}><LockOpen/>Abrir caixa</button>:<><div className="actions"><button className="secondary" onClick={()=>movement("suprimento")}><ArrowUpFromLine/>Suprimento</button><button className="secondary" onClick={()=>movement("sangria")}><ArrowDownToLine/>Sangria</button></div><button className="dangerBtn wide" onClick={closeCash}><Lock/>Fechar caixa</button></>}
 </div><h3>Recebimentos hoje</h3><Summary sales={todaySales}/></main>
}
function Summary({sales}){const s=paymentSummary(sales);return <div className="summary">{["Dinheiro","PIX","Cartão de Crédito","Cartão de Débito"].map(k=><div key={k}><span>{k}</span><b>{money(s[k]||0)}</b></div>)}</div>}
function paymentSummary(sales){return sales.reduce((a,s)=>(a[s.method]=(a[s.method]||0)+s.total,a),{})}

function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;a.style.display="none";
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1200);
}
function exportSalesCSV(sales){
  const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=[["Data","Hora","Itens","Subtotal","Desconto","Total","Pagamento","Recebido","Troco"]];
  sales.forEach(s=>{
    const d=new Date(s.date);
    rows.push([d.toLocaleDateString("pt-BR"),d.toLocaleTimeString("pt-BR"),(s.items||[]).map(i=>`${i.name} (${i.qty})`).join(" | "),
      Number(s.subtotal??s.total??0).toFixed(2).replace(".",","),Number(s.discount||0).toFixed(2).replace(".",","),
      Number(s.total||0).toFixed(2).replace(".",","),s.method||"",Number(s.received??s.total??0).toFixed(2).replace(".",","),
      Number(s.change||0).toFixed(2).replace(".",",")]);
  });
  downloadBlob(new Blob(["\uFEFF"+rows.map(r=>r.map(esc).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}),`relatorio-vendas-${today()}.csv`);
}
function exportSalesTXT(db,sales){
  const total=sales.reduce((a,s)=>a+Number(s.total||0),0);
  const discounts=sales.reduce((a,s)=>a+Number(s.discount||0),0);
  let text=`${db.settings.storeName||"Minha Açaíteria"}\nRELATÓRIO DE VENDAS\nGerado em: ${new Date().toLocaleString("pt-BR")}\n\n`;
  sales.forEach((s,i)=>{
    const d=new Date(s.date);
    text+=`Venda ${i+1} — ${d.toLocaleString("pt-BR")}\n`;
    text+=`Itens: ${(s.items||[]).map(x=>`${x.name} (${x.qty})`).join(", ")}\n`;
    text+=`Subtotal: ${money(s.subtotal??s.total)} | Desconto: ${money(s.discount||0)} | Total: ${money(s.total)}\n`;
    text+=`Pagamento: ${s.method||""} | Recebido: ${money(s.received??s.total)} | Troco: ${money(s.change||0)}\n\n`;
  });
  text+=`RESUMO\nVendas: ${sales.length}\nDescontos: ${money(discounts)}\nFaturamento: ${money(total)}\n`;
  downloadBlob(new Blob(["\uFEFF"+text],{type:"text/plain;charset=utf-8"}),`relatorio-vendas-${today()}.txt`);
}
function exportSalesPNG(db,sales){
  const W=1080,rowH=54,headerH=220,footerH=170;
  const H=Math.max(540,headerH+Math.max(1,sales.length)*rowH+footerH);
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Seu navegador não conseguiu criar a imagem.");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#171717";ctx.font="700 36px Arial";ctx.fillText(db.settings.storeName||"Minha Açaíteria",50,65);
  ctx.font="700 30px Arial";ctx.fillText("RELATÓRIO DE VENDAS",50,112);
  ctx.font="20px Arial";ctx.fillStyle="#555";ctx.fillText(`Gerado em ${new Date().toLocaleString("pt-BR")}`,50,153);
  ctx.fillStyle="#eee";ctx.fillRect(40,175,W-80,52);
  ctx.fillStyle="#222";ctx.font="700 17px Arial";
  ctx.fillText("DATA/HORA",55,208);ctx.fillText("PAGAMENTO",330,208);ctx.fillText("DESCONTO",600,208);ctx.fillText("TOTAL",870,208);
  sales.forEach((s,i)=>{
    const y=headerH+i*rowH;
    if(i%2===0){ctx.fillStyle="#fafafa";ctx.fillRect(40,y,W-80,rowH)}
    const d=new Date(s.date);ctx.fillStyle="#222";ctx.font="17px Arial";
    ctx.fillText(d.toLocaleDateString("pt-BR")+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),55,y+34);
    ctx.fillText(String(s.method||""),330,y+34);ctx.fillText(money(s.discount||0),600,y+34);
    ctx.font="700 17px Arial";ctx.fillText(money(s.total||0),870,y+34);
  });
  const total=sales.reduce((a,s)=>a+Number(s.total||0),0), discounts=sales.reduce((a,s)=>a+Number(s.discount||0),0);
  const fy=headerH+Math.max(1,sales.length)*rowH+50;
  ctx.fillStyle="#222";ctx.font="700 20px Arial";ctx.fillText(`Vendas: ${sales.length}`,50,fy);ctx.fillText(`Descontos: ${money(discounts)}`,300,fy);ctx.fillText(`Faturamento: ${money(total)}`,650,fy);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>{if(blob){downloadBlob(blob,`relatorio-vendas-${today()}.png`);resolve()}else reject(new Error("Não foi possível gerar a imagem."))},"image/png"));
}
function Reports({db}){
 const [period,setPeriod]=useState("day");
 const now=Date.now(),days=period==="day"?1:period==="week"?7:30;
 const sales=db.sales.filter(s=>now-new Date(s.date).getTime()<days*86400000);
 const sum=sales.reduce((a,s)=>a+s.total,0);
 const items={};sales.forEach(s=>(s.items||[]).forEach(i=>{items[i.name]=(items[i.name]||0)+i.qty}));
 const top=Object.entries(items).sort((a,b)=>b[1]-a[1]).slice(0,10);
 const save=fn=>{try{fn()}catch(e){alert(e?.message||"Não foi possível salvar o relatório.")}};
 return <main className="page"><div className="tabs">{[["day","Hoje"],["week","7 dias"],["month","30 dias"]].map(x=><button className={period===x[0]?"sel":""} onClick={()=>setPeriod(x[0])} key={x[0]}>{x[1]}</button>)}</div>
  <div className="reportActions"><button className="secondary" onClick={()=>save(()=>exportSalesCSV(sales))}>💾 CSV</button><button className="secondary" onClick={()=>save(()=>exportSalesTXT(db,sales))}>📄 TXT</button><button className="primary" onClick={()=>save(()=>exportSalesPNG(db,sales))}>🖼️ Imagem PNG</button></div>
  <div className="stat"><small>Faturamento</small><b>{money(sum)}</b><span>{sales.length} vendas</span></div><h3>Por pagamento</h3><Summary sales={sales}/><h3>Mais vendidos</h3>{top.length?top.map(([n,q])=><div className="rank" key={n}><span>{n}</span><b>{q} un/kg</b></div>):<div className="empty">Ainda não há vendas no período.</div>}
 </main>
}
function Config({db,setDb,notify}){
 const [name,setName]=useState(db.settings.storeName),[price,setPrice]=useState(db.settings.priceKg);
 const save=()=>{setDb(d=>{const priceKg=Number(price);const products=d.products.map(p=>p.unit==="kg"&&p.name.trim().toLowerCase()==="açaí"?{...p,price:priceKg}:p);return {...d,products,settings:{...d.settings,storeName:name,priceKg}}});notify("Configurações salvas.");};
 const reset=()=>{if(confirm("Apagar todos os dados da conta e voltar ao padrão?"))setDb(cloneInitial())};
 return <main className="page"><h2>Configurações</h2><label>Nome da açaíteria<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Preço do açaí por kg<input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label><button className="primary wide" onClick={save}><Save/>Salvar alterações</button>
 <div className="info">☁️ Seus dados agora são sincronizados com o Supabase. Você pode entrar com a mesma conta em outro celular e encontrar produtos, preços, vendas, estoque, caixa, relatórios e configurações.</div>
 <button className="dangerBtn wide" onClick={reset}><RotateCcw/>Restaurar dados de fábrica</button></main>
}
function ProductForm({value,onClose,onSave}){
 const [f,setF]=useState(value||{name:"",category:"Bebidas",price:0,unit:"un",stock:0,low:5,active:true,image:""});
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const pickImage=async e=>{const file=e.target.files?.[0];if(!file)return;try{set("image",await fileToDataUrl(file))}catch(err){alert(err.message);e.target.value=""}};
 return <Modal title={value?"Editar produto":"Novo produto"} close={onClose}><label>Nome<input value={f.name} onChange={e=>set("name",e.target.value)}/></label><label>Categoria<input value={f.category} onChange={e=>set("category",e.target.value)}/></label><label>{f.unit==="kg"?"Preço do açaí por kg":"Preço por unidade"}<input type="number" step="0.01" value={f.price} onChange={e=>set("price",Number(e.target.value))}/></label><label>Unidade<select value={f.unit} onChange={e=>set("unit",e.target.value)}><option value="un">Unidade</option><option value="kg">Kg / peso</option></select></label><label>Estoque<input type="number" value={f.stock} onChange={e=>set("stock",Number(e.target.value))}/></label><label>Alerta quando chegar a<input type="number" value={f.low} onChange={e=>set("low",Number(e.target.value))}/></label>
 <div className="imageField"><label>Imagem do produto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage}/></label>{f.image&&<div className="imagePreview"><img src={f.image} alt="Prévia"/><button type="button" className="secondary" onClick={()=>set("image","")}>Remover imagem</button></div>}<small>JPG, PNG ou WEBP · máximo 2,5 MB.</small></div>
 <button className="primary wide" onClick={()=>f.name.trim()?onSave(f):null}><Save/>Salvar</button></Modal>
}
function AddForm({value,onClose,onSave}){
 const [f,setF]=useState(value||{name:"",price:0,stock:0,low:5,active:true});const set=(k,v)=>setF(x=>({...x,[k]:v}));
 return <Modal title={value?"Editar adicional":"Novo adicional"} close={onClose}><label>Nome<input value={f.name} onChange={e=>set("name",e.target.value)}/></label><label>Preço<input type="number" step="0.01" value={f.price} onChange={e=>set("price",Number(e.target.value))}/></label><label>Estoque<input type="number" value={f.stock} onChange={e=>set("stock",Number(e.target.value))}/></label><label>Alerta quando chegar a<input type="number" value={f.low} onChange={e=>set("low",Number(e.target.value))}/></label><button className="primary wide" onClick={()=>f.name.trim()?onSave(f):null}><Save/>Salvar</button></Modal>
}
function Modal({title,close,children}){return <div className="overlay"><div className="modal"><div className="modalHead"><h2>{title}</h2><button className="icon" onClick={close}><X/></button></div>{children}</div></div>}

createRoot(document.getElementById("root")).render(<App/>);
