let tokenGetter = null

export function setAuthToken(getter) {
  tokenGetter = getter
}

export async function getAuthToken() {
  if (!tokenGetter) return ""
  try {
    return await tokenGetter()
  } catch (e) {
    console.error("Failed to get auth token", e)
    return ""
  }
}