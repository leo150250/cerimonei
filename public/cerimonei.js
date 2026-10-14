const divTituloCerimonial = document.getElementById("tituloCerimonial");
const divCerimonial = document.getElementById("cerimonial");
const dialogTimerTelaCheia = document.getElementById("timerTelaCheia");

const divComandoOk = document.createElement("div");
divComandoOk.classList.add("comandoOk");
divComandoOk.style.display="none";
document.body.appendChild(divComandoOk);

var cerimonial = null;
var autoRecolher = false;

function definirAcaoOkPorPressao(argElemento, argAcao) {
	let timerOk = null;
	let pointerIdAtivo = null;
	let inicioX = 0;
	let inicioY = 0;

	const cancelarGesto = () => {
		clearTimeout(timerOk);
		timerOk = null;
		pointerIdAtivo = null;
		omitirComandoOk();
		window.removeEventListener("pointermove", moverPonteiro);
		window.removeEventListener("pointerup", finalizarGesto);
		window.removeEventListener("pointercancel", finalizarGesto);
	};
	const moverPonteiro = (e) => {
		if (e.pointerId !== pointerIdAtivo) return;
		if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 12) {
			cancelarGesto();
		}
	};
	const finalizarGesto = (e) => {
		if (e.pointerId === pointerIdAtivo) cancelarGesto();
	};

	argElemento.addEventListener("pointerdown",(e)=>{
		if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
		pointerIdAtivo = e.pointerId;
		inicioX = e.clientX;
		inicioY = e.clientY;
		exibirComandoOk(e.clientX,e.clientY);
		timerOk = setTimeout(() => {
			argAcao();
			timerOk = null;
			omitirComandoOk();
		}, 1000);
		window.addEventListener("pointermove", moverPonteiro);
		window.addEventListener("pointerup", finalizarGesto);
		window.addEventListener("pointercancel", finalizarGesto);
	});
}

class ItemCerimonia {
	constructor() {
		this.status = 0;
		this.pai = null;
		this.conteudo = [];
		this.el = null;
	}
	adicionarSecao(argNome) {
		let novaSecao = new Secao(this,argNome);
		this.conteudo.push(novaSecao);
		return novaSecao;
	}
	adicionarBloco(argTexto) {
		let novoBloco = new Bloco(this,argTexto);
		this.conteudo.push(novoBloco);
		return novoBloco;
	}
	adicionarFala(argFala,argTexto) {
		let novaFala = new Fala(this,argFala,argTexto);
		this.conteudo.push(novaFala);
		return novaFala;
	}
	adicionarTimer(argTempo) {
		let novoTimer = new Timer(this,argTempo);
		this.conteudo.push(novoTimer);
		return novoTimer;
	}
	adicionarChamamento(argDados) {
		let novoChamamento = new Chamamento(this,argDados);
		this.conteudo.push(novoChamamento);
		return novoChamamento;
	}
	definirElementoOk(argElemento) {
		definirAcaoOkPorPressao(argElemento,()=>this.alternarOk(argElemento));
	}
	alternarOk(argElemento) {
		if (this.status == 0) {
			this.status = 1;
			argElemento.classList.add("ok");
		} else {
			this.status = 0;
			argElemento.classList.remove("ok");
		}
		if (this.pai !== null) {
			this.pai.checarOk();
		}
	}
	checarOk() {
		let semOk = false;
		this.conteudo.forEach(conteudo => {
			if (conteudo.status == 0) {
				semOk = true;
			}
		});
		if (!semOk) {
			this.status = 1;
			this.el.classList.add("ok");
		} else {
			this.status = 0;
			this.el.classList.remove("ok");
		}
		if (this.pai !== null) {
			this.pai.checarOk();
		}
	}
	obterUltimoStatus() {
		for (let i = this.conteudo.length - 1; i >= 0; i--) {
			const item = this.conteudo[i];
			if (item.conteudo && item.conteudo.length > 0) {
				const ultimo = item.obterUltimoStatus();
				if (ultimo !== null) {
					return ultimo;
				}
			}
			if (item.status === 1) {
				return item;
			}
		}
		return null;
	}
	obterProximoStatus() {
		for (const item of this.conteudo) {
			if (item.status === 0) {
				return item;
			}

			if (item.conteudo && item.conteudo.length > 0) {
				const proximo = item.obterProximoStatus();
				if (proximo !== null) {
					return proximo;
				}
			}
		}
		return null;
	}
}

class Cerimonia extends ItemCerimonia {
	constructor(argNome,argData) {
		super();
		this.nome = argNome;
		this.data = argData;

		cerimonial = this;
		divTituloCerimonial.innerText = this.nome;
		this.el = divCerimonial;
	}
}

class Secao extends ItemCerimonia {
	constructor(argPai,argNome) {
		super();
		this.nome = argNome;
		this.pai = argPai;

		this.recolhido = false;

		this.el = document.createElement("div");
		this.el.classList.add("area");
		this.el.classList.add("secao");
		this.elLegenda = document.createElement("div");
		this.elLegenda.classList.add("legenda");
		this.elLegenda.innerText = this.nome;
		this.botaoRecolher = document.createElement("button");
		this.botaoRecolher.innerText = "➖";
		this.botaoRecolher.onclick = (e)=>{
			this.alternarRecolher();
		}
		this.elLegenda.appendChild(this.botaoRecolher);
		this.pai.el.appendChild(this.elLegenda);

		this.pai.el.appendChild(this.el);
	}
	checarOk(argElemento) {
		super.checarOk(argElemento);
		if (autoRecolher) {
			if (this.status == 1) {
				this.el.classList.add("recolhido");
				this.recolhido = true;
				this.botaoRecolher.innerText = "➕";
			} else {
				this.el.classList.remove("recolhido");
				this.recolhido = false;
				this.botaoRecolher.innerText = "➖";
			}
		}
	}
	alternarRecolher() {
		if (!this.recolhido) {
			this.el.classList.add("recolhido");
			this.recolhido = true;
			this.botaoRecolher.innerText = "➕";
		} else {
			this.el.classList.remove("recolhido");
			this.recolhido = false;
			this.botaoRecolher.innerText = "➖";
		}
	}
}

class Bloco extends ItemCerimonia {
	constructor(argPai,argTexto) {
		super();
		this.texto = argTexto;
		this.pai = argPai;

		this.el = document.createElement("div");
		this.el.classList.add("area");
		this.definirElementoOk(this.el);
		this.el.classList.add("bloco");
		this.el.innerText = this.texto;

		this.pai.el.appendChild(this.el);
	}
}
class Fala extends ItemCerimonia {
	constructor(argPai,argFala,argTexto) {
		super();
		this.texto = argTexto;
		this.fala = argFala;
		this.pai = argPai;

		this.el = document.createElement("div");
		this.el.classList.add("area");
		this.definirElementoOk(this.el);
		this.el.classList.add("fala");

		this.elFala = document.createElement("div");
		this.elFala.innerText = this.fala;
		this.el.appendChild(this.elFala);
		
		this.el.innerHTML += this.texto;

		this.pai.el.appendChild(this.el);
	}
}
class Timer extends ItemCerimonia{
	constructor(argPai, argTempo = 60) {
		super();
		this.pai = argPai;
		this.tempo = argTempo;
		this.tempoAtual = this.tempo;

		this.timer = null;
		this.executando = false;
		this.telaCheia = false;
		
		this.el = document.createElement("div");
		this.el.classList.add("area");
		this.definirElementoOk(this.el);
		this.el.classList.add("timer");

		
		this.botaoPlayPause = document.createElement("button");
		this.botaoPlayPause.innerText = "▶️";
		this.botaoPlayPause.onclick = (e)=>{
			this.alternarPlayPause();
		}
		this.exibicaoTempo = document.createElement("div");
		this.exibicaoTempo.innerText = formatarTempo(this.tempoAtual);
		this.botaoStop = document.createElement("button");
		this.botaoStop.innerText = "⏹️";
		this.botaoStop.onclick = (e)=>{
			this.pararTimer();
		}
		this.elHr = document.createElement("hr");
		this.botaoTelaCheia = document.createElement("button");
		this.botaoTelaCheia.innerText = "Exibir tela-cheia";
		this.botaoTelaCheia.onclick = (e)=>{
			this.alternarTelaCheia();
		}

		this.el.appendChild(this.botaoPlayPause);
		this.el.appendChild(this.exibicaoTempo);
		this.el.appendChild(this.botaoStop);
		this.el.appendChild(this.elHr);
		this.el.appendChild(this.botaoTelaCheia);

		this.pai.el.appendChild(this.el);
	}
	alternarTelaCheia() {
		if (!this.telaCheia) {
			this.botaoTelaCheia.innerText = "Voltar ao cerimonial";
			dialogTimerTelaCheia.appendChild(this.exibicaoTempo);
			dialogTimerTelaCheia.appendChild(this.botaoPlayPause);
			dialogTimerTelaCheia.appendChild(this.botaoStop);
			dialogTimerTelaCheia.appendChild(this.elHr);
			dialogTimerTelaCheia.appendChild(this.botaoTelaCheia);
			dialogTimerTelaCheia.showModal();
			this.telaCheia = true;
		} else {
			this.botaoTelaCheia.innerText = "Exibir tela-cheia";
			this.el.appendChild(this.botaoPlayPause);
			this.el.appendChild(this.exibicaoTempo);
			this.el.appendChild(this.botaoStop);
			this.el.appendChild(this.elHr);
			this.el.appendChild(this.botaoTelaCheia);
			dialogTimerTelaCheia.close();
			this.telaCheia = false;
		}
	}
	alternarPlayPause() {
		if (!this.executando) {
			this.timer = setInterval(() => {
				this.tempoAtual -= 1;
				this.exibicaoTempo.innerText = formatarTempo(this.tempoAtual);
				if (this.tempoAtual < 0) {
					this.exibicaoTempo.classList.add("extrapolado");
				}
			}, 1000);
			this.executando = true;
			this.botaoPlayPause.innerText = "⏸️";
		} else {
			clearInterval(this.timer);
			this.executando = false;
			this.botaoPlayPause.innerText = "▶️";
		}
	}
	pararTimer() {
		if (this.executando) {
			this.alternarPlayPause();
		}
		this.tempoAtual = this.tempo;
		this.exibicaoTempo.innerText = formatarTempo(this.tempoAtual);
		this.exibicaoTempo.classList.remove("extrapolado");
	}
}

class Chamamento extends ItemCerimonia {
	constructor(argPai,argDados) {
		super();
		this.nomes = [];
		this.pai = argPai;
		this.nomeExibido = null;

		this.el = document.createElement("div");
		this.el.classList.add("area");
		this.el.className = "chamamento-listagem";

		this.elContador = document.createElement("div");
		this.elContador.classList.add("contador");
		this.el.appendChild(this.elContador);

		this.elAnterior = document.createElement("button");
		this.elAnterior.innerText = "⬅️";
		this.elAnterior.onclick = (e)=>{
			this.exibirNome(this.nomeExibido - 1);
		}
		this.el.appendChild(this.elAnterior);

		argDados.nomes.forEach(nome => {
			let novoNome = new Nome(this,nome.nome,nome.cargo,nome.titulo,nome.fonetica, nome.gen);
			this.el.appendChild(novoNome.el);
			this.nomes.push(novoNome);
		});

		this.elProximo = document.createElement("button");
		this.elProximo.innerText = "➡️";
		this.elProximo.onclick = (e)=>{
			this.exibirNome(this.nomeExibido + 1);
		}
		this.el.appendChild(this.elProximo);

		this.exibirNome(0);
		/*
		let lista = document.createElement("ul");
		this.nomes.forEach(item => {
			let linha = document.createElement("li");
			linha.innerText = item.cargo ? `${item.cargo} — ${item.nome}` : item.nome;
			lista.appendChild(linha);
		});
		this.el.appendChild(lista);
		*/
		this.pai.el.appendChild(this.el);
	}
	checarOk() {
		let semOk = false;
		this.nomes.forEach(nome => {
			if (nome.status == 0) {
				semOk = true;
			}
		});
		if (!semOk) {
			this.status = 1;
			this.el.classList.add("ok");
		} else {
			this.status = 0;
			this.el.classList.remove("ok");
		}

		if (this.pai !== null) {
			this.pai.checarOk();
		}
	}
	exibirNome(argIdNome) {
		if (argIdNome < 0) argIdNome = 0;
		if (argIdNome > this.nomes.length-1) argIdNome = this.nomes.length-1;
		if (this.nomeExibido !== null) {
			this.nomes[this.nomeExibido].el.removeAttribute("exibir");
		}
		this.nomeExibido = argIdNome;
		this.nomes[this.nomeExibido].el.setAttribute("exibir",true);

		this.elContador.innerText = (this.nomeExibido + 1) + " / " + (this.nomes.length);
	}
}

class Nome {
	constructor(argChamamento,argNome,argCargo = undefined,argTitulo = undefined, argFonetica = undefined, argGen = undefined) {
		this.chamamento = argChamamento;
		this.nome = argNome;
		this.cargo = argCargo;
		this.titulo = argTitulo;
		this.gen = argGen;
		this.status = 0;

		this.timerOk = null;

		if (this.titulo !== undefined) {
			if (!this.titulo.endsWith(" ")) {
				this.titulo += " ";
			}
		}
		this.fonetica = argFonetica;

		this.el = document.createElement("div");
		this.el.classList.add("nome");
		
		if (this.cargo !== undefined) {
			this.elCargo = document.createElement("p");
			this.elCargo.innerText = this.cargo;
			this.el.appendChild(this.elCargo);
		}

		this.elNome = document.createElement("p");
		this.elNome.classList.add("nome");
		if (this.gen !== undefined) {
			if (this.gen == "f") {
				this.elNome.innerHTML += "♀️";
			} else if (this.gen == "m") {
				this.elNome.innerHTML += "♂️";
			} else {
				this.elNome.innerHTML += "⚪";
			}
		}
		if (this.titulo !== undefined) {
			this.elTitulo = document.createElement("span");
			this.elTitulo.innerText = this.titulo;
			this.elNome.appendChild(this.elTitulo);
		}
		this.elNome.innerHTML += this.nome;
		this.el.appendChild(this.elNome);

		if (this.fonetica !== undefined) {
			this.elFonetica = document.createElement("p");
			this.elFonetica.classList.add("fonetica");
			this.elFonetica.innerText = "( "+this.fonetica+" )";
			this.el.appendChild(this.elFonetica);
		}
		definirAcaoOkPorPressao(this.el,()=>this.alternarOk(this.el));
	}
	alternarOk(argElemento) {
		if (this.status == 0) {
			this.status = 1;
			argElemento.classList.add("ok");
		} else {
			this.status = 0;
			argElemento.classList.remove("ok");
		}
		this.chamamento.checarOk();
	}
}

function formatarTempo(argSegundos) {
	argSegundos = Math.abs(argSegundos);
	let segundos = argSegundos % 60;
	let minutos = Math.floor(argSegundos / 60);
	let horas = Math.floor(argSegundos / 3600);
	return horas.toString() + ":" + minutos.toString().padStart(2,"0") + ":" + segundos.toString().padStart(2,"0");
}

function exibirComandoOk(argX,argY) {
	divComandoOk.style.display="block";
	divComandoOk.style.left = argX + "px";
	divComandoOk.style.top = argY + "px";
}
function omitirComandoOk() {
	divComandoOk.style.display="none";
}

function montarConteudoJSON(argPai,argJSONConteudo) {
	argJSONConteudo.forEach(conteudo => {
		switch (conteudo.tipo) {
			case "secao":
				let novaSecao = argPai.adicionarSecao(conteudo.nome);
				novaSecao.status = conteudo.status;
				montarConteudoJSON(novaSecao,conteudo.conteudo);
				break;
			case "bloco":
				let novoBloco = argPai.adicionarBloco(conteudo.conteudo);
				novoBloco.status = conteudo.status;
				break;
			case "fala":
				let novaFala = argPai.adicionarFala(conteudo.nome,conteudo.conteudo);
				novaFala.status = conteudo.status;
				break;
			case "timer":
				let novoTimer = argPai.adicionarTimer(conteudo.tempo);
				novoTimer.status = conteudo.status;
				break;
			case "chamamento-listagem":
				let novoChamamento = argPai.adicionarChamamento(conteudo);
				novoChamamento.status = conteudo.status;
				break;
		}
	});
}

function montarCerimonialJSON(argJSON) {
	new Cerimonia(argJSON.nome,argJSON.data);
	montarConteudoJSON(cerimonial,argJSON.conteudo);
	console.log(cerimonial);
}

function abrirCerimonial(argId) {
	let xmlCerimonial = new XMLHttpRequest();
	xmlCerimonial.onreadystatechange=(e)=>{
		if (xmlCerimonial.readyState==4 && xmlCerimonial.status==200) {
			let jsonCerimonial = JSON.parse(xmlCerimonial.responseText);
			montarCerimonialJSON(jsonCerimonial);
		}
	}
	//xmlCerimonial.open("GET","cerimonial.php?id="+argId); //Para usar um PHP pra resgatar cerimoniais, uma vez que o servidor estiver pronto
	xmlCerimonial.open("GET",argId+".json");
	xmlCerimonial.send();
}
abrirCerimonial("exemploColacaoDeGrau");