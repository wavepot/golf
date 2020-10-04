export const toFinite = n => Number.isFinite(n) ? n : 0

export const clamp = (min, max, n) => Math.max(min, Math.min(max, n))

export const proxify = (context,[begin,end],parent) => {
  const acc = []

  const add = (a0,a1,a2,a3,a4) => {
    acc[acc.length-1].push(a0,a1,a2,a3,a4)
    return proxy
  }

  const run = () => {
    acc.splice(0).forEach(([method,a0,a1,a2,a3,a4]) =>
      parent[method](a0,a1,a2,a3,a4))
  }

  const toParent = () => parent

  const handler = {
    get (obj, prop) {
      if (prop === 'end') {
        end(run, context)
        return toParent
      }
      acc.push([prop])
      return add
    },
    apply (obj, thisArg, args) {
      end(run, context)
      return parent
    }
  }

  const proxy = new Proxy(() => {}, handler)

  return (a0,a1,a2,a3,a4) => {
    acc.splice(0)
    begin(context,a0,a1,a2,a3,a4)
    return proxy
  }
}
