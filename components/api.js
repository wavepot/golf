// hacky way to switch api urls from dev to prod
const API_URL = location.port.length === 4
  ? 'http://localhost:3000' : location.origin

const mode = 'cors'

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

export const URL = API_URL

export const recent = async () => {
  const url = API_URL + '/recent'

  const res = await fetch(url, { mode, headers })

  const json = await res.json()

  return json
}

export const load = async (title) => {
  const url = title[0] === '.' ? title : API_URL + '/' + title

  const res = await fetch(url, { mode, headers })

  const json = await res.json()

  return json
}

export const save = async (projectJson) => {
  const url = API_URL + '/' + projectJson.title

  const res = await fetch(url, {
    method: 'POST',
    mode,
    headers,
    body: JSON.stringify(projectJson, null, 2)
  })

  const json = await res.json()

  return json
}
