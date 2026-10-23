(() => {
  'use strict';
  const cfg = window.BLISS_CONFIG;
  const categories = window.BLISS_CATEGORIES;
  const STORAGE_CART = 'bliss-burger-cart-v2';
  const STORAGE_MENU = 'bliss-burger-menu-override-v2';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const money = value => '$' + new Intl.NumberFormat('es-CO', {maximumFractionDigits:0}).format(value || 0);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const stored = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const store = (key, value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} };
  const original = window.BLISS_MENU || [];
  const overrides = stored(STORAGE_MENU);
  const products = original.map(item => {
    const edited = Array.isArray(overrides) ? overrides.find(x => x && x.id === item.id) : null;
    if (!edited) return item;
    return {...item, name:typeof edited.name === 'string' && edited.name.trim() ? edited.name.trim() : item.name,
      description:typeof edited.description === 'string' ? edited.description.slice(0,900) : item.description,
      price:Number.isInteger(Number(edited.price)) && Number(edited.price)>=0 && Number(edited.price)<2000000 ? Number(edited.price) : item.price};
  });
  const productById = new Map(products.map(product => [product.id,product]));
  let cart = (Array.isArray(stored(STORAGE_CART)) ? stored(STORAGE_CART) : []).filter(item => productById.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity < 100);
  let selectedCategory = 'all';
  let searchText = '';
  let modalProduct = null;
  let modalQty = 1;
  let toastTimeout;

  function icon(id){ return '<svg aria-hidden="true"><use href="#ic-'+id+'"></use></svg>'; }
  function toast(msg){
    const el=$('#toast');
    el.textContent=msg;el.classList.add('is-visible');
    clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove('is-visible'),2500);
  }
  function openDialog(selector){
    const target=$(selector);
    $$('dialog[open]').forEach(el => { if (el !== target) el.close(); });
    if (!target.open) target.showModal();
    document.body.classList.add('is-modal-open');
  }
  function closeDialog(selector){
    const target=$(selector);
    if (target && target.open) target.close();
    if (!$$('dialog[open]').length) document.body.classList.remove('is-modal-open');
  }
  $$('dialog').forEach(d => {
    d.addEventListener('close',()=>{ if (!$$('dialog[open]').length) document.body.classList.remove('is-modal-open'); });
    d.addEventListener('click',e=>{if (e.target===d) d.close();});
  });
  $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeDialog('#'+btn.dataset.close)));

  function renderCategories(){
    $('#category-filters').innerHTML = categories.map(category => {
      const active=selectedCategory===category.id;
      return '<button type="button" class="filter-btn '+(active?'is-active':'')+'" aria-pressed="'+active+'" data-category="'+escapeHtml(category.id)+'">'+category.icon+' '+escapeHtml(category.label)+'</button>';
    }).join('');
  }
  function visibleProducts(){
    return products.filter(p => (selectedCategory==='all' || p.category===selectedCategory) &&
      (!searchText || normalize([p.name,p.description,p.tag].join(' ')).includes(normalize(searchText))));
  }
  function renderProducts(){
    renderCategories();
    const items=visibleProducts();
    $('#results-count').textContent=items.length+' '+(items.length===1?'PRODUCTO':'PRODUCTOS')+' PARA ELEGIR';
    $('#empty-products').hidden=items.length!==0;
    $('#products-grid').innerHTML=items.map(p=>{
      const cat=categories.find(c=>c.id===p.category)?.label || p.category;
      return '<article class="product-card">'+
        '<div class="product-media"><img src="'+escapeHtml(p.image)+'" alt="Presentaci\u00f3n ilustrativa de '+escapeHtml(p.name)+'" loading="lazy">'+
        '<span class="product-chip">'+escapeHtml(p.tag || cat)+'</span><span class="product-illustration">Imagen ilustrativa</span></div>'+
        '<div class="product-body"><span class="product-category-label">'+escapeHtml(cat)+'</span><h3>'+escapeHtml(p.name)+'</h3>'+
        '<p class="product-description">'+escapeHtml(p.description)+'</p>'+
        (p.includes?'<p class="includes-line">✓ '+escapeHtml(p.includes)+'</p>':'')+
        '<div class="product-bottom"><strong class="product-price">'+money(p.price)+'</strong>'+
        '<button type="button" class="product-cta" data-detail="'+escapeHtml(p.id)+'" aria-label="Agregar '+escapeHtml(p.name)+' al pedido">'+icon('plus')+'</button></div>'+
        '<button type="button" class="product-detail-link" data-detail="'+escapeHtml(p.id)+'">Ver detalles y agregar</button></div></article>';
    }).join('');
  }
  function openProduct(id){
    const p=productById.get(id);
    if(!p)return;
    modalProduct=p;modalQty=1;
    $('#product-modal-image').src=p.image;
    $('#product-modal-image').alt='Fotograf\u00eda ilustrativa para '+p.name;
    $('#product-title').textContent=p.name;
    $('#product-category').textContent=categories.find(c=>c.id===p.category)?.label.toUpperCase()||'PRODUCTO';
    $('#product-description').textContent=p.description+(p.includes?'  ✓ '+p.includes:'');
    $('#product-price').textContent=money(p.price);
    $('#product-notes').value='';
    $('#modal-qty').textContent='1';
    openDialog('#product-dialog');
  }
  function addToCart(product, quantity, notes){
    const key=product.id+'::'+normalize(notes.trim());
    const found=cart.find(line=>line.key===key);
    if (found) found.quantity=Math.min(99,found.quantity+quantity);
    else cart.push({key,id:product.id,quantity,notes:notes.trim().slice(0,250)});
    persistCart();
    toast(quantity+' x '+product.name+' agregado'+(quantity===1?'':'s')+' al pedido');
  }
  function persistCart(){store(STORAGE_CART,cart);renderCart();}
  function cartCount(){return cart.reduce((total,line)=>total+line.quantity,0);}
  function cartSubtotal(){return cart.reduce((total,line)=>total+(productById.get(line.id)?.price||0)*line.quantity,0);}
  function renderCart(){
    const count=cartCount(),subtotal=cartSubtotal();
    $('#nav-count').textContent=count;$('#float-count').textContent=count;
    $('#float-total').textContent=count?money(subtotal):'Sin productos';
    $('#cart-total').textContent=money(subtotal);
    $('#checkout-button').disabled=!count;
    if(!count){
      $('#cart-items').innerHTML='<div class="empty-cart"><div class="empty-cart-icon">'+icon('bag')+'</div><h3>TU PEDIDO EMPIEZA AQU\u00cd</h3><p>Elige tus favoritos y agr\u00e9galos al carrito. Luego enviamos todo a WhatsApp.</p></div>';
      return;
    }
    $('#cart-items').innerHTML=cart.map((line,i)=>{
      const p=productById.get(line.id);
      return '<div class="cart-row"><img src="'+escapeHtml(p.image)+'" alt="" loading="lazy">'+
        '<div><h3>'+escapeHtml(p.name)+'</h3>'+(line.notes?'<p>Nota: '+escapeHtml(line.notes)+'</p>':'')+'<strong>'+money(p.price*line.quantity)+'</strong></div>'+
        '<div class="cart-row-controls"><div class="mini-qty"><button type="button" aria-label="Quitar una unidad de '+escapeHtml(p.name)+'" data-qty-change="-1" data-row="'+i+'">'+icon('minus')+'</button><b>'+line.quantity+'</b><button type="button" aria-label="Agregar una unidad de '+escapeHtml(p.name)+'" data-qty-change="1" data-row="'+i+'">'+icon('plus')+'</button></div><button type="button" class="trash-btn" data-remove="'+i+'" aria-label="Eliminar '+escapeHtml(p.name)+'">'+icon('trash')+'</button></div></div>';
    }).join('');
  }
  function setQuantity(idx,delta){
    if (!cart[idx]) return;
    cart[idx].quantity=Math.min(99,cart[idx].quantity+delta);
    if(cart[idx].quantity<=0)cart.splice(idx,1);
    persistCart();
  }
  function updateDelivery(){
    const isDelivery=$('input[name="service"]:checked').value==='domicilio';
    $('#delivery-fields').hidden=!isDelivery;
    $('#customer-address').required=isDelivery;
  }
  function updatePayment(){
    const transfer = $('#payment-method').value === 'Transferencia Bre-B';
    $('#checkout-breb').hidden = !transfer;
  }
  async function copyKey(){
    const value = cfg.brebKey;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const t=document.createElement('textarea');
        t.value=value; t.style.position='fixed'; t.style.left='-9999px';
        document.body.appendChild(t); t.select();
        if (!document.execCommand('copy')) throw new Error('Copy failed');
        t.remove();
      }
      toast('Llave Bre-B copiada');
    } catch {toast('No se pudo copiar. La llave es: '+value);}
  }
  function orderText(){
    const lines=[
      '*NUEVO PEDIDO - BLISS BURGER CO.*',
      '',
      ...cart.map((line,i)=>{
        const p=productById.get(line.id);
        return (i+1)+'. *'+p.name+'* x'+line.quantity+' - '+money(p.price*line.quantity)+(line.notes?'\n   Indicaci\u00f3n: '+line.notes:'');
      }),
      '',
      '*Subtotal de la carta:* '+money(cartSubtotal()),
      '*Domicilio:* '+($('input[name="service"]:checked').value==='domicilio'?'tarifa por confirmar':'no aplica (recoger en local)'),
      '*Total final:* por confirmar con el restaurante',
      '',
      '*DATOS DEL CLIENTE*',
      'Nombre: '+$('#customer-name').value.trim(),
      'Celular: '+($('#customer-phone').value.trim()||'No indicado'),
      'Modalidad: '+($('input[name="service"]:checked').value==='domicilio'?'Domicilio':'Recoger en el local')
    ];
    if ($('input[name="service"]:checked').value==='domicilio') {
      lines.push('Direcci\u00f3n: '+$('#customer-address').value.trim());
      if ($('#customer-neighborhood').value.trim()) lines.push('Barrio / sector: '+$('#customer-neighborhood').value.trim());
    }
    lines.push('Pago: '+$('#payment-method').value);
    if ($('#payment-method').value==='Transferencia Bre-B') {
      lines.push('Llave Bre-B de Bliss Burger Co.: '+cfg.brebKey);
      lines.push('Realizar transferencia después de confirmar total y enviar comprobante por este chat.');
    }
    if ($('#customer-notes').value.trim()) lines.push('Notas: '+$('#customer-notes').value.trim());
    lines.push('','Por favor, confirmen disponibilidad, costo de domicilio y valor final. \u00a1Gracias!');
    return lines.join('\n');
  }
  function prepareCheckout(){
    if(!cart.length){toast('Primero agrega productos al pedido');return;}
    $('#checkout-info').innerHTML='<p><strong>'+cartCount()+' producto(s)</strong> en tu pedido \u00b7 Subtotal de referencia: <strong>'+money(cartSubtotal())+'</strong></p><p>Se abrir\u00e1 WhatsApp con el detalle del pedido. El restaurante confirma disponibilidad y total final.</p>';
    $('#checkout-disclaimer').textContent='Est\u00e1s enviando una solicitud por WhatsApp, no un pago en l\u00ednea. El domicilio y la disponibilidad se confirman con el restaurante.';
    updateDelivery();updatePayment();openDialog('#checkout-dialog');
  }
  async function copyOrder(){
    if (!$('#customer-name').value.trim()) $('#customer-name').value='Por confirmar';
    const text=orderText();
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const tmp=document.createElement('textarea'); tmp.value=text;tmp.style.position='fixed';tmp.style.left='-9999px';document.body.appendChild(tmp);tmp.select();
        if(!document.execCommand('copy')) throw new Error('Not copied');tmp.remove();
      }
      toast('Resumen copiado al portapapeles');
    } catch {toast('No se pudo copiar en este navegador');}
  }
  function submitCheckout(e){
    e.preventDefault();
    if(!cart.length){toast('Tu pedido est\u00e1 vac\u00edo');return;}
    if(!$('#checkout-form').reportValidity()) return;
    const url='https://wa.me/'+cfg.whatsapp+'?text='+encodeURIComponent(orderText());
    const link=document.createElement('a');
    link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    document.body.appendChild(link);link.click();link.remove();
    toast('WhatsApp abierto: env\u00eda el mensaje para confirmar tu pedido');
  }

  $('#category-filters').addEventListener('click',e=>{
    const btn=e.target.closest('[data-category]');if(!btn)return;
    selectedCategory=btn.dataset.category;renderProducts();
  });
  $('#menu-search').addEventListener('input',e=>{searchText=e.target.value.trim();renderProducts();});
  $('#products-grid').addEventListener('click',e=>{
    const btn=e.target.closest('[data-detail]');if(btn)openProduct(btn.dataset.detail);
  });
  $('#clear-filters').addEventListener('click',()=>{
    selectedCategory='all';searchText='';$('#menu-search').value='';renderProducts();
  });
  $('#modal-qty-minus').addEventListener('click',()=>{modalQty=Math.max(1,modalQty-1);$('#modal-qty').textContent=modalQty;});
  $('#modal-qty-plus').addEventListener('click',()=>{modalQty=Math.min(99,modalQty+1);$('#modal-qty').textContent=modalQty;});
  $('#add-modal-product').addEventListener('click',()=>{
    if(!modalProduct)return;
    addToCart(modalProduct,modalQty,$('#product-notes').value);
    closeDialog('#product-dialog');
  });
  $('#cart-items').addEventListener('click',e=>{
    const change=e.target.closest('[data-qty-change]');
    if(change){setQuantity(Number(change.dataset.row),Number(change.dataset.qtyChange));return;}
    const remove=e.target.closest('[data-remove]');
    if(remove){cart.splice(Number(remove.dataset.remove),1);persistCart();}
  });
  $$('[data-action="view-cart"]').forEach(el=>el.addEventListener('click',()=>openDialog('#cart-dialog')));
  $('#checkout-button').addEventListener('click',prepareCheckout);
  $$('input[name="service"]').forEach(input=>input.addEventListener('change',updateDelivery));
  $('#checkout-form').addEventListener('submit',submitCheckout);
  $('#copy-order').addEventListener('click',copyOrder);
  $('#menu-toggle').addEventListener('click',()=>{
    const open=$('#main-nav').classList.toggle('is-open');
    $('#menu-toggle').setAttribute('aria-expanded',open);
    $('#menu-toggle').setAttribute('aria-label',open?'Cerrar men\u00fa':'Abrir men\u00fa');
  });
  $('#payment-method').addEventListener('change',updatePayment);
  $$('[data-action="copy-key"]').forEach(btn=>btn.addEventListener('click',copyKey));
  $$('#main-nav a').forEach(link=>link.addEventListener('click',()=>{
    $('#main-nav').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');
  }));
  document.addEventListener('keydown',e=>{
    if(e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !$$('dialog[open]').length){e.preventDefault();$('#menu-search').focus();}
  });
  $('#address-text').textContent=cfg.address;
  $('#hours-text').textContent=cfg.hours;
  $('#maps-link').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(cfg.address);
  $('#year').textContent=new Date().getFullYear();
  renderProducts();renderCart();
})();
