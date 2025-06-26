/******************************************************************************
 *                             CONSTANTS & GLOBALS                            *
 ******************************************************************************/

const GRAY = "#999999"
const DIY = 365.25 // days in year
const DIM = DIY/12 // days in month
const BTZ = Intl.DateTimeFormat().resolvedOptions().timeZone // browser timezone

/******************************************************************************
 *                             REACT-IVE WEBSITE                              *
 ******************************************************************************/

const exp   = Math.exp
const log   = Math.log
const abs   = Math.abs
const round = Math.round

function $(id) { return document.getElementById(id) } // convenience function

// Singular or Plural: Pluralize the given noun properly, if n is not 1. 
// Provide the plural version if irregular.
// Eg: splur(3, "boy") -> "3 boys", splur(3, "man", "men") -> "3 men"
function splur(n, noun, nounp='') {
  if (nounp === '') { nounp = noun+'s' }
  return n.toString()+' '+(n === 1 ? noun : nounp)
}

// Hyperbolically interpolate x to be in [c,d] as x ranges from a to b, with 
// hyper-parameter h. If h is -1 this is just lerp, if h is 0 it's exponential,
// and if h is 1 it's hyperbolic.
function blerp(h, x, a,b, c,d) { // nom: how bout a,b to A,B instead of to c,d?
  if (abs(a-b) < 1e-7) return x <= (a+b)/2 ? c : d // avoid division by 0
  //if (h===-1) return c + (x-a)/(b-a)*(d-c) // lerp case, just for efficiency
  const gexp = (h,x) => h===0 ? exp(x) : (1-h*x)**(-1/h) // generalized exp
  // Find the growth rate needed to make a exp/hyperbolic function with hyper-
  // parameter h go from c to d as its input goes from a to b:
  const r = (h, a,b, c,d) => h===0 ? log(d/c)/(b-a) : ((d/c)**-h-1)/h/(a-b)
  return c * gexp(h, r(h, a,b, c,d) * (x-a))
}

// Return the current date like "2021.06.15"
function ymd() {
  const o = new Date()
  const y = o.getFullYear()
  const m = 1 + o.getMonth()
  const d = o.getDate()
  return `${y}.${m < 10 ? '0' + m : m}.${d < 10 ? '0' + d : d}`
}

// Eval but just return null if syntax error. 
// Obviously don't use serverside with user-supplied input.
function laxeval(s) {
  try { 
    const x = eval(s)
    return typeof x === 'undefined' ? null : x
  } catch(e) { return null } 
}

// Handles fractions and percents and any arithmatic expression
function parsefrac(s) {
  s = s.replace(/^([^\%]*)\%(.*)$/, '($1)/100$2')
  const x = laxeval(s)
  return x===null ? NaN : x
}

function showfrac(x) {
  return (round(1000*x)/10) + '%'
}

// Parse a string representing a dollar amount
function par$e(s, vini=0) {
  s = s.replace(/vini/ig, vini) // temporary thing maybe
  s = s.replace(/\$/g, '') // strip out any dollar signs
  const x = laxeval(s)     // allow any arithmetic like "1/2" or whatever
  return x===null ? NaN : x
}

// Show a dollar amount as a string
function $how(x) {
  return isNaN(x) ? '0' : Math.round(100*x) / 100
}

function showdays(x) {
  return x==='' ? '?' : isNaN(x) ? '0' : round(x)
}

// Find the loan cost that yields the given interest rate.
// Mathematica solved this analytically so this is just pasting that in.
function flc(la, fr, mr, rt) {
  return -la - (fr*mr*log((DIM*la-DIM*exp(rt/DIY)*la+fr*mr) / (fr*mr))) / 
               (DIM*log(exp(rt/DIY)))
}

// -----------------------------------------------------------------------------
class Clauction extends React.Component {
  
constructor(props) { super(props); this.state = {
  tini: 0,
  tfin: 0,
  vini: 0,
  vfin: 0,
  vnow: 0,
  twon: 0,
  hero: "",
  hpar: -1,
  // upre, upost for the units
} }

plotit() {
  const h = this.state.hpar
  const a = this.state.tini
  const b = this.state.tfin
  const c = this.state.vini
  const d = this.state.vfin
  let data = []
  for (let x = a; x < b; x += .1) 
    data.push({x, "y": blerp(h, x, a,b, c,d)})
  const margin = { top: 20, right: 20, bottom: 30, left: 50 }
  const width  = 960 - margin.left - margin.right
  const height = 500 - margin.top  - margin.bottom
  const x = d3.scale.linear().range([0, width])
  const y = d3.scale.linear().range([height, 0])
  const xAxis = d3.svg.axis().scale(x).orient("bottom") 
  const yAxis = d3.svg.axis().scale(y).orient("left")
  const line = d3.svg.line().x(d => x(d.x)).y(d => y(d.y))
  const svg = d3.select("body").append("svg")
                 .attr("width",  width  + margin.left + margin.right)
                 .attr("height", height + margin.top  + margin.bottom)
                 .append("g")
                 .attr("transform", "translate("+margin.left+","+margin.top+")")
  x.domain(d3.extent(data, d => d.x))
  y.domain(d3.extent(data, d => d.y))
  svg.append("g").attr("class", "x axis")
                 .attr("transform", "translate(0," + height + ")").call(xAxis)
  svg.append("g").attr("class", "y axis").call(yAxis)
  svg.append("path").datum(data).attr("class", "line").attr("d", line)
}

// run every second to refresh (see tminder)
ticks = () => { // Glitch editor thinks there's a syntax error here but tis fine
  this.state.hero === "" ? this.setState({ twon: unixtm() }) : null
  //this.plotit()
}

componentWillMount = () => { setInterval(this.ticks, 1000) }

dtini = e => { // do this when the tini field changes
  const tini = parsedate(e.target.value)
  this.setState({ tini })
}

dtfin = e => { // do this when the tfin field changes
  const tfin = parsedate(e.target.value)
  this.setState({ tfin })
}

dvini = e => { // do this when the vini field changes
  const vini = par$e(e.target.value, this.state.vini)
  this.setState({ vini })
}

dvfin = e => { // do this when the vfin field changes
  const vfin = par$e(e.target.value, this.state.vini)
  this.setState({ vfin })
}

dhero = e => { // do this when the hero field changes
  const hero = e.target.value
  this.setState({ hero })
}

dtwon = e => { // do this when the twon field changes
  const twon = parsedate(e.target.value)
  this.setState({ twon })
}

dhpar = e => { // do this when the hpar field changes
  const hpar = par$e(e.target.value, this.state.vini)
  this.setState({ hpar })
}

render() { return ( <div>

<div className="control-group">

<label className="control-label" for="tini">
  Start time (YMDHMS):
</label>
<div className="controls">
  <input id="tini" className="form-control" type="text" autofocus
         placeholder=""
         onChange={this.dtini}/> &nbsp;
  <font color={GRAY}>{shd(parsedate(this.state.tini))}</font>
</div>
<br></br>
<label className="control-label" for="tfin">
  End time (YMDHMS):
</label>
<div className="controls">
  <input id="lc" className="form-control" type="text"
         placeholder="" 
         onChange={this.dtfin}/> &nbsp;
  <font color={GRAY}>{shd(parsedate(this.state.tfin))}</font>
</div>
<br></br>
<label className="control-label" for="vini">
  Start price:
</label>
<div className="controls">
  <input id="mr" className="form-control" type="text"
         placeholder="dollar value" 
         onChange={this.dvini}/>
</div>
<br></br>
<label className="control-label" for="vfin">
  End price:
</label>
<div className="controls">
  <input id="fr" className="form-control" type="text"
         placeholder="dollar value"
         onChange={this.dvfin}/>
</div>

</div> {/* end control group */}

<p></p>
<center><h1><font size="+40">${blerp(this.state.hpar, 
                            this.state.twon, 
                            this.state.tini,
                            this.state.tfin,
                            this.state.vini,
                            this.state.vfin)}</font></h1>
</center>
<p></p>

<label className="control-label" for="hero">
  Winner:
</label>
<div className="controls">
  <input id="hero" className="form-control" type="text"
         placeholder="your name here, hurry!"
         onChange={this.dhero}/>
</div>
<br></br>
<label className="control-label" for="twon">
  Won at:
</label>
<div className="controls">
  <input id="twon" className="form-control" type="text"
         placeholder=""
         onChange={this.dtwon}/> &nbsp;
</div>
<br></br>
<label className="control-label" for="hpar">
  Hyper-parameter:
</label>
<div className="controls">
  <input id="hpar" className="form-control" type="text"
         placeholder=""
         onChange={this.dhpar}/> &nbsp;
</div>

<font color="#FF0000">
<pre>
DEBUGGERY:<br></br>
hpar = {this.state.hpar}<br></br>
twon = {this.state.twon}<br></br>
tini = {this.state.tini}<br></br>
tfin = {this.state.tfin}<br></br>
vini = {this.state.vini}<br></br>
vfin = {this.state.vfin}<br></br>
</pre>
</font>
    
</div> ) } // end render

} // end class

ReactDOM.render(<Clauction/>, $('root'))

/******************************************************************************
 *                              STATIC WEBSITE                                *
 ******************************************************************************/

// -----------------------------------------------------------------------------
