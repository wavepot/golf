// dom helpers

export const El = (className = '', html = '', props = {}) => {
  const el = document.createElement(props.tag ?? 'div')
  el.className = className
  el.innerHTML = html
  Object.assign(el, props)
  return el
}

export const Button = (className, html, props = {}) =>
  El(className, html, { ...props, tag: 'button' })

export const Icon = (size, name, path, extra = '') =>
  Button(`icon ${name}`, `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${size}"
    height="${size}"
    viewBox="0 0 32 32"
    ><path class="path" d="${path}" />${extra}</svg>`)
