type BuildEnvironment = Record<string, string | undefined>;

export function resolveMapboxBuildToken(mode: string, env: BuildEnvironment) {
  const token = env.MAPBOX_TOKEN_WEB?.trim() || env.VITE_MAPBOX_TOKEN?.trim() || '';
  if (mode === 'production' && !token) {
    throw new Error('Production web build requires MAPBOX_TOKEN_WEB.');
  }
  return token;
}
