/* Contato do site da IGL: cadastro mínimo antes do WhatsApp e da agenda.
 *
 * Mesmo fluxo do site do Gravity, no mesmo endpoint, com site: 'igl'. O WhatsApp vai para a linha comercial
 * (11 92085-4887, a mesma do Gravity) e a agenda abre como conversa com a IGL (agendar?cid=…&ctx=igl).
 * Aqui empresa e CNPJ são opcionais: investidor ou produtor rural do Contango costuma ser pessoa física.
 *
 * Uso: qualquer link com data-contato="whatsapp" | "agendar" e data-produto="geral" | "gravity" | ….
 * O href do link continua valendo se este script não carregar.
 *
 * Quem já se cadastrou (localStorage, 30 dias) não vê o formulário de novo: o clique abre o destino
 * direto e o cadastro é reenviado em segundo plano, para o Igor saber que a pessoa voltou.
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://n8n.iglconsulting.com.br/webhook/lead-site';
  var CHAVE = 'igl_lead';
  var TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
  // Só se o endpoint falhar duas vezes: links sem identificação do lead.
  var RESERVA = {
    whatsapp_url: 'https://wa.me/5511920854887?text=' +
      encodeURIComponent('Olá! Vim pelo site da IGL Consulting e gostaria de conversar.'),
    agendar_url: 'https://iglconsulting.com.br/agendar?ctx=igl'
  };
  var PAISES = [
    ['55', 'Brasil +55'], ['351', 'Portugal +351'], ['1', 'EUA / Canadá +1'], ['54', 'Argentina +54'],
    ['56', 'Chile +56'], ['595', 'Paraguai +595'], ['598', 'Uruguai +598'], ['52', 'México +52'],
    ['57', 'Colômbia +57'], ['51', 'Peru +51'], ['34', 'Espanha +34'], ['49', 'Alemanha +49'],
    ['39', 'Itália +39'], ['86', 'China +86'], ['', 'Outro país']
  ];
  var MSG = {
    nome: 'Escreva seu nome e sobrenome.',
    email: 'Confira o e-mail.',
    telefone: 'Confira o celular, com DDD. É de fora do Brasil? Escolha o país.',
    cnpj: 'CNPJ inválido. Confira os números.',
    empresa: 'Informe o nome da empresa.',
    consentimento: 'Preciso do seu aceite para entrar em contato.'
  };

  /* ---------- armazenamento (pode falhar em aba anônima: tudo em try) ---------- */
  function ler(area, chave) { try { return JSON.parse(window[area].getItem(chave)); } catch (e) { return null; } }
  function gravar(area, chave, valor) { try { window[area].setItem(chave, JSON.stringify(valor)); } catch (e) {} }

  function guardado() {
    var g = ler('localStorage', CHAVE);
    return g && g.resposta && Date.now() - g.em < TRINTA_DIAS ? g : null;
  }

  // UTMs da chegada: guardadas na sessão, porque somem da URL ao trocar de página.
  function utms() {
    var u = ler('sessionStorage', 'igl_utm') || {};
    var p = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (p.get(k)) u[k] = p.get(k);
    });
    gravar('sessionStorage', 'igl_utm', u);
    return u;
  }
  utms();

  function corpo(cadastro, produto, website) {
    return JSON.stringify(Object.assign({}, cadastro, {
      website: website || '', site: 'igl', produto: produto, pagina: location.href
    }, utms()));
  }

  // Devolve a resposta 200, { erros: [...] } (400) ou { falhou: true } (rede ou 5xx).
  function enviar(cadastro, produto, website) {
    return fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo(cadastro, produto, website)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (r.status === 400) return { erros: j.erros || [] };
        if (!r.ok || !j.ok) return { falhou: true };
        return j;
      });
    }).catch(function () { return { falhou: true }; });
  }

  function cnpjValido(valor) {
    var c = String(valor).replace(/\D/g, '');
    if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
    function dv(base) {
      var pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      var soma = 0;
      for (var i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
      var r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    }
    var d1 = dv(c.slice(0, 12)), d2 = dv(c.slice(0, 12) + d1);
    return c.slice(12) === String(d1) + String(d2);
  }

  /* ---------- estilo (escopado em .ct-, na identidade do site) ---------- */
  var css = [
    '.ct-fundo{position:fixed;inset:0;z-index:1000;background:rgba(5,6,9,.78);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}',
    '.ct-fundo[hidden]{display:none}',
    '.ct-caixa{position:relative;width:100%;max-width:460px;max-height:calc(100vh - 32px);overflow:auto;background:var(--ink2,#1a1d25);border:1px solid rgba(201,168,76,.22);padding:36px 32px 30px;color:var(--cream,#f5f0e8);font-family:var(--sans,"DM Sans",sans-serif);font-weight:300;line-height:1.6;box-shadow:0 24px 80px rgba(0,0,0,.55);animation:ct-entra .25s ease-out}',
    '@keyframes ct-entra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.ct-caixa{animation:none}}',
    '@media (max-width:520px){.ct-caixa{padding:30px 20px 24px}}',
    '.ct-fechar{position:absolute;top:10px;right:12px;width:36px;height:36px;background:none;border:0;color:var(--muted,#8a8d96);font-size:26px;line-height:1;cursor:pointer}',
    '.ct-fechar:hover{color:var(--gold,#c9a84c)}',
    '.ct-rotulo{font-size:.68rem;letter-spacing:.22em;text-transform:uppercase;color:var(--gold,#c9a84c);margin:0 0 8px}',
    '.ct-titulo{font-family:var(--serif,"Cormorant Garamond",Georgia,serif);font-weight:300;font-size:2rem;line-height:1.15;margin:0 0 10px;color:var(--cream,#f5f0e8)}',
    '.ct-titulo em{font-style:italic;color:var(--gold2,#e8c97a)}',
    '.ct-titulo:focus{outline:none}',
    '.ct-sub{font-size:.9rem;color:var(--light,#d4cfc6);margin:0 0 22px}',
    '.ct-campo{display:block;margin:0 0 4px}',
    '.ct-campo>span,.ct-legenda{display:block;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a8d96);margin:0 0 6px}',
    '.ct-campo[hidden]{display:none}',
    '.ct-caixa input:not([type=checkbox]),.ct-caixa select{width:100%;background:var(--ink,#0d0f14);border:1px solid rgba(245,240,232,.14);color:var(--cream,#f5f0e8);font:inherit;font-size:.95rem;font-weight:400;padding:11px 12px;border-radius:0;outline:none;transition:border-color .2s}',
    '.ct-caixa input:focus,.ct-caixa select:focus{border-color:var(--gold,#c9a84c)}',
    '.ct-caixa input[aria-invalid=true]{border-color:#e07a6f}',
    '.ct-caixa select{appearance:none;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,#c9a84c 50%),linear-gradient(135deg,#c9a84c 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:30px}',
    '.ct-tel{display:grid;grid-template-columns:minmax(0,150px) 1fr;gap:8px}',
    '@media (max-width:400px){.ct-tel{grid-template-columns:1fr}}',
    '.ct-erro{min-height:1.2em;margin:4px 0 10px;font-size:.78rem;color:#e8968c}',
    '.ct-aceite{display:flex;gap:10px;align-items:flex-start;font-size:.82rem;color:var(--light,#d4cfc6);cursor:pointer;margin:6px 0 0}',
    '.ct-aceite input{margin-top:3px;width:16px;height:16px;flex:none;accent-color:#c9a84c}',
    '.ct-armadilha{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}',
    '.ct-enviar,.ct-botoes a{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 20px;font-family:var(--sans,"DM Sans",sans-serif);font-size:.8rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border:0;cursor:pointer;transition:background .25s,opacity .25s}',
    '.ct-enviar{background:var(--gold,#c9a84c);color:var(--ink,#0d0f14);margin-top:8px}',
    '.ct-enviar:hover{background:var(--gold2,#e8c97a)}',
    '.ct-enviar[disabled]{opacity:.6;cursor:wait}',
    '.ct-aviso{font-size:.8rem;color:var(--muted,#8a8d96);margin:10px 0 0;min-height:1.2em}',
    '.ct-botoes{display:grid;gap:12px;margin-top:6px}',
    '.ct-botoes .ct-zap{background:#25D366;color:#fff}',
    '.ct-botoes .ct-zap:hover{background:#1fb357}',
    '.ct-botoes .ct-agenda{background:transparent;color:var(--gold2,#e8c97a);border:1px solid rgba(201,168,76,.55)}',
    '.ct-botoes .ct-agenda:hover{border-color:var(--gold2,#e8c97a)}',
    '.ct-botoes.ct-agenda-primeiro .ct-agenda{order:-1;background:var(--gold,#c9a84c);color:var(--ink,#0d0f14);border-color:transparent}',
    '.ct-caixa a:focus-visible,.ct-caixa button:focus-visible{outline:2px solid var(--gold2,#e8c97a);outline-offset:2px}'
  ].join('\n');

  var ICONE_ZAP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

  var html =
    '<div class="ct-caixa" role="dialog" aria-modal="true" aria-labelledby="ct-titulo">' +
      '<button type="button" class="ct-fechar" aria-label="Fechar">&times;</button>' +
      '<form class="ct-form" novalidate>' +
        '<p class="ct-rotulo">Contato</p>' +
        '<h2 id="ct-titulo" class="ct-titulo">Vamos <em>conversar</em></h2>' +
        '<p class="ct-sub">Antes, só alguns dados. Assim eu já chego na conversa sabendo quem você é e o que procura.</p>' +
        '<label class="ct-campo"><span>Nome e sobrenome</span><input name="nome" autocomplete="name"></label>' +
        '<p class="ct-erro" data-erro="nome"></p>' +
        '<label class="ct-campo"><span>E-mail</span><input name="email" type="email" autocomplete="email"></label>' +
        '<p class="ct-erro" data-erro="email"></p>' +
        '<div class="ct-campo"><span class="ct-legenda" id="ct-tel-rotulo">Celular (WhatsApp)</span>' +
          '<div class="ct-tel"><select name="ddi" aria-label="País do celular">' +
            PAISES.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') +
          '</select><input name="telefone" type="tel" autocomplete="tel" aria-labelledby="ct-tel-rotulo"></div></div>' +
        '<p class="ct-erro" data-erro="telefone"></p>' +
        '<label class="ct-campo"><span>Empresa (opcional)</span><input name="empresa" autocomplete="organization"></label>' +
        '<p class="ct-erro" data-erro="empresa"></p>' +
        '<label class="ct-campo" data-so="br"><span>CNPJ (opcional)</span><input name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"></label>' +
        '<p class="ct-erro" data-erro="cnpj"></p>' +
        '<label class="ct-aceite"><input type="checkbox" name="consentimento"><span>Concordo que a IGL Consulting use estes dados para entrar em contato comigo.</span></label>' +
        '<p class="ct-erro" data-erro="consentimento"></p>' +
        '<input class="ct-armadilha" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button type="submit" class="ct-enviar">Continuar</button>' +
        '<p class="ct-aviso" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<div class="ct-pronto" hidden>' +
        '<p class="ct-rotulo">Tudo certo</p>' +
        '<h2 class="ct-titulo" tabindex="-1">Pronto, <em class="ct-nome"></em>!</h2>' +
        '<p class="ct-sub ct-pronto-sub"></p>' +
        '<div class="ct-botoes">' +
          '<a class="ct-zap" target="_blank" rel="noopener">' + ICONE_ZAP + 'Chamar no WhatsApp</a>' +
          '<a class="ct-agenda" target="_blank" rel="noopener">Agendar 30 minutos</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  var fundo, form, pronto, gatilho = null, intencao = 'whatsapp', produto = 'geral';

  function montar() {
    if (fundo) return;
    var estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.appendChild(estilo);
    fundo = document.createElement('div');
    fundo.className = 'ct-fundo';
    fundo.hidden = true;
    fundo.innerHTML = html;
    document.body.appendChild(fundo);
    form = fundo.querySelector('.ct-form');
    pronto = fundo.querySelector('.ct-pronto');

    fundo.querySelector('.ct-fechar').addEventListener('click', fechar);
    fundo.addEventListener('mousedown', function (ev) { if (ev.target === fundo) fechar(); });
    fundo.addEventListener('keydown', teclado);
    form.ddi.addEventListener('change', trocarPais);
    form.telefone.addEventListener('blur', function () {
      if (form.ddi.value === '55') form.telefone.value = mascaraTelBr(form.telefone.value);
    });
    form.cnpj.addEventListener('blur', function () { form.cnpj.value = mascaraCnpj(form.cnpj.value); });
    form.addEventListener('submit', aoEnviar);
    trocarPais();
  }

  /* ---------- formulário ---------- */
  function mascaraTelBr(v) {
    if (/^\s*\+/.test(v)) return v;
    var d = v.replace(/\D/g, '');
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return v;
  }
  function mascaraCnpj(v) {
    var d = v.replace(/\D/g, '');
    if (d.length !== 14) return v;
    return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12) + '-' + d.slice(12);
  }
  function trocarPais() {
    var ddi = form.ddi.value, br = ddi === '55';
    fundo.querySelector('[data-so="br"]').hidden = !br;
    form.telefone.placeholder = br ? '(11) 98888-7777' : (ddi ? 'Número com código de área' : '+ código do país e número');
    limparErros(['cnpj', 'empresa', 'telefone']);
  }
  // Brasil vai sem "+" (o servidor trata como Brasil); outro país vai em +DDI, sem o 0 de discagem local.
  function telefoneParaEnvio() {
    var ddi = form.ddi.value, t = form.telefone.value.trim();
    if (ddi === '55' || /^\+/.test(t)) return t;
    var d = t.replace(/\D/g, '');
    if (!ddi) return d ? '+' + d : '';
    if (ddi !== '39') d = d.replace(/^0+/, '');
    return '+' + ddi + d;
  }

  function limparErros(campos) {
    (campos || Object.keys(MSG)).forEach(function (c) { mostrarErro(c, ''); });
  }
  function mostrarErro(campo, texto) {
    var p = fundo.querySelector('[data-erro="' + campo + '"]');
    var input = form[campo];
    if (p) p.textContent = texto;
    if (input && input.setAttribute) input.setAttribute('aria-invalid', texto ? 'true' : 'false');
  }
  function marcarErros(erros) {
    var primeiro = null;
    erros.forEach(function (e) {
      if (!MSG[e]) return;
      mostrarErro(e, MSG[e]);
      if (!primeiro && form[e]) primeiro = form[e];
    });
    if (primeiro) primeiro.focus();
  }
  function checarAqui(c) {
    var erros = [];
    if (c.nome.trim().replace(/\s+/g, ' ').length < 3) erros.push('nome');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) erros.push('email');
    if (c.telefone.replace(/\D/g, '').length < 8) erros.push('telefone');
    if (c.cnpj && !cnpjValido(c.cnpj)) erros.push('cnpj');       // opcional, mas se vier tem de ser válido
    if (!c.consentimento) erros.push('consentimento');
    return erros;
  }

  function aoEnviar(ev) {
    ev.preventDefault();
    var botao = form.querySelector('.ct-enviar'), aviso = form.querySelector('.ct-aviso');
    if (botao.disabled) return;
    var br = form.ddi.value === '55';
    var cadastro = {
      nome: form.nome.value.trim(), email: form.email.value.trim(), telefone: telefoneParaEnvio(),
      cnpj: br ? form.cnpj.value.trim() : '', empresa: form.empresa.value.trim(),
      consentimento: form.consentimento.checked
    };
    limparErros();
    var erros = checarAqui(cadastro);
    if (erros.length) { marcarErros(erros); return; }

    botao.disabled = true;
    botao.textContent = 'Enviando…';
    aviso.textContent = '';
    var website = form.website.value;
    enviar(cadastro, produto, website).then(function (res) {
      return res.falhou ? enviar(cadastro, produto, website) : res;   // uma nova tentativa não duplica nada
    }).then(function (res) {
      botao.disabled = false;
      botao.textContent = 'Continuar';
      if (res.erros) {
        if (res.erros.indexOf('spam') >= 0) { aviso.textContent = 'Não foi possível enviar. Tente de novo.'; return; }
        marcarErros(res.erros);
        return;
      }
      if (res.falhou) { mostrarPronto(RESERVA, cadastro.nome, true); return; }
      gravar('localStorage', CHAVE, { cadastro: cadastro, resposta: res, em: Date.now() });
      mostrarPronto(res, cadastro.nome, false);
    });
  }

  function mostrarPronto(links, nome, reserva) {
    form.hidden = true;
    pronto.hidden = false;
    pronto.querySelector('.ct-nome').textContent = (nome || '').split(' ')[0] || 'tudo certo';
    pronto.querySelector('.ct-pronto-sub').textContent = reserva
      ? 'Não consegui registrar seus dados agora, mas você pode falar comigo direto:'
      : 'Já recebi seus dados. Como prefere seguir?';
    pronto.querySelector('.ct-zap').href = links.whatsapp_url;
    pronto.querySelector('.ct-agenda').href = links.agendar_url;
    pronto.querySelector('.ct-botoes').classList.toggle('ct-agenda-primeiro', intencao === 'agendar');
    pronto.querySelector('.ct-titulo').focus();
  }

  /* ---------- abrir e fechar ---------- */
  function abrir(el) {
    montar();
    gatilho = el;
    form.hidden = false;
    pronto.hidden = true;
    limparErros();
    form.querySelector('.ct-aviso').textContent = '';
    fundo.querySelector('#ct-titulo').innerHTML = intencao === 'agendar'
      ? 'Agendar uma <em>conversa</em>' : 'Vamos <em>conversar</em>';
    fundo.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { form.nome.focus(); }, 30);
  }
  function fechar() {
    if (!fundo || fundo.hidden) return;
    fundo.hidden = true;
    document.documentElement.style.overflow = '';
    if (gatilho && gatilho.focus) gatilho.focus();
  }
  function teclado(ev) {
    if (ev.key === 'Escape') { fechar(); return; }
    if (ev.key !== 'Tab') return;
    var focaveis = Array.prototype.filter.call(
      fundo.querySelectorAll('a[href], button, input:not(.ct-armadilha), select'),
      function (n) { return !n.disabled && n.offsetParent !== null; });
    if (!focaveis.length) return;
    var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
  }

  /* ---------- cliques nos CTAs ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-contato]') : null;
    if (!el) return;
    ev.preventDefault();
    intencao = el.getAttribute('data-contato') === 'agendar' ? 'agendar' : 'whatsapp';
    produto = el.getAttribute('data-produto') || 'geral';

    var g = guardado();
    if (g) {
      // Já tem cadastro: avisa a volta em segundo plano e abre o destino direto.
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: corpo(g.cadastro, produto, '') }).catch(function () {});
      var url = intencao === 'agendar' ? g.resposta.agendar_url : g.resposta.whatsapp_url;
      var aba = window.open(url, '_blank');
      if (aba) { try { aba.opener = null; } catch (e) {} return; }
      abrir(el);                                   // pop-up bloqueado: mostra os botões
      mostrarPronto(g.resposta, g.cadastro.nome, false);
      return;
    }
    abrir(el);
  });
})();
