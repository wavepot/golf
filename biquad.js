import { parseFn } from './util.js'

export const Biquad = _ => {
  const common = (cut, res) => {
    _.w0 = _.pi2 * cut / _.sr
    _.sin_w0 = Math.sin(_.w0)
    _.cos_w0 = Math.cos(_.w0)
    _.alpha = _.sin_w0 / (2.0 * res)
  }

  const lp1 = (cut) => {
    _.w0 = _.pi2 * cut / _.sr

    //_.a0 = 1.0
    _.a1 = -Math.exp(-_.w0)
    _.a2 = 0.0
    _.b0 = 1.0 + _.a1
    _.b1 = _.b2 = 0.0
  }

  const hp1 = (cut) => {
    _.w0 = _.pi2 * cut / _.sr

    //_.a0 = 1.0
    _.a1 = -Math.exp(-_.w0)
    _.a2 = 0.0
    _.b0 = (1.0 - _.a1) / 2.0
    _.b1 = -_.b0
    _.b2 = 0.0
  }

  const lp = (cut, res=1) => {
    common(cut, res)

    _.b0 = (1.0 - _.cos_w0) / 2.0
    _.b1 = 1.0 - _.cos_w0
    // _.b2 = _.b0
    _.a0 = 1.0 + _.alpha
    _.a1 = -2.0 * _.cos_w0
    _.a2 = 1.0 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = _.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const hp = (cut, res=1) => {
    common(cut, res)

    _.b0 = (1.0 + _.cos_w0) / 2.0
    _.b1 = -(1.0 + _.cos_w0)
    // _.b2 = _.b0
    _.a0 = 1.0 + _.alpha
    _.a1 = -2.0 * _.cos_w0
    _.a2 = 1.0 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = _.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const bp = (cut, res=1) => {
    common(cut, res)

    _.b0 = _.sin_w0 / 2.0
    _.b1 = 0.0
    // _.b2 = -_.b0
    _.a0 = 1.0 + _.alpha
    _.a1 = -2.0 * _.cos_w0
    _.a2 = 1.0 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = -_.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const bpp = (cut, res=1) => {
    common(cut, res)

    _.b0 = _.alpha
    _.b1 = 0.0
    // _.b2 = -_.alpha
    _.a0 = 1.0 + _.alpha
    _.a1 = -2.0 * _.cos_w0
    _.a2 = 1.0 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = -_.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const not = (cut, res=1) => {
    common(cut, res)

    _.b0 = 1.0
    _.b1 = -2.0 * _.cos_w0
    // _.b2 = 1.0
    _.a0 = 1.0 + _.alpha
    // _.a1 = _.b1
    _.a2 = 1.0 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = _.b0
    // _.b2 /= _.a0
    _.a1 = _.b1
    // _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const ap = (cut, res=1) => {
    common(cut, res)

    _.b0 = 1.0 - _.alpha
    _.b1 = -2.0 * _.cos_w0
    _.b2 = 1.0 + _.alpha
    _.a0 = _.b2
    // _.a1 = _.b1
    // _.a2 = _.b0

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 = _.b1
    // _.a1 /= _.a0
    _.a2 = _.b0
    // _.a2 /= _.a0
  }

  const pk = (cut, res=1, gain=1) => {
    common(cut, res)

    _.a = Math.pow(10.0, gain / 40.0)
    _.b0 = 1.0 + _.alpha * _.a
    _.b1 = -2.0 * _.cos_w0
    _.b2 = 1.0 - _.alpha * _.a
    _.a0 = 1.0 + _.alpha / _.a
    // _.a1 = _.b1
    _.a2 = 1.0 - _.alpha / _.a

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 = _.b1
    // _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const ls = (cut, res=1, gain=1) => {
    common(cut, res)

    _.a= Math.pow(10.0, gain / 40.0)
    _.c = 2.0 * Math.sqrt(_.a) * _.alpha
    _.b0 =_.a* ((_.a + 1.0) - (_.a - 1.0) * _.cos_w0 + _.c)
    _.b1 = 2.0 *_.a* ((_.a - 1.0) - (_.a + 1.0) * _.cos_w0)
    _.b2 =_.a* ((_.a + 1.0) - (_.a - 1.0) * _.cos_w0 - _.c)
    _.a0 = (_.a + 1.0) + (_.a - 1.0) * _.cos_w0 + _.c
    _.a1 = -2.0 * ((_.a - 1.0) + (_.a + 1.0) * _.cos_w0)
    _.a2 = (_.a + 1.0) + (_.a - 1.0) * _.cos_w0 - _.c

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const hs = (cut, res=1, gain=1) => {
    common(cut, res)

    _.a= Math.pow(10.0, gain / 40.0)
    _.c = 2.0 * Math.sqrt(_.a) * _.alpha
    _.b0 =_.a* ((_.a + 1.0) + (_.a - 1.0) * _.cos_w0 + _.c)
    _.b1 = -2.0 *_.a* ((_.a - 1.0) + (_.a + 1.0) * _.cos_w0)
    _.b2 =_.a* ((_.a + 1.0) + (_.a - 1.0) * _.cos_w0 - _.c)
    _.a0 = (_.a + 1.0) - (_.a - 1.0) * _.cos_w0 + _.c
    _.a1 = 2.0 * ((_.a - 1.0) - (_.a + 1.0) * _.cos_w0)
    _.a2 = (_.a + 1.0) - (_.a - 1.0) * _.cos_w0 - _.c

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const filters = {
    lp1, hp1,
    lp, hp,
    bp, bpp,
    not, ap, pk,
    ls, hs,
  }

  return {
    common,
    filters,
  }
}

export default () => {
  const { common, filters } = Biquad({})

  const commonBody = parseFn(common).inner

  const compile = fn => {
    let { args, inner } = parseFn(fn)
    args.push('amt=1')
    inner = inner.replace('common(cut, res)', commonBody)

    let func
    eval(`func = function (${args}) {
      const c = this.c
      const f = c._filters[c._filter_index++]
      const _ = c.mem.biquad

      ${inner}

      f.y0 =
        b0*c.x0
      + b1*f.x1
      + b2*f.x2
      - a1*f.y1
      - a2*f.y2

      f.x2 = f.x1
      f.x1 = c.x0

      f.y2 = f.y1
      f.y1 = f.y0

      c.x0 = c.x0*(1-amt) + f.y0*amt

      return this
    }`)

    return func
  }

  const proto =
    Object.fromEntries(
    Object.entries(filters)
      .map(([name, fn]) => [name, compile(fn)]))

  return proto
}
