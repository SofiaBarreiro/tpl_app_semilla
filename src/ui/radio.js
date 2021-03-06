//INFO: punto de entrada de la parte que se ejecuta en la web

//------------------------------------------------------------
//S: mover a lib
//------------------------------------------------------------
function cmp_audio(my) { //U: un componente para reproducir audio
	my.render= function cmp_audio_render(props) {
		//eventos interesates onEnded: fLog("ended"), onLoadedmetadata: fLog("load")
		//SEE: https://www.w3schools.com/tags/ref_av_dom.asp
		return e({cmp: 'audio',controls: true, ... props}, [
				e({cmp:'source',src: props.src , type: "audio/ogg"})
		]);
	}
}

//------------------------------------------------------------
//S: app RADIO, api
//------------------------------------------------------------
function pathATitulo(k) { //U: separa ej "20200130_acordateDeMi" en fecha y titulo con espacios
  var partes= k.split('_');
	var titulo= 'Sin título'; //DFLT
	if (partes.length>1) { //A: si habia texto para el titulo
  	var enCamel= partes[1][0].toUpperCase()+partes[1].slice(1); //A: la primera en mayuscula, el resto como este
  	titulo= enCamel
			.replace(/([A-Z]*)/g,function (ignore,mayusculas) { return mayusculas.split('').join(' '); }) //A: separa mayusculas seguidas, meteles espacio en el medio
			.replace(/([a-z])([A-Z])/g,function (ignore,ult,pri) { return ult + " "+pri}); //A: cada vez que encuentro minuscula seguida de mayuscula, separo y pongo espacio
	}

	var fecha= partes[0].replace(/(\d\d\d\d)(\d\d)(\d\d)/,"$3/$2/$1");
  return {titulo: titulo, fecha: fecha};
}

RADIO_URL="https://www.podemosaprender.org/data_radio/";
RadioIdx= null; //DFLT
function radioFecth(wantsReload) {
	if (RadioIdx && !wantsReload) { return new Promise(cb => cb(RadioIdx)) }
	//A: si ya lo tenia, lo devolvi, sino lo busco
	return fetch(RADIO_URL+'programas.html?x='+Date.now())
		.then(r => r.text())
		.then(t => { 
			RadioIdx= {}; 
			console.log("El texto que traje es "+t);
			t.match(/<p>[^<]*/g) //A: array con todas las entradas desde <p>hasta<
			.sort()
			.forEach( f => {
				var parts= f.split("/"); parts.shift(); //A: tiro <p>.
				if (parts[1].match(/.ogg/)) { return } //A: no quiero los audios de entrada y salida
				var programa= RadioIdx[parts[1]] || {titulo: parts[1], audios: [RADIO_URL+'/audio/c_in.ogg']};
				RadioIdx[parts[1]]= programa; //A: seguro lo guarde e inicialice
				programa.audios.push(RADIO_URL+'/'+parts.join('/'));
			});

			Object.keys(RadioIdx).forEach(k => 
				RadioIdx[k].audios.push(RADIO_URL+'/audio/c_out.ogg')
			);
			return RadioIdx;
		});
}

//------------------------------------------------------------
//S: app RADIO, pantalla
//------------------------------------------------------------
function eMenu(elements) {
	return h(Cmp.Menu,{stackable: true, style: {marginBottom: '15px'}},
		h(Cmp.Container,{},
			elements.map(t => h(Cmp.Menu.Item,{ onClick: ()=> console.log(t)}, t.match(/(.png|.jpg)$/) ? h('img',{src: t}) : t))
		)
	);
}


function scr_radio_$programa(my) { //U: escuchar la radio, un programa, radio/miprograma
	var wantsPlay= false;
	var audios= null;
	var audioIdx= 0;
	var audioDone= false;
	var indexLoaded= false;

	function audioOnLoadedMetadata(e) {
		wantsPlay= true;
		//audioDuration: e.target.duration, 
		//TODO: no puedo cambiar estado en este evento porque vuelve a hacer render, y elemento de audio pierde estado, carga de nuevo, etc.
	}

	function audioOnEnded() {
		if (audioIdx<audios.length-1) { audioIdx++; }
		else { audioDone= true; }
		my.refresh(); //A: redibujar
	}

	function volverAEscuchar() {
		wantsPlay= true;
		audioIdx= 0; audioDone= false;
		my.refresh();
	}

	my.componentWillMount= function () {
		radioFecth()
			.then(() => {indexLoaded= true; my.refresh() }); //A: cargue lista de programas
	}

	my.render= function (props, state) { 
		audioIdx= audioIdx || 0; 
		programa= props.matches.programa;
		audios= RadioIdx && RadioIdx[programa] && RadioIdx[programa].audios
		console.log("Radio programa="+programa+" audios="+audios);

		var contenido= 'Cargando programa '+programa;

		if (indexLoaded) { //A: si ya cargamos la lista de audios
			if (audioDone) { //A: se termino el ultimo
				contenido= eAct(volverAEscuchar,'Volver a escuchar'); 
			}
			else { //A: quedan para escuchar
				var titulo= "(" + audioIdx + "/" + audios.length+") "+audios[audioIdx];

				contenido= eGroup([
					h('h4',{},titulo),

					h(Cmp.audio,{
						src: audios[audioIdx], 
						onEnded: audioOnEnded, 
						onLoadedmetadata: audioOnLoadedMetadata, 
						autoplay: wantsPlay
					}),

					eGroup([ //A: en un div para que quede en una linea saparada
						eAct(audioOnEnded,'Próximo')
					])
				]);
			}
		}

		return eGroup([
			h('h1',{},'Radio PodemosAprender'),
			h('h2',{},programa),
			contenido,
			eAct(fAppGoTo('/radio'),'Volver a la lista')
		]);
	}
}

function eRadio_programa_boton(k) { //U: para la lista de programas, un boton para un programa
	return eAct(
		k,
		fAppGoTo('/radio/'+k),
		{
			icon: 'play', 
			labelPosition: 'right',
			style: {display: 'block', margin: '5px'}
		}); 
}
	
function eRadio_programa_card(k) { //U: para la lista de programas, una tarjeta en vez de solo boton
	//SEE: https://react.semantic-ui.com/views/card/#types-groups
	var datos= pathATitulo(k);

	return h(Cmp.Card,{},
		h(Cmp.Card.Content, {},
			h(Cmp.Image, {floated:'right',size:'mini',src:'imagenes/logo.png'}),
			h(Cmp.Card.Header,{},
				datos.titulo,
				h('p',{style: {fontSize: '50%', color: 'gray'}}, '('+datos.fecha+')'),
			),
			h(Cmp.Card.Description,{},'Nos mandamos tremenda descripción. Somos unos genios!'),
		),	
		h(Cmp.Card.Content, {extra: true, style: {textAlign: 'center'}}, 
			eAct('escuchar',{icon:'play'}, fAppGoTo('/radio/'+k))
		)
	);
}

function scr_radio(my) { //U: escuchar la radio, ver programas
	var indexLoaded= false;

	my.componentWillMount= function () {
		radioFecth()
			.then(() => {indexLoaded= true; my.refresh()}); //A: cargue lista de programas
	}

	my.render= function (props, state) { 
		var eProgramas= 'Cargando programas ...'; //DFLT: lista de programas
		if (indexLoaded) {
			var elementos= Object.keys(RadioIdx).sort();
			eProgramas= h(Cmp.Container,{},h(Cmp.Card.Group, {centered: true}, elementos.map( eRadio_programa_card ))); //TODO: generalizar
		}

		return eGroup([
			eMenu(['imagenes/logo.png','Este es','el menu']),	
			eProgramas
		]);
	}

}

//-----------------------------------------------------------------------------
//S: inicio
Routes["/"]= {cmp: "scr_radio"}
