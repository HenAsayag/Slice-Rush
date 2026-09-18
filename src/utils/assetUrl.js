// Vite supplies '/' locally and '/Slice-Rush/' for the GitHub Pages build.
export function assetUrl(path) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}
