async function iniciar(){

const res = await fetch("materias.json")
const data = await res.json()

let aprobadas = JSON.parse(localStorage.getItem("aprobadas") || "[]")

// forzar array
if (!Array.isArray(aprobadas)) {
  aprobadas = []
  localStorage.setItem("aprobadas", JSON.stringify([]))
}

function estaAprobada(id){
 return aprobadas.includes(id)
}

function habilitada(materia){
 return materia.correlativas.every(c => aprobadas.includes(c))
}

cytoscape.use( cytoscapeDagre );

let padresPorAnio = {};

data.materias.forEach(m => {
  if(!padresPorAnio[m.anio]){
    padresPorAnio[m.anio] = {
      data: { id: "anio_" + m.anio, label: "Año " + m.anio },
      classes: "anio"
    };
  }
});

let elementos = Object.values(padresPorAnio);

data.materias.forEach(m => {

 elementos.push({
  data:{ id:m.id, label:m.nombre, parent:"anio_" + m.anio },
  classes: "materia"
 })

 m.correlativas.forEach(c => {
  elementos.push({
   data:{ source:c, target:m.id }
  })
 })

})

let cy = cytoscape({

 container: document.getElementById("cy"),

 elements: elementos,

 style:[

 {
 selector:"node.materia",
 style:{
  label:"data(label)",

  "text-wrap":"wrap",
  "text-max-width":"120px",

  "text-valign":"center",
  "text-halign":"center",

  "shape":"round-rectangle",

  "padding":"10px",

  "background-color":"#999",
  "color":"#fff",

  "width":"label",
  "height":"label",

  "font-size":"10px"
 }
},

 {
  selector:"edge",
  style:{
   width:2,
   "line-color":"#ccc",
   "target-arrow-color":"#ccc",
   "target-arrow-shape":"triangle"
  }
 },

 {
  selector: ".highlighted",
  style: {
    "border-color": "yellow",
    "border-width": "4px"
  }
 },

 {
 selector: ".relacionada",
 style: {
  "border-color": "#FFD700",
  "border-width": "4px"
 }
},
{
 selector: ".edge-relacionada",
 style: {
  "line-color": "#FFD700",
  "target-arrow-color": "#FFD700",
  "width": 4
 }
 },

 {
  selector: "node.anio",
  style: {
    "background-color": "#ddd",
    "shape": "roundrectangle",
    "padding": "20px",
    "text-valign": "top",
    "text-halign": "center",
    "font-weight": "bold",
    "color": "#333",
    "border-width": "2px",
    "border-color": "#bbb"
  }
 }

 ],

 layout: {
  name: 'dagre',
  rankDir: 'TB',   // de arriba hacia abajo
  nodeSep: 60,     // separación horizontal entre nodos
  rankSep: 120,   // separación vertical entre niveles (años)
  edgeSep: 10,
  animate: true
}

})

cy.ready(() => {
 setTimeout(()=>{
  actualizarColores()
  actualizarProgreso()
 },100)
})

const input = document.getElementById("buscador");

input.addEventListener("input", () => {
  const val = input.value.toLowerCase();
  if(val === ""){
    cy.nodes('node.materia').forEach(n => n.style("opacity", 1));
    return;
  }
  
  cy.nodes('node.materia').forEach(n => {
    const label = n.data("label").toLowerCase();
    if(label.includes(val)){
      n.style("opacity", 1);
    } else {
      n.style("opacity", 0.1);
    }
  });
});

input.addEventListener("keydown", e => {
  if(e.key === "Enter"){
    const val = input.value.toLowerCase();
    const node = cy.nodes('node.materia').filter(n => n.data("label").toLowerCase() === val);
    if(node.length > 0){
      cy.animate({
        center: { eles: node },
        duration: 500
      });
      node.flashClass("highlighted", 1000); // necesitas definir la clase en estilos
    }
  }
});

function actualizarColores(){

 const coloresPorAnio = {
  1: "#7FDBFF",
  2: "#39CCCC",
  3: "#0074D9",
  4: "#001f3f",
  5: "#FF4136"
 };
    
 cy.nodes('node.materia').forEach(node=>{

  let id=node.id()

  let materia=data.materias.find(m=>m.id===id)

  if(estaAprobada(id)){
   node.style("background-color","green")
  }
  else if(habilitada(materia)){
   node.style("background-color","#FF851B")
  }
  else{
   let colorAnio = coloresPorAnio[materia.anio] || "#999";
   node.style("background-color", colorAnio);
  }

 })

}

function limpiarRelaciones(){

 cy.nodes().removeClass("relacionada")
 cy.edges().removeClass("edge-relacionada")

}

function mostrarRelaciones(node){

 limpiarRelaciones()

 node.addClass("relacionada")

 let entrantes = node.incomers("edge")
 let salientes = node.outgoers("edge")

 entrantes.addClass("edge-relacionada")
 salientes.addClass("edge-relacionada")

 entrantes.sources().addClass("relacionada")
 salientes.targets().addClass("relacionada")

}

function animarDesbloqueo(nodos){

 nodos.forEach(node=>{

  node.animate({
   style:{
    "background-color":"#FFD700"
   }
  },{
   duration:300
  })

  setTimeout(()=>{
   node.animate({
    style:{
     "background-color":"orange"
    }
   },{
    duration:500
   })
  },300)

 })

}

function actualizarProgreso(){

 aprobadas = Array.isArray(aprobadas) ? aprobadas : []

 let total = data.materias.length
 let aprobadasCount = aprobadas.filter(id => data.materias.some(m => m.id === id)).length

 let porcentaje = Math.round((aprobadasCount / total) * 100)

 document.getElementById("progreso-texto").innerText =
  `Progreso de la carrera: ${aprobadasCount} / ${total} materias (${porcentaje}%)`

 document.getElementById("barra-progreso").style.width =
  porcentaje + "%"

}

cy.on("tap","node.materia",evt=>{

 let node = evt.target

 mostrarRelaciones(node)

 let habilitadasAntes = data.materias
 .filter(m => habilitada(m))
 .map(m => m.id)

 let id=node.id()

 let materia=data.materias.find(m=>m.id===id)

 let faltantes=materia.correlativas.filter(c=>!aprobadas.includes(c))

 if(faltantes.length>0){

  alert("Para cursar esta materia necesitas aprobar:\n\n"+faltantes.join("\n"))

  return
 }

 if(aprobadas.includes(id)){
  aprobadas=aprobadas.filter(x=>x!==id)
 }else{
  aprobadas.push(id)
 }

 localStorage.setItem("aprobadas",JSON.stringify(aprobadas))

 actualizarColores()
 actualizarProgreso()

 let habilitadasDespues = data.materias
 .filter(m => habilitada(m))
 .map(m => m.id)

 let nuevas = habilitadasDespues.filter(id => !habilitadasAntes.includes(id))

 let nodosAnimar = cy.nodes().filter(n => nuevas.includes(n.id()))

 animarDesbloqueo(nodosAnimar)

})

}

iniciar()