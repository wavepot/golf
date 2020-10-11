const PI = Math.PI
const TAU = 2*PI
export default (t='s') => {
  const xsin = (t,x) => Math.sin(t*x*TAU)
  const xsaw = (t,x) => 1-2*(t%(1/x))*x
  const xramp = (t,x) => 2*(t%(1/x))*x-1
  const xtri = (t,x) => Math.abs(1-(2*t*x)%2)*2-1
  const xsqr = (t,x) => (t*x%1/x<1/x/2)*2-1
  const xpulse = (t,x,w=.5) => (t*x%1/x<1/x/2*w)*2-1
  const xnoise = (t,p,x=123456) => {
    x=Math.sin(t,x+p)*100000
    return (t,x-Math.floor(t,x))*2-1
  }
  return { xsin, xsaw, xramp, xtri, xsqr, xpulse, xnoise }
}
