export default context => {
  const _ = context.mem.biquad

  const common = () => {
    _.w0 = _.pi2 * _.cut / _.sampleRate
    _.sin_w0 = Math.sin(_.w0)
    _.cos_w0 = Math.cos(_.w0)
    _.alpha = _.sin_w0 / (2.0 * _.res)
  }

  const lp1 = () => {
    _.w0 = _.pi2 * _.cut / _.sampleRate

    //_.a0 = 1.0
    _.a1 = -Math.exp(-_.w0)
    _.a2 = 0.0
    _.b0 = 1.0 + _.a1
    _.b1 = _.b2 = 0.0
  }

  const hp1 = () => {
    _.w0 = _.pi2 * _.cut / _.sampleRate

    //_.a0 = 1.0
    _.a1 = -Math.exp(-_.w0)
    _.a2 = 0.0
    _.b0 = (1.0 - _.a1) / 2.0
    _.b1 = -_.b0
    _.b2 = 0.0
  }

  const lp = () => {
    common()

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

  const hp = () => {
    common()

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

  const bp = () => {
    common()

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

  const bpp = () => {
    common()

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

  const not = () => {
    common()

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

  const ap = () => {
    common()

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

  const pk = () => {
    common()

    _.a = Math.pow(10.0, _.gain / 40.0)
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

  const ls = () => {
    common()

    _.a= Math.pow(10.0, _.gain / 40.0)
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

  const hs = () => {
    common()

    _.a= Math.pow(10.0, _.gain / 40.0)
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

  return {
    lp1, hp1,
    lp, hp,
    bp, bpp,
    not, ap, pk,
    ls, hs,
  }
}
