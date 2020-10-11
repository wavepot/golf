export default context => {
  const _ = context.mem.biquad

  const common = (cut, res) => {
    _.w0 = _.pi2 * cut / _.sampleRate
    _.sin_w0 = Math.sin(_.w0)
    _.cos_w0 = Math.cos(_.w0)
    _.alpha = _.sin_w0 / (_.v2 * res)
  }

  const lp1 = (cut) => {
    _.w0 = _.pi2 * cut / _.sampleRate

    //_.a0 =_.v1
    _.a1 = -Math.exp(-_.w0)
    _.a2 = _.v0
    _.b0 =_.v1 + _.a1
    _.b1 = _.b2 = _.v0
  }

  const hp1 = (cut) => {
    _.w0 = _.pi2 * cut / _.sampleRate

    //_.a0 =_.v1
    _.a1 = -Math.exp(-_.w0)
    _.a2 = _.v0
    _.b0 = (_.v1 - _.a1) / _.v2
    _.b1 = -_.b0
    _.b2 = _.v0
  }

  const lp = (cut, res=1) => {
    common(cut, res)

    _.b0 = (_.v1 - _.cos_w0) / _.v2
    _.b1 =_.v1 - _.cos_w0
    // _.b2 = _.b0
    _.a0 =_.v1 + _.alpha
    _.a1 = _.vm2 * _.cos_w0
    _.a2 =_.v1 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = _.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const hp = (cut, res=1) => {
    common(cut, res)

    _.b0 = (_.v1 + _.cos_w0) / _.v2
    _.b1 = -(_.v1 + _.cos_w0)
    // _.b2 = _.b0
    _.a0 =_.v1 + _.alpha
    _.a1 = _.vm2 * _.cos_w0
    _.a2 =_.v1 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = _.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const bp = (cut, res=1) => {
    common(cut, res)

    _.b0 = _.sin_w0 / _.v2
    _.b1 = _.v0
    // _.b2 = -_.b0
    _.a0 =_.v1 + _.alpha
    _.a1 = _.vm2 * _.cos_w0
    _.a2 =_.v1 - _.alpha

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
    _.b1 = _.v0
    // _.b2 = -_.alpha
    _.a0 =_.v1 + _.alpha
    _.a1 = _.vm2 * _.cos_w0
    _.a2 =_.v1 - _.alpha

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 = -_.b0
    // _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const not = (cut, res=1) => {
    common(cut, res)

    _.b0 =_.v1
    _.b1 = _.vm2 * _.cos_w0
    // _.b2 =_.v1
    _.a0 =_.v1 + _.alpha
    // _.a1 = _.b1
    _.a2 =_.v1 - _.alpha

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

    _.b0 =_.v1 - _.alpha
    _.b1 = _.vm2 * _.cos_w0
    _.b2 =_.v1 + _.alpha
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

    _.a = Math.pow(_.v10, gain / _.v40)
    _.b0 = _.v1 + _.alpha * _.a
    _.b1 = _.vm2 * _.cos_w0
    _.b2 = _.v1 - _.alpha * _.a
    _.a0 = _.v1 + _.alpha / _.a
    // _.a1 = _.b1
    _.a2 =_.v1 - _.alpha / _.a

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 = _.b1
    // _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const ls = (cut, res=1, gain=1) => {
    common(cut, res)

    _.a = Math.pow(_.v10, gain / _.v40)
    _.c = _.v2 * Math.sqrt(_.a) * _.alpha
    _.b0 = _.a* ((_.a +_.v1) - (_.a -_.v1) * _.cos_w0 + _.c)
    _.b1 = _.v2 *_.a* ((_.a -_.v1) - (_.a +_.v1) * _.cos_w0)
    _.b2 = _.a* ((_.a +_.v1) - (_.a -_.v1) * _.cos_w0 - _.c)
    _.a0 = (_.a +_.v1) + (_.a -_.v1) * _.cos_w0 + _.c
    _.a1 = _.vm2 * ((_.a -_.v1) + (_.a +_.v1) * _.cos_w0)
    _.a2 = (_.a +_.v1) + (_.a -_.v1) * _.cos_w0 - _.c

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  const hs = (cut, res=1, gain=1) => {
    common(cut, res)

    _.a = Math.pow(_.v10, gain / _.v40)
    _.c = _.v2 * Math.sqrt(_.a) * _.alpha
    _.b0 = _.a * ((_.a +_.v1) + (_.a -_.v1) * _.cos_w0 + _.c)
    _.b1 = _.vm2 *_.a* ((_.a -_.v1) + (_.a +_.v1) * _.cos_w0)
    _.b2 = _.a * ((_.a +_.v1) + (_.a -_.v1) * _.cos_w0 - _.c)
    _.a0 = (_.a +_.v1) - (_.a -_.v1) * _.cos_w0 + _.c
    _.a1 = _.v2 * ((_.a -_.v1) - (_.a +_.v1) * _.cos_w0)
    _.a2 = (_.a +_.v1) - (_.a -_.v1) * _.cos_w0 - _.c

    _.b0 /= _.a0
    _.b1 /= _.a0
    _.b2 /= _.a0
    _.a1 /= _.a0
    _.a2 /= _.a0
  }

  return {
    lp1, hp1,
    lp, hp,
    bp, bpp,
    not, ap, pk,
    ls, hs,
  }
}
