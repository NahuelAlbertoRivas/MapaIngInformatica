async function iniciar(){

const res = await fetch("materias.json")
const data = await res.json()

let aprobadas = JSON.parse(localStorage.getItem("aprobadas") || "[]")

function estaAprobada(id){
 return aprobadas.includes(id)
}

function habilitada(materia){
 return materia.correlativas.every(c => aprobadas.includes(c))
}

let elementos = []

data.materias.forEach(m => {

 elementos.push({
  data:{ id:m.id, label:m.nombre }
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
  selector:"node",
  style:{
   label:"data(label)",
   "text-valign":"center",
   "text-halign":"center",
   "background-color":"#999",
   color:"#fff"
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
 }

 ],

 layout:{
  name:"breadthfirst",
  directed:true,
  padding:10
 }

})

function actualizarColores(){

 cy.nodes().forEach(node=>{

  let id=node.id()

  let materia=data.materias.find(m=>m.id===id)

  if(estaAprobada(id)){
   node.style("background-color","green")
  }
  else if(habilitada(materia)){
   node.style("background-color","orange")
  }
  else{
   node.style("background-color","gray")
  }

 })

}

cy.on("tap","node",evt=>{

 let id=evt.target.id()

 if(aprobadas.includes(id)){
  aprobadas=aprobadas.filter(x=>x!==id)
 }else{
  aprobadas.push(id)
 }

 localStorage.setItem("aprobadas",JSON.stringify(aprobadas))

 actualizarColores()

})

actualizarColores()

}

iniciar()